// Project save/load and WAV export utilities

import type { Project, Track } from '../types/project';

// Save project to JSON file
export function saveProject(project: Project): void {
    // Create a serializable version (without AudioBuffer)
    const serializable = {
        ...project,
        tracks: project.tracks.map(track => ({
            ...track,
            regions: track.regions.map(region => ({
                ...region,
                audioBuffer: undefined, // Can't serialize AudioBuffer
                audioUrl: region.audioUrl, // Keep URL for reloading
            })),
        })),
    };

    const json = JSON.stringify(serializable, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.name.replace(/[^a-z0-9]/gi, '_')}.musicboi`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Load project from file
export function loadProject(file: File): Promise<Project> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const project = JSON.parse(e.target?.result as string) as Project;
                project.createdAt = new Date(project.createdAt);
                project.modifiedAt = new Date(project.modifiedAt);
                resolve(project);
            } catch (err) {
                reject(new Error('Invalid project file'));
            }
        };
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsText(file);
    });
}

// Export project to WAV
export async function exportToWav(
    _audioContext: AudioContext,
    tracks: Track[],
    duration: number,
    sampleRate: number = 44100
): Promise<Blob> {
    // Create offline context for rendering
    const offlineContext = new OfflineAudioContext(2, sampleRate * duration, sampleRate);
    const masterGain = offlineContext.createGain();
    masterGain.connect(offlineContext.destination);

    // Check if any tracks have solo enabled
    const hasSolo = tracks.some(t => t.solo);

    // Render each track
    for (const track of tracks) {
        // Skip muted tracks or non-solo tracks when solo is active
        if (track.mute) continue;
        if (hasSolo && !track.solo) continue;

        // Create track nodes
        const trackGain = offlineContext.createGain();
        const trackPan = offlineContext.createStereoPanner();

        trackGain.gain.value = track.volume;
        trackPan.pan.value = track.pan;

        trackPan.connect(trackGain);
        trackGain.connect(masterGain);

        // Schedule all regions
        for (const region of track.regions) {
            if (!region.audioBuffer) continue;

            // Copy buffer to offline context
            const buffer = offlineContext.createBuffer(
                region.audioBuffer.numberOfChannels,
                region.audioBuffer.length,
                region.audioBuffer.sampleRate
            );

            for (let i = 0; i < region.audioBuffer.numberOfChannels; i++) {
                buffer.copyToChannel(region.audioBuffer.getChannelData(i), i);
            }

            const source = offlineContext.createBufferSource();
            source.buffer = buffer;
            source.connect(trackPan);

            // Apply region gain
            const regionGain = offlineContext.createGain();
            regionGain.gain.value = region.gain;
            source.connect(regionGain);
            regionGain.connect(trackPan);

            // Schedule playback
            const startTime = Math.max(0, region.startTime);
            const offset = region.offset || 0;
            const playDuration = Math.min(region.duration, duration - startTime);

            if (playDuration > 0) {
                source.start(startTime, offset, playDuration);
            }
        }
    }

    // Render audio
    const renderedBuffer = await offlineContext.startRendering();

    // Convert to WAV
    return audioBufferToWav(renderedBuffer);
}

// Convert AudioBuffer to WAV Blob
function audioBufferToWav(buffer: AudioBuffer): Blob {
    const numChannels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const format = 1; // PCM
    const bitDepth = 16;

    const bytesPerSample = bitDepth / 8;
    const blockAlign = numChannels * bytesPerSample;

    const dataLength = buffer.length * blockAlign;
    const headerLength = 44;
    const totalLength = headerLength + dataLength;

    const arrayBuffer = new ArrayBuffer(totalLength);
    const view = new DataView(arrayBuffer);

    // Write WAV header
    writeString(view, 0, 'RIFF');
    view.setUint32(4, totalLength - 8, true);
    writeString(view, 8, 'WAVE');
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true); // fmt chunk size
    view.setUint16(20, format, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * blockAlign, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitDepth, true);
    writeString(view, 36, 'data');
    view.setUint32(40, dataLength, true);

    // Write audio data
    const channels: Float32Array[] = [];
    for (let i = 0; i < numChannels; i++) {
        channels.push(buffer.getChannelData(i));
    }

    let offset = 44;
    for (let i = 0; i < buffer.length; i++) {
        for (let channel = 0; channel < numChannels; channel++) {
            const sample = Math.max(-1, Math.min(1, channels[channel][i]));
            const value = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
            view.setInt16(offset, value, true);
            offset += 2;
        }
    }

    return new Blob([arrayBuffer], { type: 'audio/wav' });
}

function writeString(view: DataView, offset: number, string: string): void {
    for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
    }
}

// Download WAV file
export function downloadWav(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename.endsWith('.wav') ? filename : `${filename}.wav`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Calculate project duration from tracks
export function calculateProjectDuration(tracks: Track[]): number {
    let maxDuration = 0;
    for (const track of tracks) {
        for (const region of track.regions) {
            const endTime = region.startTime + region.duration;
            if (endTime > maxDuration) {
                maxDuration = endTime;
            }
        }
    }
    return Math.max(maxDuration, 10); // Minimum 10 seconds
}
