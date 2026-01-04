import React from 'react';
import { useProjectStore } from '../../store/projectStore';
import audioEngine from '../../audio/AudioEngine';
import { saveProject, loadProject, exportToWav, downloadWav, calculateProjectDuration } from '../../utils/fileUtils';
import './Toolbar.css';

interface ToolbarProps {
    showEffects: boolean;
    onToggleEffects: () => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({ showEffects, onToggleEffects }) => {
    const {
        project,
        ui,
        toggleMixer,
        toggleInspector,
        toggleBrowser,
        setZoom,
        setProjectName,
        addTrack,
    } = useProjectStore();

    const fileInputRef = React.useRef<HTMLInputElement>(null);
    const [isExporting, setIsExporting] = React.useState(false);
    const [showMenu, setShowMenu] = React.useState<string | null>(null);

    const handleNewProject = () => {
        if (confirm('Create a new project? Unsaved changes will be lost.')) {
            window.location.reload();
        }
        setShowMenu(null);
    };

    const handleSaveProject = () => {
        saveProject(project);
        setShowMenu(null);
    };

    const handleLoadProject = () => {
        fileInputRef.current?.click();
        setShowMenu(null);
    };

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            const loadedProject = await loadProject(file);
            localStorage.setItem('pendingProject', JSON.stringify(loadedProject));
            window.location.reload();
        } catch (err) {
            alert('Failed to load project: ' + (err as Error).message);
        }
        e.target.value = '';
    };

    const handleExportWav = async () => {
        if (project.tracks.length === 0) {
            alert('No tracks to export');
            return;
        }

        setIsExporting(true);
        setShowMenu(null);

        try {
            await audioEngine.init();
            const context = audioEngine.getContext();
            if (!context) throw new Error('Audio context not available');

            const duration = calculateProjectDuration(project.tracks);
            const blob = await exportToWav(context, project.tracks, duration);
            downloadWav(blob, project.name);
        } catch (err) {
            alert('Export failed: ' + (err as Error).message);
        } finally {
            setIsExporting(false);
        }
    };

    const handleRename = () => {
        const newName = prompt('Project name:', project.name);
        if (newName && newName.trim()) {
            setProjectName(newName.trim());
        }
        setShowMenu(null);
    };

    return (
        <div className="toolbar">
            <div className="toolbar-section">
                {/* File Menu */}
                <div className="menu-container">
                    <button
                        className={`toolbar-btn menu-trigger ${showMenu === 'file' ? 'active' : ''}`}
                        onClick={() => setShowMenu(showMenu === 'file' ? null : 'file')}
                    >
                        📁 File
                    </button>
                    {showMenu === 'file' && (
                        <div className="dropdown-menu">
                            <button onClick={handleNewProject}>🆕 New Project</button>
                            <button onClick={handleLoadProject}>📂 Open Project...</button>
                            <button onClick={handleSaveProject}>💾 Save Project</button>
                            <div className="menu-divider" />
                            <button onClick={handleRename}>✏️ Rename Project</button>
                            <div className="menu-divider" />
                            <button onClick={handleExportWav} disabled={isExporting}>
                                {isExporting ? '⏳ Exporting...' : '🎵 Export to WAV'}
                            </button>
                        </div>
                    )}
                </div>

                {/* Track Menu */}
                <div className="menu-container">
                    <button
                        className={`toolbar-btn menu-trigger ${showMenu === 'track' ? 'active' : ''}`}
                        onClick={() => setShowMenu(showMenu === 'track' ? null : 'track')}
                    >
                        🎚️ Track
                    </button>
                    {showMenu === 'track' && (
                        <div className="dropdown-menu">
                            <button onClick={() => { addTrack('audio'); setShowMenu(null); }}>
                                🎤 New Audio Track
                            </button>
                            <button onClick={() => { addTrack('midi'); setShowMenu(null); }}>
                                🎹 New MIDI Track
                            </button>
                            <button onClick={() => { addTrack('aux'); setShowMenu(null); }}>
                                🔊 New Aux Track
                            </button>
                        </div>
                    )}
                </div>

                <div className="toolbar-divider" />

                {/* Panel Toggles */}
                <button
                    className={`toolbar-btn ${ui.showInspector ? 'active' : ''}`}
                    onClick={toggleInspector}
                    title="Toggle Inspector (⌘I)"
                >
                    📋 Inspector
                </button>
                <button
                    className={`toolbar-btn ${ui.showAIStudio ? 'active' : ''}`}
                    onClick={useProjectStore.getState().toggleAIStudio}
                    title="Toggle AI Studio"
                >
                    🤖 AI Studio
                </button>
                <button
                    className={`toolbar-btn ${showEffects ? 'active' : ''}`}
                    onClick={onToggleEffects}
                    title="Toggle Effects (⌘E)"
                >
                    🎛️ Effects
                </button>
                <button
                    className={`toolbar-btn ${ui.showBrowser ? 'active' : ''}`}
                    onClick={toggleBrowser}
                    title="Toggle Browser (⌘B)"
                >
                    📂 Browser
                </button>
                <button
                    className={`toolbar-btn ${ui.showMixer ? 'active' : ''}`}
                    onClick={toggleMixer}
                    title="Toggle Mixer (⌘M)"
                >
                    🎚️ Mixer
                </button>
            </div>

            <div className="toolbar-section">
                {/* Zoom Controls */}
                <button
                    className="toolbar-btn zoom-btn"
                    onClick={() => setZoom(ui.zoomLevel / 1.2)}
                    title="Zoom Out (⌘-)"
                >
                    −
                </button>
                <span className="zoom-level">{Math.round(ui.zoomLevel * 100)}%</span>
                <button
                    className="toolbar-btn zoom-btn"
                    onClick={() => setZoom(ui.zoomLevel * 1.2)}
                    title="Zoom In (⌘+)"
                >
                    +
                </button>
            </div>

            {/* Hidden file input */}
            <input
                ref={fileInputRef}
                type="file"
                accept=".musicboi,.json"
                style={{ display: 'none' }}
                onChange={handleFileSelect}
            />

            {/* Click outside to close menu */}
            {showMenu && (
                <div className="menu-overlay" onClick={() => setShowMenu(null)} />
            )}
        </div>
    );
};
