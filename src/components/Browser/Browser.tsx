import React from 'react';
import { useProjectStore } from '../../store/projectStore';
import audioEngine from '../../audio/AudioEngine';
import './Browser.css';

// Sample audio files (placeholder - in a real app these would be actual files)
const SAMPLE_CATEGORIES = [
    {
        name: 'Drums',
        icon: '🥁',
        samples: [
            { name: 'Kick 01', duration: '0.2s' },
            { name: 'Snare 01', duration: '0.3s' },
            { name: 'Hi-Hat 01', duration: '0.1s' },
            { name: 'Clap 01', duration: '0.2s' },
        ]
    },
    {
        name: 'Bass',
        icon: '🎸',
        samples: [
            { name: 'Sub Bass 01', duration: '2.0s' },
            { name: 'Electric Bass 01', duration: '1.5s' },
        ]
    },
    {
        name: 'Synths',
        icon: '🎹',
        samples: [
            { name: 'Pad 01', duration: '4.0s' },
            { name: 'Lead 01', duration: '2.0s' },
            { name: 'Arp 01', duration: '2.0s' },
        ]
    },
    {
        name: 'FX',
        icon: '✨',
        samples: [
            { name: 'Riser 01', duration: '4.0s' },
            { name: 'Impact 01', duration: '1.5s' },
            { name: 'Transition 01', duration: '2.0s' },
        ]
    },
];

export const Browser: React.FC = () => {
    const { addTrack, addRegion } = useProjectStore();
    const [expandedCategory, setExpandedCategory] = React.useState<string | null>('Drums');
    const [searchQuery, setSearchQuery] = React.useState('');
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const handleDragStart = (e: React.DragEvent, sample: { name: string; duration: string }) => {
        e.dataTransfer.setData('text/plain', sample.name);
        e.dataTransfer.effectAllowed = 'copy';
    };

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;

        await audioEngine.init();

        for (const file of Array.from(files)) {
            if (!file.type.startsWith('audio/')) continue;

            // Create a new track
            addTrack('audio', file.name.replace(/\.[^/.]+$/, ''));
            const tracks = useProjectStore.getState().project.tracks;
            const trackId = tracks[tracks.length - 1].id;

            // Load and add region
            const { buffer, waveformData } = await audioEngine.loadAudioFile(file);
            addRegion(trackId, {
                name: file.name,
                startTime: 0,
                duration: buffer.duration,
                offset: 0,
                gain: 1,
                fadeIn: 0,
                fadeOut: 0,
                audioBuffer: buffer,
                waveformData,
            });

            audioEngine.createTrackNodes(trackId);
        }

        // Reset input
        e.target.value = '';
    };

    const filteredCategories = SAMPLE_CATEGORIES.map(cat => ({
        ...cat,
        samples: cat.samples.filter(s =>
            s.name.toLowerCase().includes(searchQuery.toLowerCase())
        )
    })).filter(cat => cat.samples.length > 0 || searchQuery === '');

    return (
        <div className="browser">
            <div className="panel-header">
                <span>Browser</span>
                <button className="import-btn" onClick={handleImportClick} title="Import Audio">
                    +
                </button>
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="audio/*"
                    multiple
                    style={{ display: 'none' }}
                    onChange={handleFileImport}
                />
            </div>

            <div className="browser-search">
                <input
                    type="text"
                    placeholder="Search sounds..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            <div className="browser-content">
                {/* Import section */}
                <div className="browser-section">
                    <div
                        className="drop-zone"
                        onClick={handleImportClick}
                    >
                        <span className="drop-icon">📁</span>
                        <span>Import audio files</span>
                        <span className="drop-hint">or drag & drop onto timeline</span>
                    </div>
                </div>

                {/* Sample library */}
                <div className="browser-section">
                    <h3 className="section-heading">Sound Library</h3>

                    {filteredCategories.map((category) => (
                        <div key={category.name} className="category">
                            <button
                                className="category-header"
                                onClick={() => setExpandedCategory(
                                    expandedCategory === category.name ? null : category.name
                                )}
                            >
                                <span className="category-icon">{category.icon}</span>
                                <span className="category-name">{category.name}</span>
                                <span className="category-count">{category.samples.length}</span>
                                <span className={`category-arrow ${expandedCategory === category.name ? 'expanded' : ''}`}>
                                    ▶
                                </span>
                            </button>

                            {expandedCategory === category.name && (
                                <div className="category-samples">
                                    {category.samples.map((sample) => (
                                        <div
                                            key={sample.name}
                                            className="sample-item"
                                            draggable
                                            onDragStart={(e) => handleDragStart(e, sample)}
                                        >
                                            <span className="sample-name">{sample.name}</span>
                                            <span className="sample-duration">{sample.duration}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* Help text */}
                <div className="browser-help">
                    <p>💡 Drag audio files directly onto the timeline to create tracks</p>
                </div>
            </div>
        </div>
    );
};
