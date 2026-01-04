import React from 'react';
import { useProjectStore } from '../../store/projectStore';
import { Knob } from '../ui/Knob';
import './Inspector.css';

export const Inspector: React.FC = () => {
    const {
        project,
        ui,
        getSelectedTrack,
        updateTrack,
        setTrackVolume,
        setTrackPan,
        updateRegion,
    } = useProjectStore();

    const selectedTrack = getSelectedTrack();
    const selectedRegion = selectedTrack?.regions.find(r => r.id === ui.selectedRegionId);

    if (!selectedTrack && !selectedRegion) {
        return (
            <div className="inspector">
                <div className="panel-header">Inspector</div>
                <div className="inspector-empty">
                    <p>Select a track or region to view properties</p>
                </div>
            </div>
        );
    }

    return (
        <div className="inspector">
            <div className="panel-header">Inspector</div>

            <div className="inspector-content">
                {/* Track Properties */}
                {selectedTrack && (
                    <section className="inspector-section">
                        <h3 className="section-title">Track</h3>

                        <div className="property-row">
                            <label>Name</label>
                            <input
                                type="text"
                                value={selectedTrack.name}
                                onChange={(e) => updateTrack(selectedTrack.id, { name: e.target.value })}
                            />
                        </div>

                        <div className="property-row">
                            <label>Color</label>
                            <input
                                type="color"
                                value={selectedTrack.color}
                                onChange={(e) => updateTrack(selectedTrack.id, { color: e.target.value })}
                            />
                        </div>

                        <div className="property-row">
                            <label>Type</label>
                            <span className="property-value">{selectedTrack.type}</span>
                        </div>

                        <div className="property-knobs">
                            <Knob
                                value={selectedTrack.volume}
                                min={0}
                                max={1}
                                size={48}
                                label="Volume"
                                onChange={(value) => setTrackVolume(selectedTrack.id, value)}
                                formatValue={(v) => `${Math.round(v * 100)}%`}
                            />
                            <Knob
                                value={selectedTrack.pan}
                                min={-1}
                                max={1}
                                size={48}
                                label="Pan"
                                onChange={(value) => setTrackPan(selectedTrack.id, value)}
                                formatValue={(v) => v === 0 ? 'C' : v < 0 ? `L${Math.abs(Math.round(v * 100))}` : `R${Math.round(v * 100)}`}
                            />
                        </div>

                        <div className="property-toggles">
                            <div className={`toggle-item ${selectedTrack.mute ? 'active mute' : ''}`}>
                                <span>Muted</span>
                                <span>{selectedTrack.mute ? 'Yes' : 'No'}</span>
                            </div>
                            <div className={`toggle-item ${selectedTrack.solo ? 'active solo' : ''}`}>
                                <span>Soloed</span>
                                <span>{selectedTrack.solo ? 'Yes' : 'No'}</span>
                            </div>
                            <div className={`toggle-item ${selectedTrack.armed ? 'active arm' : ''}`}>
                                <span>Armed</span>
                                <span>{selectedTrack.armed ? 'Yes' : 'No'}</span>
                            </div>
                        </div>
                    </section>
                )}

                {/* Region Properties */}
                {selectedRegion && (
                    <section className="inspector-section">
                        <h3 className="section-title">Region</h3>

                        <div className="property-row">
                            <label>Name</label>
                            <input
                                type="text"
                                value={selectedRegion.name}
                                onChange={(e) => updateRegion(selectedTrack!.id, selectedRegion.id, { name: e.target.value })}
                            />
                        </div>

                        <div className="property-row">
                            <label>Start</label>
                            <span className="property-value">{selectedRegion.startTime.toFixed(2)}s</span>
                        </div>

                        <div className="property-row">
                            <label>Duration</label>
                            <span className="property-value">{selectedRegion.duration.toFixed(2)}s</span>
                        </div>

                        <div className="property-row">
                            <label>Gain</label>
                            <input
                                type="range"
                                min="0"
                                max="2"
                                step="0.01"
                                value={selectedRegion.gain}
                                onChange={(e) => updateRegion(selectedTrack!.id, selectedRegion.id, { gain: Number(e.target.value) })}
                            />
                            <span className="property-value">{Math.round(selectedRegion.gain * 100)}%</span>
                        </div>
                    </section>
                )}

                {/* Project Info */}
                <section className="inspector-section">
                    <h3 className="section-title">Project</h3>

                    <div className="property-row">
                        <label>Tempo</label>
                        <span className="property-value">{project.tempo} BPM</span>
                    </div>

                    <div className="property-row">
                        <label>Time Sig</label>
                        <span className="property-value">{project.timeSignature[0]}/{project.timeSignature[1]}</span>
                    </div>

                    <div className="property-row">
                        <label>Tracks</label>
                        <span className="property-value">{project.tracks.length}</span>
                    </div>
                </section>
            </div>
        </div>
    );
};
