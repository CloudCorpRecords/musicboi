import React from 'react';
import { useProjectStore } from '../../store/projectStore';
import audioEngine from '../../audio/AudioEngine';
import { Waveform } from '../ui/Waveform';
import { beatsToSeconds } from '../../types/project';
import './TracksArea.css';

const PIXELS_PER_BEAT = 30;
const TRACK_HEIGHT = 80;

export const TracksArea: React.FC = () => {
    const {
        project,
        transport,
        ui,
        addTrack,
        selectTrack,
        selectRegion,
        toggleMute,
        toggleSolo,
        toggleArmed,
        addRegion,
        setPosition,
    } = useProjectStore();

    const [isDraggingOver, setIsDraggingOver] = React.useState(false);
    const timelineRef = React.useRef<HTMLDivElement>(null);

    const totalBeats = 64; // 16 bars in 4/4
    const totalWidth = totalBeats * PIXELS_PER_BEAT * ui.zoomLevel;
    const playheadPosition = (transport.position * (project.tempo / 60)) * PIXELS_PER_BEAT * ui.zoomLevel;

    const handleTimelineClick = (e: React.MouseEvent) => {
        if (!timelineRef.current) return;

        const rect = timelineRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left + timelineRef.current.scrollLeft;
        const beats = x / (PIXELS_PER_BEAT * ui.zoomLevel);
        const seconds = beatsToSeconds(beats, project.tempo);

        setPosition(seconds);
        audioEngine.seekTo(seconds);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDraggingOver(true);
    };

    const handleDragLeave = () => {
        setIsDraggingOver(false);
    };

    const handleDrop = async (e: React.DragEvent, trackId?: string) => {
        e.preventDefault();
        setIsDraggingOver(false);

        const files = Array.from(e.dataTransfer.files).filter(f =>
            f.type.startsWith('audio/')
        );

        if (files.length === 0) return;

        await audioEngine.init();

        for (const file of files) {
            let targetTrackId = trackId;

            // If no track specified, create a new one
            if (!targetTrackId) {
                addTrack('audio', file.name.replace(/\.[^/.]+$/, ''));
                const tracks = useProjectStore.getState().project.tracks;
                targetTrackId = tracks[tracks.length - 1].id;
            }

            // Calculate drop position
            const rect = timelineRef.current?.getBoundingClientRect();
            const x = rect ? e.clientX - rect.left : 0;
            const beats = x / (PIXELS_PER_BEAT * ui.zoomLevel);
            const startTime = beatsToSeconds(beats, project.tempo);

            // Load audio file
            const { buffer, waveformData } = await audioEngine.loadAudioFile(file);

            // Add region
            addRegion(targetTrackId, {
                name: file.name,
                startTime: Math.max(0, startTime),
                duration: buffer.duration,
                offset: 0,
                gain: 1,
                fadeIn: 0,
                fadeOut: 0,
                audioBuffer: buffer,
                waveformData,
            });

            // Ensure track nodes are created
            audioEngine.createTrackNodes(targetTrackId);
        }
    };

    // Generate bar markers
    const barMarkers = [];
    for (let bar = 1; bar <= totalBeats / project.timeSignature[0] + 1; bar++) {
        const position = (bar - 1) * project.timeSignature[0] * PIXELS_PER_BEAT * ui.zoomLevel;
        barMarkers.push(
            <div key={bar} className="bar-marker" style={{ left: position }}>
                <span className="bar-number">{bar}</span>
            </div>
        );
    }

    return (
        <div className="tracks-area">
            {/* Track Headers */}
            <div className="track-headers">
                <div className="header-spacer" />
                {project.tracks.map((track) => (
                    <div
                        key={track.id}
                        className={`track-header ${ui.selectedTrackId === track.id ? 'selected' : ''}`}
                        onClick={() => selectTrack(track.id)}
                        style={{ height: TRACK_HEIGHT }}
                    >
                        <div className="track-color" style={{ backgroundColor: track.color }} />
                        <div className="track-info">
                            <span className="track-name">{track.name}</span>
                            <span className="track-type">{track.type}</span>
                        </div>
                        <div className="track-controls">
                            <button
                                className={`track-btn mute ${track.mute ? 'active' : ''}`}
                                onClick={(e) => { e.stopPropagation(); toggleMute(track.id); }}
                                title="Mute"
                            >
                                M
                            </button>
                            <button
                                className={`track-btn solo ${track.solo ? 'active' : ''}`}
                                onClick={(e) => { e.stopPropagation(); toggleSolo(track.id); }}
                                title="Solo"
                            >
                                S
                            </button>
                            <button
                                className={`track-btn arm ${track.armed ? 'active' : ''}`}
                                onClick={(e) => { e.stopPropagation(); toggleArmed(track.id); }}
                                title="Record Arm"
                            >
                                R
                            </button>
                        </div>
                    </div>
                ))}
                <button className="add-track-btn" onClick={() => addTrack('audio')}>
                    + Add Track
                </button>
            </div>

            {/* Timeline Area */}
            <div
                ref={timelineRef}
                className={`timeline-area ${isDraggingOver ? 'drag-over' : ''}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e)}
            >
                {/* Ruler */}
                <div className="timeline-ruler" onClick={handleTimelineClick}>
                    {barMarkers}
                    {/* Loop region */}
                    {transport.isLooping && (
                        <div
                            className="loop-region"
                            style={{
                                left: transport.loopStart * (project.tempo / 60) * PIXELS_PER_BEAT * ui.zoomLevel,
                                width: (transport.loopEnd - transport.loopStart) * (project.tempo / 60) * PIXELS_PER_BEAT * ui.zoomLevel,
                            }}
                        />
                    )}
                </div>

                {/* Tracks */}
                <div className="tracks-container" style={{ width: totalWidth }}>
                    {project.tracks.map((track) => (
                        <div
                            key={track.id}
                            className={`track-lane ${ui.selectedTrackId === track.id ? 'selected' : ''}`}
                            style={{ height: TRACK_HEIGHT }}
                            onDragOver={handleDragOver}
                            onDrop={(e) => handleDrop(e, track.id)}
                        >
                            {/* Regions */}
                            {track.regions.map((region) => {
                                const regionLeft = region.startTime * (project.tempo / 60) * PIXELS_PER_BEAT * ui.zoomLevel;
                                const regionWidth = region.duration * (project.tempo / 60) * PIXELS_PER_BEAT * ui.zoomLevel;

                                return (
                                    <div
                                        key={region.id}
                                        className={`region ${ui.selectedRegionId === region.id ? 'selected' : ''}`}
                                        style={{
                                            left: regionLeft,
                                            width: regionWidth,
                                            backgroundColor: track.color + '40',
                                            borderColor: track.color,
                                        }}
                                        onClick={(e) => { e.stopPropagation(); selectRegion(region.id); }}
                                    >
                                        <div className="region-header">
                                            <span className="region-name">{region.name}</span>
                                        </div>
                                        {region.waveformData && (
                                            <Waveform
                                                data={region.waveformData}
                                                width={regionWidth - 4}
                                                height={TRACK_HEIGHT - 26}
                                                color={track.color}
                                            />
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    ))}

                    {/* Empty state */}
                    {project.tracks.length === 0 && (
                        <div className="empty-state">
                            <div className="empty-icon">🎵</div>
                            <h3>Drop audio files here</h3>
                            <p>or click "Add Track" to get started</p>
                        </div>
                    )}
                </div>

                {/* Playhead */}
                <div className="playhead" style={{ left: playheadPosition }}>
                    <div className="playhead-head" />
                    <div className="playhead-line" />
                </div>
            </div>
        </div>
    );
};
