import { useProjectStore } from '../store/projectStore';
import { createEQ, createCompressor, createReverb, createDelay, createDistortion, type EffectNode } from './effects';

class AudioEngine {
    private static instance: AudioEngine;
    private audioContext: AudioContext | null = null;
    private masterGain: GainNode | null = null;
    private trackNodes: Map<string, { gain: GainNode; pan: StereoPannerNode }> = new Map();
    private trackInputNodes: Map<string, GainNode> = new Map();
    private trackEffects: Map<string, EffectNode[]> = new Map();
    private scheduledSources: Map<string, AudioBufferSourceNode[]> = new Map();
    private animationFrameId: number | null = null;
    private startTime: number = 0;
    private pausedPosition: number = 0;

    private constructor() { }

    static getInstance(): AudioEngine {
        if (!AudioEngine.instance) {
            AudioEngine.instance = new AudioEngine();
        }
        return AudioEngine.instance;
    }

    async init(): Promise<void> {
        if (this.audioContext) return;

        this.audioContext = new AudioContext();
        this.masterGain = this.audioContext.createGain();
        this.masterGain.connect(this.audioContext.destination);

        // Resume context on user interaction
        if (this.audioContext.state === 'suspended') {
            await this.audioContext.resume();
        }
    }

    getContext(): AudioContext | null {
        return this.audioContext;
    }

    getMasterGain(): GainNode | null {
        return this.masterGain;
    }

    setMasterVolume(volume: number): void {
        if (this.masterGain) {
            this.masterGain.gain.value = volume;
        }
    }

    async createTrackNodes(trackId: string): Promise<{ gain: GainNode; pan: StereoPannerNode } | null> {
        if (!this.audioContext || !this.masterGain) return null;

        // Check if nodes already exist
        if (this.trackNodes.has(trackId)) {
            return this.trackNodes.get(trackId)!;
        }

        const gain = this.audioContext.createGain();
        const pan = this.audioContext.createStereoPanner();
        const input = this.audioContext.createGain(); // Entry point for sources

        // Store input node
        this.trackInputNodes.set(trackId, input);

        // Connect Pan -> Gain -> Master (Output stage)
        pan.connect(gain);
        gain.connect(this.masterGain);

        const nodes = { gain, pan };
        this.trackNodes.set(trackId, nodes);

        // Initial chain rebuild to connect Input -> [Effects] -> Pan
        await this.rebuildTrackChain(trackId);

        return nodes;
    }

    async rebuildTrackChain(trackId: string): Promise<void> {
        if (!this.audioContext) return;

        const input = this.trackInputNodes.get(trackId);
        const output = this.trackNodes.get(trackId);
        if (!input || !output) return;

        // Cleanup existing effects
        const existingEffects = this.trackEffects.get(trackId) || [];
        existingEffects.forEach(effect => {
            effect.input.disconnect();
            effect.output.disconnect();
            effect.dispose();
        });

        // Get fresh effects from store
        const track = useProjectStore.getState().getTrackById(trackId);
        if (!track) return;

        const newEffects: EffectNode[] = [];
        let previousNode: AudioNode = input;

        // Temporarily disconnect input to avoid glitches while rebuilding
        input.disconnect();

        for (const effectData of track.effects) {
            if (!effectData.enabled) continue;

            let effectNode: EffectNode | null = null;

            switch (effectData.type) {
                case 'eq':
                    effectNode = createEQ(this.audioContext);
                    break;
                case 'compressor':
                    effectNode = createCompressor(this.audioContext);
                    break;
                case 'reverb':
                    effectNode = await createReverb(this.audioContext);
                    break;
                case 'delay':
                    effectNode = createDelay(this.audioContext);
                    break;
                case 'gain': // distortion
                    effectNode = createDistortion(this.audioContext);
                    break;
            }

            if (effectNode) {
                // Apply parameters
                Object.entries(effectData.params).forEach(([key, value]) => {
                    const param = effectNode!.params[key];
                    if (param && 'value' in param && typeof param.value === 'number') {
                        param.value = value;
                    } else if (param instanceof AudioParam) {
                        param.value = value;
                    }
                });

                previousNode.connect(effectNode.input);
                previousNode = effectNode.output;
                newEffects.push(effectNode);
            }
        }

        // Connect last node to output pan
        previousNode.connect(output.pan);
        this.trackEffects.set(trackId, newEffects);
    }

    updateTrackVolume(trackId: string, volume: number): void {
        const nodes = this.trackNodes.get(trackId);
        if (nodes) {
            nodes.gain.gain.value = volume;
        }
    }

    updateTrackPan(trackId: string, pan: number): void {
        const nodes = this.trackNodes.get(trackId);
        if (nodes) {
            nodes.pan.pan.value = pan;
        }
    }

    muteTrack(trackId: string, mute: boolean): void {
        const nodes = this.trackNodes.get(trackId);
        if (nodes) {
            nodes.gain.gain.value = mute ? 0 : useProjectStore.getState().getTrackById(trackId)?.volume ?? 0.8;
        }
    }

    async loadAudioFile(file: File): Promise<{ buffer: AudioBuffer; waveformData: number[] }> {
        if (!this.audioContext) {
            await this.init();
        }

        const arrayBuffer = await file.arrayBuffer();
        const audioBuffer = await this.audioContext!.decodeAudioData(arrayBuffer);
        const waveformData = this.extractWaveformData(audioBuffer);

        return { buffer: audioBuffer, waveformData };
    }

    private extractWaveformData(buffer: AudioBuffer, samples: number = 200): number[] {
        const channelData = buffer.getChannelData(0);
        const blockSize = Math.floor(channelData.length / samples);
        const waveformData: number[] = [];

        for (let i = 0; i < samples; i++) {
            let sum = 0;
            for (let j = 0; j < blockSize; j++) {
                sum += Math.abs(channelData[i * blockSize + j]);
            }
            waveformData.push(sum / blockSize);
        }

        // Normalize
        const max = Math.max(...waveformData);
        return waveformData.map(v => v / max);
    }

    scheduleRegion(
        trackId: string,
        buffer: AudioBuffer,
        regionStartTime: number,
        offset: number = 0,
        duration?: number
    ): void {
        if (!this.audioContext) return;

        const inputNode = this.trackInputNodes.get(trackId);
        if (!inputNode) return;

        const source = this.audioContext.createBufferSource();
        source.buffer = buffer;
        source.connect(inputNode);

        const currentTime = this.audioContext.currentTime;
        const transportPosition = useProjectStore.getState().transport.position;

        // Calculate when this region should start
        const regionOffsetFromNow = regionStartTime - transportPosition;

        if (regionOffsetFromNow >= 0) {
            // Region hasn't started yet
            source.start(currentTime + regionOffsetFromNow, offset, duration);
        } else if (regionOffsetFromNow + (duration || buffer.duration) > 0) {
            // Region is in progress
            const skipAmount = -regionOffsetFromNow;
            source.start(currentTime, offset + skipAmount, (duration || buffer.duration) - skipAmount);
        }

        // Track sources for stopping
        if (!this.scheduledSources.has(trackId)) {
            this.scheduledSources.set(trackId, []);
        }
        this.scheduledSources.get(trackId)!.push(source);
    }

    async play(): Promise<void> {
        if (!this.audioContext) return;

        const store = useProjectStore.getState();
        this.startTime = this.audioContext.currentTime - this.pausedPosition;

        // Schedule all regions
        for (const track of store.project.tracks) {
            if (track.mute) continue;

            await this.createTrackNodes(track.id);
            this.updateTrackVolume(track.id, track.volume);
            this.updateTrackPan(track.id, track.pan);

            track.regions.forEach(region => {
                if (region.audioBuffer) {
                    this.scheduleRegion(
                        track.id,
                        region.audioBuffer,
                        region.startTime,
                        region.offset,
                        region.duration
                    );
                }
            });
        }

        // Start position update loop
        this.startPositionUpdate();
    }

    private startPositionUpdate(): void {
        const update = () => {
            if (!this.audioContext) return;

            const store = useProjectStore.getState();
            if (!store.transport.isPlaying) return;

            const currentPosition = this.audioContext.currentTime - this.startTime;

            // Handle looping
            if (store.transport.isLooping) {
                if (currentPosition >= store.transport.loopEnd) {
                    this.stop();
                    store.setPosition(store.transport.loopStart);
                    this.pausedPosition = store.transport.loopStart;
                    this.play();
                    store.play();
                    return;
                }
            }

            store.setPosition(currentPosition);
            this.animationFrameId = requestAnimationFrame(update);
        };

        this.animationFrameId = requestAnimationFrame(update);
    }

    pause(): void {
        if (!this.audioContext) return;

        this.pausedPosition = useProjectStore.getState().transport.position;
        this.stopAllSources();

        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
    }

    stop(): void {
        this.pausedPosition = 0;
        this.stopAllSources();

        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
    }

    private stopAllSources(): void {
        this.scheduledSources.forEach(sources => {
            sources.forEach(source => {
                try {
                    source.stop();
                } catch (e) {
                    // Source may have already stopped
                }
            });
        });
        this.scheduledSources.clear();
    }

    seekTo(position: number): void {
        const wasPlaying = useProjectStore.getState().transport.isPlaying;

        if (wasPlaying) {
            this.stop();
        }

        this.pausedPosition = position;
        useProjectStore.getState().setPosition(position);

        if (wasPlaying) {
            this.play();
        }
    }

    // Recording
    private mediaRecorder: MediaRecorder | null = null;
    private recordedChunks: Blob[] = [];

    async startRecording(): Promise<void> {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            this.mediaRecorder = new MediaRecorder(stream);
            this.recordedChunks = [];

            this.mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    this.recordedChunks.push(e.data);
                }
            };

            this.mediaRecorder.start();
        } catch (err) {
            console.error('Failed to start recording:', err);
            throw err;
        }
    }

    async stopRecording(): Promise<{ buffer: AudioBuffer; waveformData: number[] } | null> {
        if (!this.mediaRecorder || !this.audioContext) return null;

        return new Promise((resolve) => {
            this.mediaRecorder!.onstop = async () => {
                const blob = new Blob(this.recordedChunks, { type: 'audio/webm' });
                const arrayBuffer = await blob.arrayBuffer();

                try {
                    const audioBuffer = await this.audioContext!.decodeAudioData(arrayBuffer);
                    const waveformData = this.extractWaveformData(audioBuffer);
                    resolve({ buffer: audioBuffer, waveformData });
                } catch (err) {
                    console.error('Failed to decode recorded audio:', err);
                    resolve(null);
                }
            };

            this.mediaRecorder!.stop();
            this.mediaRecorder!.stream.getTracks().forEach(track => track.stop());
        });
    }

    // Metering
    createAnalyser(trackId: string): AnalyserNode | null {
        if (!this.audioContext) return null;

        const nodes = this.trackNodes.get(trackId);
        if (!nodes) return null;

        const analyser = this.audioContext.createAnalyser();
        analyser.fftSize = 256;
        nodes.gain.connect(analyser);

        return analyser;
    }
}

export const audioEngine = AudioEngine.getInstance();
export default audioEngine;
