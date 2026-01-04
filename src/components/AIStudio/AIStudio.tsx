import React from 'react';
import { AIService, type GenerationResult, type ModelInfo } from '../../services/AIService';
import { useProjectStore } from '../../store/projectStore';
import './AIStudio.css';

export const AIStudio: React.FC = () => {
    const [status, setStatus] = React.useState<'offline' | 'online' | 'busy'>('offline');
    const [statusMessage, setStatusMessage] = React.useState('');
    const [loadingModelId, setLoadingModelId] = React.useState<string | null>(null);
    const [models, setModels] = React.useState<ModelInfo[]>([]);
    const [prompt, setPrompt] = React.useState('');
    const [duration, setDuration] = React.useState(5);
    const [results, setResults] = React.useState<GenerationResult[]>([]);
    const [error, setError] = React.useState<string | null>(null);
    const [successMessage, setSuccessMessage] = React.useState<string | null>(null);
    const [addedClips, setAddedClips] = React.useState<Set<string>>(new Set());
    const [showModels, setShowModels] = React.useState(true);
    const audioRef = React.useRef<HTMLAudioElement | null>(null);

    const { addTrack, addRegion } = useProjectStore();

    // Poll for status and models
    React.useEffect(() => {
        const check = async () => {
            const isHealthy = await AIService.checkHealth();
            if (isHealthy) {
                // If we just came online or models are empty, fetch models
                if (status === 'offline' || models.length === 0) {
                    try {
                        const modelList = await AIService.getModels();
                        setModels(modelList);
                    } catch (e) {
                        console.error("Failed to fetch models", e);
                    }
                }
                setStatus(prev => prev === 'busy' ? 'busy' : 'online');
            } else {
                setStatus('offline');
            }
        };
        check();
        const interval = setInterval(check, 5000);
        return () => clearInterval(interval);
    }, [status, models.length]); // Depend on status/length to retry

    const activeModel = models.find(m => m.is_active);

    const handleDownload = async (modelId: string) => {
        setStatus('busy');
        setLoadingModelId(modelId);
        setStatusMessage(`Downloading ${modelId.split('/')[1]}...`);
        setError(null);
        try {
            await AIService.downloadModel(modelId);
            setStatusMessage('Download complete! Loading model...');

            // Refresh model list
            const modelList = await AIService.getModels();
            setModels(modelList);

            // Auto-load after download
            await AIService.loadModel(modelId);
            setStatusMessage('Model loaded!');
            const updatedList = await AIService.getModels();
            setModels(updatedList);

        } catch (err: any) {
            setError('Download failed: ' + err.message);
        } finally {
            setStatus('online');
            setStatusMessage('');
            setLoadingModelId(null);
        }
    };

    const handleLoad = async (modelId: string) => {
        setStatus('busy');
        setLoadingModelId(modelId);
        setStatusMessage(`Loading ${modelId.split('/')[1]}...`);
        try {
            await AIService.loadModel(modelId);
            const modelList = await AIService.getModels();
            setModels(modelList);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setStatus('online');
            setStatusMessage('');
            setLoadingModelId(null);
        }
    };

    const handleGenerate = async () => {
        if (!prompt) return;
        setStatus('busy');
        setStatusMessage('Generating music...');
        setError(null);
        try {
            const result = await AIService.generateMusic(prompt, duration);
            // Store prompt with result for later reference
            result.prompt = prompt;
            setResults(prev => [result, ...prev]);
        } catch (err: any) {
            setError(err.message || 'Generation failed');
        } finally {
            setStatus('online');
            setStatusMessage('');
        }
    };

    const handlePlay = (path: string) => {
        if (audioRef.current) {
            audioRef.current.src = path;
            audioRef.current.play();
        }
    };

    const handleImport = async (result: GenerationResult) => {
        // Check if already added
        if (addedClips.has(result.filename)) {
            setSuccessMessage('This clip is already in your project!');
            setTimeout(() => setSuccessMessage(null), 2000);
            return;
        }

        addTrack('audio', `AI: ${result.prompt?.slice(0, 15) || prompt.slice(0, 15)}...`);
        const { project } = useProjectStore.getState();
        const newTrack = project.tracks[project.tracks.length - 1];
        try {
            const response = await fetch(result.path);
            const blob = await response.blob();
            const file = new File([blob], result.filename, { type: 'audio/wav' });
            const { default: audioEngine } = await import('../../audio/AudioEngine');
            const { buffer, waveformData } = await audioEngine.loadAudioFile(file);
            addRegion(newTrack.id, {
                name: result.prompt || prompt || 'AI Generation',
                startTime: 0,
                duration: result.duration,
                offset: 0,
                gain: 1,
                fadeIn: 0,
                fadeOut: 0,
                audioBuffer: buffer,
                waveformData: waveformData,
                color: '#a855f7'
            });

            // Mark as added and show success
            setAddedClips(prev => new Set(prev).add(result.filename));
            setSuccessMessage('✓ Added to project!');
            setTimeout(() => setSuccessMessage(null), 2000);

        } catch (e) {
            console.error(e);
            setError("Failed to import audio");
        }
    };

    return (
        <div className="ai-studio">
            <div className="ai-header">
                <h2>AI Studio</h2>
                <div className="header-controls" style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <div className="active-model-display"
                        onClick={() => setShowModels(!showModels)}
                        style={{
                            cursor: 'pointer',
                            padding: '4px 12px',
                            background: 'var(--bg-tertiary)',
                            borderRadius: '4px',
                            border: '1px solid var(--border-subtle)',
                            fontSize: 'var(--text-md)',
                            fontWeight: 500
                        }}>
                        {activeModel ? activeModel.name : 'Select Model...'} ▼
                    </div>

                    <div className="model-status">
                        <div className={`status-dot ${status !== 'offline' ? 'online' : ''}`} />
                        <span>{status === 'offline' ? 'Offline' : status === 'busy' ? (statusMessage || 'Working...') : 'Ready'}</span>
                    </div>
                </div>
            </div>

            {/* Models Dropdown/Panel */}
            {showModels && (
                <div className="models-panel" style={{
                    marginBottom: '1rem',
                    background: 'var(--bg-secondary)',
                    padding: '1rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-subtle)'
                }}>
                    <h3>Available Models</h3>
                    <div className="models-grid" style={{
                        display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem', marginTop: '1rem'
                    }}>
                        {models.map(m => (
                            <div key={m.id} className="model-card" style={{
                                padding: '1rem',
                                border: m.is_active ? '1px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
                                background: 'var(--bg-tertiary)',
                                borderRadius: 'var(--radius-sm)',
                                opacity: status === 'busy' ? 0.7 : 1
                            }}>
                                <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>{m.name}</div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>{m.description}</div>

                                {m.is_active ? (
                                    <div style={{ color: 'var(--accent-primary)', fontSize: '0.8rem' }}>● Active</div>
                                ) : loadingModelId === m.id ? (
                                    <button
                                        disabled
                                        style={{ width: '100%', padding: '6px', background: 'var(--bg-elevated)', border: 'none', borderRadius: '4px', cursor: 'wait' }}
                                    >
                                        ⏳ {statusMessage || 'Loading...'}
                                    </button>
                                ) : m.is_downloaded ? (
                                    <button
                                        onClick={() => handleLoad(m.id)}
                                        disabled={status === 'busy'}
                                        style={{ width: '100%', padding: '6px', background: 'var(--bg-elevated)', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                                    >
                                        Load Model
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => handleDownload(m.id)}
                                        disabled={status === 'busy'}
                                        style={{ width: '100%', padding: '6px', background: 'var(--accent-primary)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                                    >
                                        ⬇ Download
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="ai-content">
                <div className="prompt-section">
                    <div className="prompt-input">
                        <label>Describe the music</label>
                        <textarea
                            className="prompt-textarea"
                            placeholder="A chill lo-fi beat with jazzy piano chords..."
                            value={prompt}
                            onChange={e => setPrompt(e.target.value)}
                            disabled={status === 'busy' || status === 'offline'}
                        />
                    </div>

                    <div className="duration-control">
                        <label>Duration: {duration}s</label>
                        <input
                            type="range"
                            min="1"
                            max="30"
                            value={duration}
                            onChange={e => setDuration(parseInt(e.target.value))}
                            disabled={status === 'busy' || status === 'offline'}
                        />
                    </div>

                    <button
                        className="generate-btn"
                        onClick={handleGenerate}
                        disabled={!prompt || status === 'busy' || status === 'offline'}
                    >
                        {status === 'busy' ? (
                            <><span>✨</span> Working...</>
                        ) : (
                            <><span>✨</span> Generate Music</>
                        )}
                    </button>

                    {error && <div className="error-msg" style={{ color: 'var(--accent-danger)' }}>{error}</div>}
                </div>

                <div className="results-section">
                    <h3>Generated Clips</h3>

                    {/* Success notification */}
                    {successMessage && (
                        <div style={{
                            background: 'var(--accent-success, #22c55e)',
                            color: 'white',
                            padding: '8px 16px',
                            borderRadius: '6px',
                            marginBottom: '1rem',
                            fontWeight: 500,
                            animation: 'fadeIn 0.2s ease-out'
                        }}>
                            {successMessage}
                        </div>
                    )}

                    <div className="results-list">
                        {results.length === 0 && <p style={{ color: 'var(--text-muted)' }}>No generations yet.</p>}

                        {results.map((res, idx) => {
                            const isAdded = addedClips.has(res.filename);
                            return (
                                <div key={idx} className="result-card" style={{
                                    border: isAdded ? '1px solid var(--accent-success, #22c55e)' : undefined
                                }}>
                                    <div className="result-info">
                                        <div>
                                            <div className="result-prompt">{res.prompt || prompt || "Generated Audio"}</div>
                                            <div className="result-meta">{res.duration}s • WAV {isAdded && <span style={{ color: 'var(--accent-success, #22c55e)' }}>• In Project</span>}</div>
                                        </div>
                                    </div>
                                    <div className="result-actions">
                                        <button className="action-btn" onClick={() => handlePlay(res.path)}>▶ Play</button>
                                        <button
                                            className={`action-btn ${isAdded ? '' : 'primary'}`}
                                            onClick={() => handleImport(res)}
                                            style={isAdded ? { background: 'var(--accent-success, #22c55e)', color: 'white' } : undefined}
                                        >
                                            {isAdded ? '✓ Added' : '＋ Add to Project'}
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            <audio ref={audioRef} />
        </div>
    );
};
