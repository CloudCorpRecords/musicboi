import React from 'react';
import { useProjectStore } from '../../store/projectStore';
import { Fader } from '../ui/Fader';
import { Knob } from '../ui/Knob';
import { Meter } from '../ui/Meter';
import './Mixer.css';

export const Mixer: React.FC = () => {
    const {
        project,
        ui,
        selectTrack,
        setTrackVolume,
        setTrackPan,
        toggleMute,
        toggleSolo,
        setMasterVolume,
    } = useProjectStore();

    // Simulated meter levels (in a real app, these would come from the audio engine)
    const [meterLevels, setMeterLevels] = React.useState<Record<string, number>>({});

    React.useEffect(() => {
        const interval = setInterval(() => {
            const transport = useProjectStore.getState().transport;
            if (transport.isPlaying) {
                const levels: Record<string, number> = {};
                project.tracks.forEach(track => {
                    if (!track.mute) {
                        levels[track.id] = Math.random() * 0.6 + 0.2;
                    } else {
                        levels[track.id] = 0;
                    }
                });
                levels['master'] = Math.random() * 0.5 + 0.3;
                setMeterLevels(levels);
            } else {
                setMeterLevels({});
            }
        }, 50);

        return () => clearInterval(interval);
    }, [project.tracks]);

    return (
        <div className="mixer">
            <div className="mixer-header">
                <span>Mixer</span>
                <div className="mixer-tools">
                    <span className="track-count">{project.tracks.length} Tracks</span>
                </div>
            </div>

            <div className="mixer-channels">
                {/* Track Channels */}
                {project.tracks.map((track) => (
                    <div
                        key={track.id}
                        className={`channel-strip ${ui.selectedTrackId === track.id ? 'selected' : ''}`}
                        onClick={() => selectTrack(track.id)}
                    >
                        <div className="channel-header">
                            <div className="channel-color" style={{ backgroundColor: track.color }} />
                            <span className="channel-name">{track.name}</span>
                        </div>

                        <div className="channel-controls">
                            <button
                                className={`channel-btn mute ${track.mute ? 'active' : ''}`}
                                onClick={(e) => { e.stopPropagation(); toggleMute(track.id); }}
                            >
                                M
                            </button>
                            <button
                                className={`channel-btn solo ${track.solo ? 'active' : ''}`}
                                onClick={(e) => { e.stopPropagation(); toggleSolo(track.id); }}
                            >
                                S
                            </button>
                        </div>

                        <Knob
                            value={track.pan}
                            min={-1}
                            max={1}
                            size={36}
                            label="Pan"
                            onChange={(value) => setTrackPan(track.id, value)}
                            formatValue={(v) => v === 0 ? 'C' : v < 0 ? `L${Math.abs(Math.round(v * 100))}` : `R${Math.round(v * 100)}`}
                        />

                        <div className="channel-meter-fader">
                            <Meter level={meterLevels[track.id] || 0} height={100} />
                            <Fader
                                value={track.volume}
                                height={100}
                                onChange={(value) => setTrackVolume(track.id, value)}
                                formatValue={(v) => `${Math.round(v * 100)}%`}
                            />
                        </div>

                        <div className="channel-value">
                            {Math.round((20 * Math.log10(track.volume || 0.001))).toFixed(0)} dB
                        </div>
                    </div>
                ))}

                {/* Master Channel */}
                <div className="channel-strip master">
                    <div className="channel-header">
                        <div className="channel-color" style={{ backgroundColor: 'var(--accent-danger)' }} />
                        <span className="channel-name">Master</span>
                    </div>

                    <div className="channel-controls">
                        <span className="master-label">OUT</span>
                    </div>

                    <div className="channel-spacer" />

                    <div className="channel-meter-fader">
                        <Meter
                            level={meterLevels['master'] || 0}
                            height={100}
                            stereo
                            leftLevel={(meterLevels['master'] || 0) * 0.9}
                            rightLevel={(meterLevels['master'] || 0) * 1.1}
                        />
                        <Fader
                            value={project.masterVolume}
                            height={100}
                            onChange={setMasterVolume}
                            formatValue={(v) => `${Math.round(v * 100)}%`}
                        />
                    </div>

                    <div className="channel-value">
                        {Math.round((20 * Math.log10(project.masterVolume || 0.001))).toFixed(0)} dB
                    </div>
                </div>
            </div>
        </div>
    );
};
