// Audio Effects for the DAW

export interface EffectNode {
    input: AudioNode;
    output: AudioNode;
    params: Record<string, AudioParam | { value: number }>;
    dispose: () => void;
}

// EQ Effect - 3-band parametric equalizer
export function createEQ(context: AudioContext): EffectNode {
    const lowShelf = context.createBiquadFilter();
    lowShelf.type = 'lowshelf';
    lowShelf.frequency.value = 320;
    lowShelf.gain.value = 0;

    const mid = context.createBiquadFilter();
    mid.type = 'peaking';
    mid.frequency.value = 1000;
    mid.Q.value = 1;
    mid.gain.value = 0;

    const highShelf = context.createBiquadFilter();
    highShelf.type = 'highshelf';
    highShelf.frequency.value = 3200;
    highShelf.gain.value = 0;

    lowShelf.connect(mid);
    mid.connect(highShelf);

    return {
        input: lowShelf,
        output: highShelf,
        params: {
            lowGain: lowShelf.gain,
            lowFreq: lowShelf.frequency,
            midGain: mid.gain,
            midFreq: mid.frequency,
            midQ: mid.Q,
            highGain: highShelf.gain,
            highFreq: highShelf.frequency,
        },
        dispose: () => {
            lowShelf.disconnect();
            mid.disconnect();
            highShelf.disconnect();
        },
    };
}

// Compressor Effect
export function createCompressor(context: AudioContext): EffectNode {
    const compressor = context.createDynamicsCompressor();
    compressor.threshold.value = -24;
    compressor.knee.value = 30;
    compressor.ratio.value = 4;
    compressor.attack.value = 0.003;
    compressor.release.value = 0.25;

    const makeupGain = context.createGain();
    makeupGain.gain.value = 1;

    compressor.connect(makeupGain);

    return {
        input: compressor,
        output: makeupGain,
        params: {
            threshold: compressor.threshold,
            knee: compressor.knee,
            ratio: compressor.ratio,
            attack: compressor.attack,
            release: compressor.release,
            makeupGain: makeupGain.gain,
        },
        dispose: () => {
            compressor.disconnect();
            makeupGain.disconnect();
        },
    };
}

// Reverb Effect using convolution
export async function createReverb(context: AudioContext, decayTime: number = 2): Promise<EffectNode> {
    const convolver = context.createConvolver();
    const wetGain = context.createGain();
    const dryGain = context.createGain();
    const input = context.createGain();
    const output = context.createGain();

    wetGain.gain.value = 0.3;
    dryGain.gain.value = 0.7;

    // Generate impulse response
    const sampleRate = context.sampleRate;
    const length = sampleRate * decayTime;
    const impulse = context.createBuffer(2, length, sampleRate);

    for (let channel = 0; channel < 2; channel++) {
        const channelData = impulse.getChannelData(channel);
        for (let i = 0; i < length; i++) {
            // Exponential decay with some randomness
            channelData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 2);
        }
    }

    convolver.buffer = impulse;

    input.connect(dryGain);
    input.connect(convolver);
    convolver.connect(wetGain);
    dryGain.connect(output);
    wetGain.connect(output);

    return {
        input,
        output,
        params: {
            wet: wetGain.gain,
            dry: dryGain.gain,
        },
        dispose: () => {
            input.disconnect();
            convolver.disconnect();
            wetGain.disconnect();
            dryGain.disconnect();
            output.disconnect();
        },
    };
}

// Delay Effect
export function createDelay(context: AudioContext): EffectNode {
    const delay = context.createDelay(2);
    const feedback = context.createGain();
    const wetGain = context.createGain();
    const dryGain = context.createGain();
    const input = context.createGain();
    const output = context.createGain();

    delay.delayTime.value = 0.25;
    feedback.gain.value = 0.3;
    wetGain.gain.value = 0.3;
    dryGain.gain.value = 0.7;

    input.connect(dryGain);
    input.connect(delay);
    delay.connect(feedback);
    feedback.connect(delay);
    delay.connect(wetGain);
    dryGain.connect(output);
    wetGain.connect(output);

    return {
        input,
        output,
        params: {
            delayTime: delay.delayTime,
            feedback: feedback.gain,
            wet: wetGain.gain,
            dry: dryGain.gain,
        },
        dispose: () => {
            input.disconnect();
            delay.disconnect();
            feedback.disconnect();
            wetGain.disconnect();
            dryGain.disconnect();
            output.disconnect();
        },
    };
}

// Distortion/Saturation Effect
export function createDistortion(context: AudioContext): EffectNode {
    const waveshaper = context.createWaveShaper();
    const inputGain = context.createGain();
    const outputGain = context.createGain();

    inputGain.gain.value = 1;
    outputGain.gain.value = 0.7;

    // Create distortion curve
    const samples = 44100;
    const curve = new Float32Array(samples);
    const amount = 20;

    for (let i = 0; i < samples; i++) {
        const x = (i * 2) / samples - 1;
        curve[i] = ((3 + amount) * x * 20 * (Math.PI / 180)) / (Math.PI + amount * Math.abs(x));
    }

    waveshaper.curve = curve;
    waveshaper.oversample = '2x';

    inputGain.connect(waveshaper);
    waveshaper.connect(outputGain);

    return {
        input: inputGain,
        output: outputGain,
        params: {
            drive: inputGain.gain,
            output: outputGain.gain,
        },
        dispose: () => {
            inputGain.disconnect();
            waveshaper.disconnect();
            outputGain.disconnect();
        },
    };
}

// Filter Effect
export function createFilter(context: AudioContext): EffectNode {
    const filter = context.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 5000;
    filter.Q.value = 1;

    return {
        input: filter,
        output: filter,
        params: {
            frequency: filter.frequency,
            Q: filter.Q,
            type: { value: 0 }, // 0=lowpass, 1=highpass, 2=bandpass
        },
        dispose: () => {
            filter.disconnect();
        },
    };
}
