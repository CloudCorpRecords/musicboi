import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { Project, Track, Region, TransportState, UIState, TrackType, Effect, EffectType } from '../types/project';

const TRACK_COLORS = [
    '#4a9eff', '#9b59b6', '#e74c3c', '#2ecc71',
    '#f39c12', '#1abc9c', '#e91e63', '#00bcd4'
];

interface ProjectStore {
    // Project state
    project: Project;
    transport: TransportState;
    ui: UIState;

    // Project actions
    setProjectName: (name: string) => void;
    setTempo: (tempo: number) => void;
    setTimeSignature: (sig: [number, number]) => void;
    setMasterVolume: (volume: number) => void;

    // Track actions
    addTrack: (type: TrackType, name?: string) => void;
    removeTrack: (id: string) => void;
    updateTrack: (id: string, updates: Partial<Track>) => void;
    setTrackVolume: (id: string, volume: number) => void;
    setTrackPan: (id: string, pan: number) => void;
    toggleMute: (id: string) => void;
    toggleSolo: (id: string) => void;
    toggleArmed: (id: string) => void;

    // Region actions
    addRegion: (trackId: string, region: Omit<Region, 'id' | 'trackId'>) => void;
    removeRegion: (trackId: string, regionId: string) => void;
    updateRegion: (trackId: string, regionId: string, updates: Partial<Region>) => void;
    moveRegion: (trackId: string, regionId: string, newStartTime: number) => void;
    duplicateRegion: (trackId: string, regionId: string) => void;
    splitRegion: (trackId: string, regionId: string, splitTime: number) => void;

    // Track editing
    duplicateTrack: (id: string) => void;

    // Transport actions
    play: () => void;
    pause: () => void;
    stop: () => void;
    toggleLoop: () => void;
    setPosition: (position: number) => void;
    setLoopPoints: (start: number, end: number) => void;
    toggleRecording: () => void;

    // UI actions
    toggleMixer: () => void;
    toggleInspector: () => void;
    toggleBrowser: () => void;
    toggleAIStudio: () => void;
    selectTrack: (id: string | null) => void;
    selectRegion: (id: string | null) => void;
    setZoom: (level: number) => void;
    setScroll: (position: number) => void;

    // Utility
    getTrackById: (id: string) => Track | undefined;
    getSelectedTrack: () => Track | undefined;
    exportProject: () => string;
    importProject: (json: string) => void;

    // Effect actions
    addTrackEffect: (trackId: string, type: EffectType) => void;
    removeTrackEffect: (trackId: string, effectId: string) => void;
    updateTrackEffect: (trackId: string, effectId: string, updates: Partial<Effect>) => void;
}

const createDefaultProject = (): Project => ({
    id: uuidv4(),
    name: 'Untitled Project',
    tempo: 120,
    timeSignature: [4, 4],
    tracks: [],
    masterVolume: 0.8,
    createdAt: new Date(),
    modifiedAt: new Date(),
});

export const useProjectStore = create<ProjectStore>((set, get) => ({
    project: createDefaultProject(),

    transport: {
        isPlaying: false,
        isRecording: false,
        isLooping: false,
        position: 0,
        loopStart: 0,
        loopEnd: 8,
    },

    ui: {
        showMixer: true,
        showInspector: true,
        showBrowser: true,
        showAIStudio: false,
        selectedTrackId: null,
        selectedRegionId: null,
        zoomLevel: 1,
        scrollPosition: 0,
    },

    // Project actions
    setProjectName: (name) => set((state) => ({
        project: { ...state.project, name, modifiedAt: new Date() }
    })),

    setTempo: (tempo) => set((state) => ({
        project: { ...state.project, tempo, modifiedAt: new Date() }
    })),

    setTimeSignature: (sig) => set((state) => ({
        project: { ...state.project, timeSignature: sig, modifiedAt: new Date() }
    })),

    setMasterVolume: (volume) => set((state) => ({
        project: { ...state.project, masterVolume: volume, modifiedAt: new Date() }
    })),

    // Track actions
    addTrack: (type, name) => set((state) => {
        const trackCount = state.project.tracks.length;
        const newTrack: Track = {
            id: uuidv4(),
            name: name || `${type.charAt(0).toUpperCase() + type.slice(1)} ${trackCount + 1}`,
            type,
            color: TRACK_COLORS[trackCount % TRACK_COLORS.length],
            volume: 0.8,
            pan: 0,
            mute: false,
            solo: false,
            armed: false,
            regions: [],
            effects: [],
        };
        return {
            project: {
                ...state.project,
                tracks: [...state.project.tracks, newTrack],
                modifiedAt: new Date()
            }
        };
    }),

    removeTrack: (id) => set((state) => ({
        project: {
            ...state.project,
            tracks: state.project.tracks.filter(t => t.id !== id),
            modifiedAt: new Date()
        }
    })),

    updateTrack: (id, updates) => set((state) => ({
        project: {
            ...state.project,
            tracks: state.project.tracks.map(t =>
                t.id === id ? { ...t, ...updates } : t
            ),
            modifiedAt: new Date()
        }
    })),

    setTrackVolume: (id, volume) => set((state) => ({
        project: {
            ...state.project,
            tracks: state.project.tracks.map(t =>
                t.id === id ? { ...t, volume } : t
            ),
            modifiedAt: new Date()
        }
    })),

    setTrackPan: (id, pan) => set((state) => ({
        project: {
            ...state.project,
            tracks: state.project.tracks.map(t =>
                t.id === id ? { ...t, pan } : t
            ),
            modifiedAt: new Date()
        }
    })),

    toggleMute: (id) => set((state) => ({
        project: {
            ...state.project,
            tracks: state.project.tracks.map(t =>
                t.id === id ? { ...t, mute: !t.mute } : t
            ),
            modifiedAt: new Date()
        }
    })),

    toggleSolo: (id) => set((state) => ({
        project: {
            ...state.project,
            tracks: state.project.tracks.map(t =>
                t.id === id ? { ...t, solo: !t.solo } : t
            ),
            modifiedAt: new Date()
        }
    })),

    toggleArmed: (id) => set((state) => ({
        project: {
            ...state.project,
            tracks: state.project.tracks.map(t =>
                t.id === id ? { ...t, armed: !t.armed } : t
            ),
            modifiedAt: new Date()
        }
    })),

    // Region actions
    addRegion: (trackId, region) => set((state) => {
        const newRegion: Region = {
            ...region,
            id: uuidv4(),
            trackId,
        };
        return {
            project: {
                ...state.project,
                tracks: state.project.tracks.map(t =>
                    t.id === trackId ? { ...t, regions: [...t.regions, newRegion] } : t
                ),
                modifiedAt: new Date()
            }
        };
    }),

    removeRegion: (trackId, regionId) => set((state) => ({
        project: {
            ...state.project,
            tracks: state.project.tracks.map(t =>
                t.id === trackId
                    ? { ...t, regions: t.regions.filter(r => r.id !== regionId) }
                    : t
            ),
            modifiedAt: new Date()
        }
    })),

    updateRegion: (trackId, regionId, updates) => set((state) => ({
        project: {
            ...state.project,
            tracks: state.project.tracks.map(t =>
                t.id === trackId
                    ? {
                        ...t, regions: t.regions.map(r =>
                            r.id === regionId ? { ...r, ...updates } : r
                        )
                    }
                    : t
            ),
            modifiedAt: new Date()
        }
    })),

    moveRegion: (trackId, regionId, newStartTime) => set((state) => ({
        project: {
            ...state.project,
            tracks: state.project.tracks.map(t =>
                t.id === trackId
                    ? {
                        ...t, regions: t.regions.map(r =>
                            r.id === regionId ? { ...r, startTime: newStartTime } : r
                        )
                    }
                    : t
            ),
            modifiedAt: new Date()
        }
    })),

    duplicateRegion: (trackId, regionId) => set((state) => {
        const track = state.project.tracks.find(t => t.id === trackId);
        const region = track?.regions.find(r => r.id === regionId);
        if (!region) return state;

        const newRegion: Region = {
            ...region,
            id: uuidv4(),
            startTime: region.startTime + region.duration + 0.1,
            name: `${region.name} (copy)`,
        };

        return {
            project: {
                ...state.project,
                tracks: state.project.tracks.map(t =>
                    t.id === trackId ? { ...t, regions: [...t.regions, newRegion] } : t
                ),
                modifiedAt: new Date()
            }
        };
    }),

    splitRegion: (trackId, regionId, splitTime) => set((state) => {
        const track = state.project.tracks.find(t => t.id === trackId);
        const region = track?.regions.find(r => r.id === regionId);
        if (!region) return state;

        // Calculate split point relative to region
        const splitOffset = splitTime - region.startTime;
        if (splitOffset <= 0 || splitOffset >= region.duration) return state;

        const firstPart: Region = {
            ...region,
            duration: splitOffset,
            name: `${region.name} (L)`,
        };

        const secondPart: Region = {
            ...region,
            id: uuidv4(),
            startTime: splitTime,
            offset: region.offset + splitOffset,
            duration: region.duration - splitOffset,
            name: `${region.name} (R)`,
        };

        return {
            project: {
                ...state.project,
                tracks: state.project.tracks.map(t =>
                    t.id === trackId
                        ? { ...t, regions: [...t.regions.filter(r => r.id !== regionId), firstPart, secondPart] }
                        : t
                ),
                modifiedAt: new Date()
            }
        };
    }),

    duplicateTrack: (id) => set((state) => {
        const track = state.project.tracks.find(t => t.id === id);
        if (!track) return state;

        const newTrack: Track = {
            ...track,
            id: uuidv4(),
            name: `${track.name} (copy)`,
            regions: track.regions.map(r => ({ ...r, id: uuidv4(), trackId: uuidv4() })),
        };

        return {
            project: {
                ...state.project,
                tracks: [...state.project.tracks, newTrack],
                modifiedAt: new Date()
            }
        };
    }),

    // Transport actions
    play: () => set((state) => ({
        transport: { ...state.transport, isPlaying: true }
    })),

    pause: () => set((state) => ({
        transport: { ...state.transport, isPlaying: false }
    })),

    stop: () => set((state) => ({
        transport: { ...state.transport, isPlaying: false, isRecording: false, position: 0 }
    })),

    toggleLoop: () => set((state) => ({
        transport: { ...state.transport, isLooping: !state.transport.isLooping }
    })),

    setPosition: (position) => set((state) => ({
        transport: { ...state.transport, position }
    })),

    setLoopPoints: (start, end) => set((state) => ({
        transport: { ...state.transport, loopStart: start, loopEnd: end }
    })),

    toggleRecording: () => set((state) => ({
        transport: { ...state.transport, isRecording: !state.transport.isRecording }
    })),

    // UI actions
    toggleMixer: () => set((state) => ({
        ui: { ...state.ui, showMixer: !state.ui.showMixer }
    })),

    toggleInspector: () => set((state) => ({
        ui: { ...state.ui, showInspector: !state.ui.showInspector }
    })),

    toggleBrowser: () => set((state) => ({
        ui: { ...state.ui, showBrowser: !state.ui.showBrowser }
    })),

    toggleAIStudio: () => set((state) => ({
        ui: { ...state.ui, showAIStudio: !state.ui.showAIStudio }
    })),

    selectTrack: (id) => set((state) => ({
        ui: { ...state.ui, selectedTrackId: id }
    })),

    selectRegion: (id) => set((state) => ({
        ui: { ...state.ui, selectedRegionId: id }
    })),

    setZoom: (level) => set((state) => ({
        ui: { ...state.ui, zoomLevel: Math.max(0.1, Math.min(10, level)) }
    })),

    setScroll: (position) => set((state) => ({
        ui: { ...state.ui, scrollPosition: position }
    })),

    // Utility
    getTrackById: (id) => get().project.tracks.find(t => t.id === id),

    getSelectedTrack: () => {
        const { ui, project } = get();
        return ui.selectedTrackId ? project.tracks.find(t => t.id === ui.selectedTrackId) : undefined;
    },

    exportProject: () => JSON.stringify(get().project, null, 2),

    importProject: (json) => {
        try {
            const project = JSON.parse(json) as Project;
            set({ project });
        } catch (e) {
            console.error('Failed to import project:', e);
        }
    },

    // Effect actions
    addTrackEffect: (trackId, type) => set((state) => {
        const track = state.project.tracks.find(t => t.id === trackId);
        if (!track) return state;

        const newEffect: Effect = {
            id: uuidv4(),
            type,
            enabled: true,
            params: {} // Will be populated with defaults by the UI or AudioEngine
        };

        return {
            project: {
                ...state.project,
                tracks: state.project.tracks.map(t =>
                    t.id === trackId
                        ? { ...t, effects: [...t.effects, newEffect] }
                        : t
                ),
                modifiedAt: new Date()
            }
        };
    }),

    removeTrackEffect: (trackId, effectId) => set((state) => ({
        project: {
            ...state.project,
            tracks: state.project.tracks.map(t =>
                t.id === trackId
                    ? { ...t, effects: t.effects.filter(e => e.id !== effectId) }
                    : t
            ),
            modifiedAt: new Date()
        }
    })),

    updateTrackEffect: (trackId, effectId, updates) => set((state) => ({
        project: {
            ...state.project,
            tracks: state.project.tracks.map(t =>
                t.id === trackId
                    ? {
                        ...t,
                        effects: t.effects.map(e =>
                            e.id === effectId ? { ...e, ...updates } : e
                        )
                    }
                    : t
            ),
            modifiedAt: new Date()
        }
    })),
}));
