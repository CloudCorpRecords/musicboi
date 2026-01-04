import React from 'react';
import { useProjectStore } from '../../store/projectStore';
import audioEngine from '../../audio/AudioEngine';
import { secondsToTimeDisplay } from '../../types/project';
import './ControlBar.css';

// Icons as SVG components
const PlayIcon = () => (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
        <path d="M8 5v14l11-7z" />
    </svg>
);

const PauseIcon = () => (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
        <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
    </svg>
);

const StopIcon = () => (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
        <path d="M6 6h12v12H6z" />
    </svg>
);

const RecordIcon = () => (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
        <circle cx="12" cy="12" r="8" />
    </svg>
);

const LoopIcon = () => (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
        <path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46A7.93 7.93 0 0020 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74A7.93 7.93 0 004 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z" />
    </svg>
);

const RewindIcon = () => (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
        <path d="M11 18V6l-8.5 6 8.5 6zm.5-6l8.5 6V6l-8.5 6z" />
    </svg>
);

const ForwardIcon = () => (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
        <path d="M4 18l8.5-6L4 6v12zm9-12v12l8.5-6L13 6z" />
    </svg>
);

export const ControlBar: React.FC = () => {
    const { project, transport, play, pause, stop, toggleLoop, setPosition, toggleRecording, setTempo } = useProjectStore();

    const handlePlayPause = async () => {
        await audioEngine.init();

        if (transport.isPlaying) {
            pause();
            audioEngine.pause();
        } else {
            play();
            audioEngine.play();
        }
    };

    const handleStop = () => {
        stop();
        audioEngine.stop();
    };

    const handleRecord = async () => {
        await audioEngine.init();
        toggleRecording();

        if (!transport.isRecording) {
            await audioEngine.startRecording();
            if (!transport.isPlaying) {
                play();
                audioEngine.play();
            }
        } else {
            const result = await audioEngine.stopRecording();
            if (result) {
                // Add recorded region to first armed track
                const armedTrack = project.tracks.find(t => t.armed);
                if (armedTrack) {
                    useProjectStore.getState().addRegion(armedTrack.id, {
                        name: `Recording ${new Date().toLocaleTimeString()}`,
                        startTime: 0,
                        duration: result.buffer.duration,
                        offset: 0,
                        gain: 1,
                        fadeIn: 0,
                        fadeOut: 0,
                        audioBuffer: result.buffer,
                        waveformData: result.waveformData,
                    });
                }
            }
        }
    };

    const handleRewind = () => {
        const newPosition = Math.max(0, transport.position - 4 * (60 / project.tempo));
        setPosition(newPosition);
        audioEngine.seekTo(newPosition);
    };

    const handleForward = () => {
        const newPosition = transport.position + 4 * (60 / project.tempo);
        setPosition(newPosition);
        audioEngine.seekTo(newPosition);
    };

    const timeDisplay = secondsToTimeDisplay(transport.position, project.tempo, project.timeSignature);

    return (
        <div className="control-bar">
            <div className="control-bar-section">
                <div className="project-name">{project.name}</div>
            </div>

            <div className="control-bar-section transport">
                <button className="transport-btn" onClick={handleRewind} title="Rewind">
                    <RewindIcon />
                </button>

                <button
                    className={`transport-btn record ${transport.isRecording ? 'active' : ''}`}
                    onClick={handleRecord}
                    title="Record"
                >
                    <RecordIcon />
                </button>

                <button className="transport-btn" onClick={handleStop} title="Stop">
                    <StopIcon />
                </button>

                <button
                    className={`transport-btn play ${transport.isPlaying ? 'active' : ''}`}
                    onClick={handlePlayPause}
                    title={transport.isPlaying ? 'Pause' : 'Play'}
                >
                    {transport.isPlaying ? <PauseIcon /> : <PlayIcon />}
                </button>

                <button className="transport-btn" onClick={handleForward} title="Forward">
                    <ForwardIcon />
                </button>

                <button
                    className={`transport-btn ${transport.isLooping ? 'active' : ''}`}
                    onClick={toggleLoop}
                    title="Loop"
                >
                    <LoopIcon />
                </button>
            </div>

            <div className="control-bar-section time-display">
                <div className="time-bars">
                    <span className="time-label">BARS</span>
                    <span className="time-value">
                        {String(timeDisplay.bars).padStart(3, '0')}.
                        {String(timeDisplay.beats).padStart(1, '0')}.
                        {String(timeDisplay.ticks).padStart(3, '0')}
                    </span>
                </div>
                <div className="time-smpte">
                    <span className="time-label">TIME</span>
                    <span className="time-value">
                        {String(timeDisplay.minutes).padStart(2, '0')}:
                        {String(timeDisplay.seconds).padStart(2, '0')}.
                        {String(timeDisplay.milliseconds).padStart(3, '0')}
                    </span>
                </div>
            </div>

            <div className="control-bar-section tempo-section">
                <div className="tempo-control">
                    <span className="tempo-label">BPM</span>
                    <input
                        type="number"
                        className="tempo-input"
                        value={project.tempo}
                        onChange={(e) => setTempo(Math.max(20, Math.min(300, Number(e.target.value))))}
                        min="20"
                        max="300"
                    />
                </div>
                <div className="time-sig">
                    <span className="tempo-label">SIG</span>
                    <span className="time-sig-value">
                        {project.timeSignature[0]}/{project.timeSignature[1]}
                    </span>
                </div>
            </div>
        </div>
    );
};
