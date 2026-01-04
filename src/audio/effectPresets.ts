// Effect presets for the DAW

export interface EffectPreset {
    name: string;
    icon?: string;
    params: Record<string, number>;
}

export interface EffectDefinition {
    type: string;
    name: string;
    icon: string;
    description: string;
    params: {
        name: string;
        key: string;
        value: number;
        min: number;
        max: number;
        step?: number;
        unit?: string;
    }[];
    presets: EffectPreset[];
}

export const EFFECT_LIBRARY: EffectDefinition[] = [
    // EQ - Equalizer
    {
        type: 'eq',
        name: 'Equalizer',
        icon: '📊',
        description: '3-band parametric EQ for tone shaping',
        params: [
            { name: 'Low', key: 'low', value: 0, min: -12, max: 12, unit: 'dB' },
            { name: 'Mid', key: 'mid', value: 0, min: -12, max: 12, unit: 'dB' },
            { name: 'High', key: 'high', value: 0, min: -12, max: 12, unit: 'dB' },
            { name: 'Low Freq', key: 'lowFreq', value: 200, min: 20, max: 500, unit: 'Hz' },
            { name: 'High Freq', key: 'highFreq', value: 4000, min: 2000, max: 12000, unit: 'Hz' },
        ],
        presets: [
            { name: 'Flat', params: { low: 0, mid: 0, high: 0 } },
            { name: 'Bass Boost', params: { low: 6, mid: 0, high: -2 } },
            { name: 'Treble Boost', params: { low: -2, mid: 0, high: 6 } },
            { name: 'Warm', params: { low: 3, mid: -1, high: -3 } },
            { name: 'Bright', params: { low: -2, mid: 2, high: 5 } },
            { name: 'Vocal Presence', params: { low: -3, mid: 4, high: 2 } },
            { name: 'Radio', params: { low: -6, mid: 6, high: -6 } },
            { name: 'Telephone', params: { low: -12, mid: 8, high: -12 } },
        ],
    },

    // Compressor
    {
        type: 'compressor',
        name: 'Compressor',
        icon: '🔧',
        description: 'Dynamic range compression',
        params: [
            { name: 'Threshold', key: 'threshold', value: -24, min: -60, max: 0, unit: 'dB' },
            { name: 'Ratio', key: 'ratio', value: 4, min: 1, max: 20, step: 0.5, unit: ':1' },
            { name: 'Attack', key: 'attack', value: 10, min: 0, max: 100, unit: 'ms' },
            { name: 'Release', key: 'release', value: 100, min: 10, max: 1000, unit: 'ms' },
            { name: 'Makeup', key: 'makeup', value: 0, min: 0, max: 24, unit: 'dB' },
        ],
        presets: [
            { name: 'Off', params: { threshold: 0, ratio: 1, attack: 10, release: 100, makeup: 0 } },
            { name: 'Gentle', params: { threshold: -20, ratio: 2, attack: 20, release: 200, makeup: 2 } },
            { name: 'Moderate', params: { threshold: -18, ratio: 4, attack: 10, release: 150, makeup: 4 } },
            { name: 'Heavy', params: { threshold: -12, ratio: 8, attack: 5, release: 100, makeup: 6 } },
            { name: 'Vocal', params: { threshold: -20, ratio: 3, attack: 15, release: 200, makeup: 3 } },
            { name: 'Drum Bus', params: { threshold: -16, ratio: 4, attack: 2, release: 80, makeup: 5 } },
            { name: 'Limiting', params: { threshold: -6, ratio: 20, attack: 0, release: 50, makeup: 6 } },
            { name: 'Parallel', params: { threshold: -30, ratio: 10, attack: 5, release: 100, makeup: 8 } },
        ],
    },

    // Reverb
    {
        type: 'reverb',
        name: 'Reverb',
        icon: '🏛️',
        description: 'Space and ambience',
        params: [
            { name: 'Size', key: 'size', value: 50, min: 0, max: 100, unit: '%' },
            { name: 'Decay', key: 'decay', value: 2, min: 0.1, max: 10, step: 0.1, unit: 's' },
            { name: 'Pre-Delay', key: 'predelay', value: 20, min: 0, max: 100, unit: 'ms' },
            { name: 'Damping', key: 'damping', value: 50, min: 0, max: 100, unit: '%' },
            { name: 'Mix', key: 'mix', value: 30, min: 0, max: 100, unit: '%' },
        ],
        presets: [
            { name: 'Dry', params: { size: 0, decay: 0.1, predelay: 0, damping: 100, mix: 0 } },
            { name: 'Small Room', params: { size: 20, decay: 0.5, predelay: 5, damping: 70, mix: 20 } },
            { name: 'Medium Room', params: { size: 40, decay: 1.2, predelay: 15, damping: 50, mix: 25 } },
            { name: 'Large Hall', params: { size: 80, decay: 3, predelay: 30, damping: 30, mix: 35 } },
            { name: 'Cathedral', params: { size: 100, decay: 6, predelay: 50, damping: 20, mix: 40 } },
            { name: 'Plate', params: { size: 60, decay: 2, predelay: 10, damping: 60, mix: 30 } },
            { name: 'Spring', params: { size: 30, decay: 1, predelay: 0, damping: 80, mix: 25 } },
            { name: 'Ambient', params: { size: 90, decay: 5, predelay: 40, damping: 40, mix: 50 } },
        ],
    },

    // Delay
    {
        type: 'delay',
        name: 'Delay',
        icon: '📢',
        description: 'Echo and delay effects',
        params: [
            { name: 'Time', key: 'time', value: 250, min: 1, max: 2000, unit: 'ms' },
            { name: 'Feedback', key: 'feedback', value: 30, min: 0, max: 90, unit: '%' },
            { name: 'Mix', key: 'mix', value: 30, min: 0, max: 100, unit: '%' },
            { name: 'High Cut', key: 'highcut', value: 8000, min: 1000, max: 20000, unit: 'Hz' },
        ],
        presets: [
            { name: 'Off', params: { time: 0, feedback: 0, mix: 0, highcut: 20000 } },
            { name: 'Slapback', params: { time: 80, feedback: 10, mix: 25, highcut: 8000 } },
            { name: 'Short Echo', params: { time: 200, feedback: 30, mix: 25, highcut: 6000 } },
            { name: 'Quarter Note', params: { time: 500, feedback: 40, mix: 30, highcut: 5000 } },
            { name: 'Ping Pong', params: { time: 375, feedback: 50, mix: 35, highcut: 7000 } },
            { name: 'Tape Delay', params: { time: 400, feedback: 45, mix: 30, highcut: 3000 } },
            { name: 'Ambient', params: { time: 800, feedback: 60, mix: 40, highcut: 4000 } },
            { name: 'Dub', params: { time: 600, feedback: 70, mix: 45, highcut: 2000 } },
        ],
    },

    // Chorus
    {
        type: 'chorus',
        name: 'Chorus',
        icon: '🌊',
        description: 'Thickening and modulation',
        params: [
            { name: 'Rate', key: 'rate', value: 1.5, min: 0.1, max: 10, step: 0.1, unit: 'Hz' },
            { name: 'Depth', key: 'depth', value: 50, min: 0, max: 100, unit: '%' },
            { name: 'Delay', key: 'delay', value: 20, min: 1, max: 50, unit: 'ms' },
            { name: 'Mix', key: 'mix', value: 50, min: 0, max: 100, unit: '%' },
        ],
        presets: [
            { name: 'Off', params: { rate: 0, depth: 0, delay: 0, mix: 0 } },
            { name: 'Subtle', params: { rate: 0.5, depth: 20, delay: 15, mix: 30 } },
            { name: 'Classic', params: { rate: 1.2, depth: 50, delay: 20, mix: 50 } },
            { name: '80s Synth', params: { rate: 2, depth: 70, delay: 25, mix: 60 } },
            { name: 'Thick', params: { rate: 0.8, depth: 80, delay: 30, mix: 70 } },
            { name: 'Vibrato', params: { rate: 5, depth: 30, delay: 5, mix: 80 } },
            { name: 'Flanger', params: { rate: 0.3, depth: 90, delay: 5, mix: 50 } },
        ],
    },

    // Distortion / Saturation
    {
        type: 'distortion',
        name: 'Distortion',
        icon: '🔥',
        description: 'Saturation and overdrive',
        params: [
            { name: 'Drive', key: 'drive', value: 20, min: 0, max: 100, unit: '%' },
            { name: 'Tone', key: 'tone', value: 50, min: 0, max: 100, unit: '%' },
            { name: 'Output', key: 'output', value: 80, min: 0, max: 100, unit: '%' },
            { name: 'Mix', key: 'mix', value: 100, min: 0, max: 100, unit: '%' },
        ],
        presets: [
            { name: 'Clean', params: { drive: 0, tone: 50, output: 100, mix: 0 } },
            { name: 'Warm Tape', params: { drive: 15, tone: 40, output: 90, mix: 100 } },
            { name: 'Tube', params: { drive: 30, tone: 55, output: 85, mix: 100 } },
            { name: 'Crunch', params: { drive: 50, tone: 60, output: 75, mix: 100 } },
            { name: 'Overdrive', params: { drive: 70, tone: 65, output: 70, mix: 100 } },
            { name: 'Fuzz', params: { drive: 90, tone: 45, output: 60, mix: 100 } },
            { name: 'Lo-Fi', params: { drive: 40, tone: 30, output: 80, mix: 80 } },
        ],
    },

    // Pitch Correction (Autotune-style)
    {
        type: 'pitch',
        name: 'Pitch Correct',
        icon: '🎤',
        description: 'Vocal pitch correction',
        params: [
            { name: 'Speed', key: 'speed', value: 50, min: 0, max: 100, unit: '%' },
            { name: 'Strength', key: 'strength', value: 80, min: 0, max: 100, unit: '%' },
            { name: 'Formant', key: 'formant', value: 0, min: -12, max: 12, unit: 'st' },
            { name: 'Mix', key: 'mix', value: 100, min: 0, max: 100, unit: '%' },
        ],
        presets: [
            { name: 'Off', params: { speed: 0, strength: 0, formant: 0, mix: 0 } },
            { name: 'Natural', params: { speed: 30, strength: 50, formant: 0, mix: 100 } },
            { name: 'Subtle', params: { speed: 40, strength: 60, formant: 0, mix: 80 } },
            { name: 'Standard', params: { speed: 60, strength: 80, formant: 0, mix: 100 } },
            { name: 'T-Pain', params: { speed: 100, strength: 100, formant: 0, mix: 100 } },
            { name: 'Robot', params: { speed: 100, strength: 100, formant: 5, mix: 100 } },
            { name: 'Deep Voice', params: { speed: 50, strength: 70, formant: -5, mix: 100 } },
            { name: 'High Voice', params: { speed: 50, strength: 70, formant: 5, mix: 100 } },
        ],
    },

    // Filter
    {
        type: 'filter',
        name: 'Filter',
        icon: '🎛️',
        description: 'Low/High/Band pass filter',
        params: [
            { name: 'Frequency', key: 'frequency', value: 1000, min: 20, max: 20000, unit: 'Hz' },
            { name: 'Resonance', key: 'resonance', value: 1, min: 0.1, max: 20, step: 0.1, unit: 'Q' },
            { name: 'Type', key: 'type', value: 0, min: 0, max: 2, step: 1, unit: '' },
        ],
        presets: [
            { name: 'Open', params: { frequency: 20000, resonance: 1, type: 0 } },
            { name: 'Low Pass 500', params: { frequency: 500, resonance: 1, type: 0 } },
            { name: 'Low Pass 2k', params: { frequency: 2000, resonance: 1, type: 0 } },
            { name: 'High Pass 100', params: { frequency: 100, resonance: 1, type: 1 } },
            { name: 'High Pass 500', params: { frequency: 500, resonance: 1, type: 1 } },
            { name: 'Band Pass', params: { frequency: 1000, resonance: 5, type: 2 } },
            { name: 'Resonant LP', params: { frequency: 800, resonance: 10, type: 0 } },
            { name: 'Wah', params: { frequency: 1500, resonance: 8, type: 2 } },
        ],
    },

    // Gate
    {
        type: 'gate',
        name: 'Noise Gate',
        icon: '🚪',
        description: 'Remove unwanted noise',
        params: [
            { name: 'Threshold', key: 'threshold', value: -40, min: -80, max: 0, unit: 'dB' },
            { name: 'Attack', key: 'attack', value: 1, min: 0, max: 50, unit: 'ms' },
            { name: 'Hold', key: 'hold', value: 50, min: 0, max: 500, unit: 'ms' },
            { name: 'Release', key: 'release', value: 100, min: 10, max: 1000, unit: 'ms' },
        ],
        presets: [
            { name: 'Off', params: { threshold: -80, attack: 1, hold: 0, release: 10 } },
            { name: 'Light', params: { threshold: -50, attack: 2, hold: 30, release: 100 } },
            { name: 'Medium', params: { threshold: -40, attack: 1, hold: 50, release: 80 } },
            { name: 'Tight', params: { threshold: -30, attack: 0, hold: 20, release: 50 } },
            { name: 'Drums', params: { threshold: -35, attack: 0, hold: 30, release: 60 } },
            { name: 'Vocal', params: { threshold: -45, attack: 5, hold: 100, release: 150 } },
        ],
    },

    // Stereo Width
    {
        type: 'stereo',
        name: 'Stereo Width',
        icon: '↔️',
        description: 'Stereo field manipulation',
        params: [
            { name: 'Width', key: 'width', value: 100, min: 0, max: 200, unit: '%' },
            { name: 'Pan', key: 'pan', value: 0, min: -100, max: 100, unit: '' },
        ],
        presets: [
            { name: 'Mono', params: { width: 0, pan: 0 } },
            { name: 'Narrow', params: { width: 50, pan: 0 } },
            { name: 'Normal', params: { width: 100, pan: 0 } },
            { name: 'Wide', params: { width: 150, pan: 0 } },
            { name: 'Super Wide', params: { width: 200, pan: 0 } },
            { name: 'Left Heavy', params: { width: 100, pan: -50 } },
            { name: 'Right Heavy', params: { width: 100, pan: 50 } },
        ],
    },
];

// Get effect by type
export function getEffectDefinition(type: string): EffectDefinition | undefined {
    return EFFECT_LIBRARY.find(e => e.type === type);
}

// Get all presets for an effect type
export function getEffectPresets(type: string): EffectPreset[] {
    return getEffectDefinition(type)?.presets || [];
}
