import React from 'react';
import { useProjectStore } from './store/projectStore';
import { ControlBar } from './components/ControlBar/ControlBar';
import { Toolbar } from './components/Toolbar/Toolbar';
import { TracksArea } from './components/TracksArea/TracksArea';
import { Mixer } from './components/Mixer/Mixer';
import { Inspector } from './components/Inspector/Inspector';
import { Browser } from './components/Browser/Browser';
import { EffectsPanel } from './components/EffectsPanel/EffectsPanel';
import { AIStudio } from './components/AIStudio/AIStudio';
import audioEngine from './audio/AudioEngine';
import './styles/global.css';
import './App.css';

function App() {
  const { ui, toggleMixer, toggleInspector, toggleBrowser, setZoom, project } = useProjectStore();
  const [showEffects, setShowEffects] = React.useState(false);

  // Initialize audio engine on first interaction
  React.useEffect(() => {
    const handleClick = async () => {
      await audioEngine.init();
      document.removeEventListener('click', handleClick);
    };
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  // Keyboard shortcuts
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (e.key.toLowerCase()) {
        case ' ':
          e.preventDefault();
          const { transport, play, pause } = useProjectStore.getState();
          if (transport.isPlaying) {
            pause();
            audioEngine.pause();
          } else {
            play();
            audioEngine.play();
          }
          break;
        case 'enter':
          e.preventDefault();
          useProjectStore.getState().stop();
          audioEngine.stop();
          break;
        case 'm':
          if (e.metaKey || e.ctrlKey) {
            e.preventDefault();
            toggleMixer();
          }
          break;
        case 'i':
          if (e.metaKey || e.ctrlKey) {
            e.preventDefault();
            toggleInspector();
          }
          break;
        case 'b':
          if (e.metaKey || e.ctrlKey) {
            e.preventDefault();
            toggleBrowser();
          }
          break;
        case 'e':
          if (e.metaKey || e.ctrlKey) {
            e.preventDefault();
            setShowEffects(prev => !prev);
          }
          break;
        case '=':
        case '+':
          if (e.metaKey || e.ctrlKey) {
            e.preventDefault();
            setZoom(ui.zoomLevel * 1.2);
          }
          break;
        case '-':
          if (e.metaKey || e.ctrlKey) {
            e.preventDefault();
            setZoom(ui.zoomLevel / 1.2);
          }
          break;
        case 'delete':
        case 'backspace':
          const state = useProjectStore.getState();
          if (state.ui.selectedRegionId && state.ui.selectedTrackId) {
            state.removeRegion(state.ui.selectedTrackId, state.ui.selectedRegionId);
            state.selectRegion(null);
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [ui.zoomLevel, toggleMixer, toggleInspector, toggleBrowser, setZoom]);

  return (
    <div className="app">
      <ControlBar />
      <Toolbar showEffects={showEffects} onToggleEffects={() => setShowEffects(prev => !prev)} />

      <div className="main-content">
        {ui.showInspector && <Inspector />}
        {showEffects && <EffectsPanel />}
        {ui.showAIStudio ? (
          <AIStudio />
        ) : (
          <>
            <TracksArea />
            {ui.showBrowser && <Browser />}
          </>
        )}
      </div>

      {ui.showMixer && <Mixer />}

      {/* Status Bar */}
      <div className="status-bar">
        <div className="status-section">
          <span className="status-item">🎵 {project.tracks.length} tracks</span>
          <span className="status-item">⏱️ {project.tempo} BPM</span>
        </div>
        <div className="status-section shortcuts">
          <span>Space: Play</span>
          <span>⌘S: Save</span>
          <span>⌘E: Effects</span>
          <span>Del: Remove</span>
        </div>
      </div>
    </div>
  );
}

export default App;
