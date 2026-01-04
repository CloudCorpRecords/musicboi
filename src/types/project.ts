export interface Project {
    id: string;
    name: string;
    tempo: number;
    timeSignature: [number, number];
    tracks: Track[];
    masterVolume: number;
    createdAt: Date;
    modifiedAt: Date;
}

export type TrackType = 'audio' | 'midi' | 'aux' | 'master';

export interface Track {
    id: string;
    name: string;
    type: TrackType;
    color: string;
    volume: number;
    pan: number;
    mute: boolean;
    solo: boolean;
    armed: boolean;
    regions: Region[];
    effects: Effect[];
}

export interface Region {
    id: string;
    trackId: string;
    name: string;
    startTime: number; // in seconds
    duration: number;  // in seconds
    offset: number;    // offset within source audio
    gain: number;
    fadeIn: number;
    fadeOut: number;
    audioBuffer?: AudioBuffer;
    audioUrl?: string;
    waveformData?: number[];
    color?: string;
}

export interface Effect {
    id: string;
    type: EffectType;
    enabled: boolean;
    params: Record<string, number>;
}

export type EffectType = 'eq' | 'compressor' | 'reverb' | 'delay' | 'gain';

export interface TransportState {
    isPlaying: boolean;
    isRecording: boolean;
    isLooping: boolean;
    position: number;          // current position in seconds
    loopStart: number;
    loopEnd: number;
}

export interface UIState {
    showMixer: boolean;
    showInspector: boolean;
    showBrowser: boolean;
    showAIStudio: boolean;
    selectedTrackId: string | null;
    selectedRegionId: string | null;
    zoomLevel: number;
    scrollPosition: number;
}

export interface TimeDisplay {
    bars: number;
    beats: number;
    ticks: number;
    minutes: number;
    seconds: number;
    milliseconds: number;
}

export function secondsToTimeDisplay(seconds: number, tempo: number, timeSignature: [number, number]): TimeDisplay {
    const beatsPerSecond = tempo / 60;
    const totalBeats = seconds * beatsPerSecond;
    const ticksPerBeat = 480;

    const bars = Math.floor(totalBeats / timeSignature[0]) + 1;
    const beats = Math.floor(totalBeats % timeSignature[0]) + 1;
    const ticks = Math.floor((totalBeats % 1) * ticksPerBeat);

    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 1000);

    return { bars, beats, ticks, minutes, seconds: secs, milliseconds: ms };
}

export function beatsToSeconds(beats: number, tempo: number): number {
    return (beats / tempo) * 60;
}

export function secondsToBeats(seconds: number, tempo: number): number {
    return (seconds * tempo) / 60;
}
