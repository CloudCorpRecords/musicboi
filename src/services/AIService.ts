const API_URL = 'http://localhost:8000';

export interface GenerationResult {
    status: string;
    path: string; // URL path to the generated file
    duration: number;
    filename: string;
    prompt?: string;
}

export interface ModelInfo {
    id: string;
    name: string;
    description: string;
    is_downloaded: boolean;
    is_active: boolean;
}

export const AIService = {
    async checkHealth(): Promise<boolean> {
        try {
            const response = await fetch(`${API_URL}/health`);
            return response.ok;
        } catch (e) {
            return false;
        }
    },

    async getModels(): Promise<ModelInfo[]> {
        const response = await fetch(`${API_URL}/models`);
        if (!response.ok) throw new Error('Failed to fetch models');
        return await response.json();
    },

    async downloadModel(modelId: string): Promise<void> {
        const response = await fetch(`${API_URL}/model/download`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ model_id: modelId }),
        });
        if (!response.ok) throw new Error('Failed to download model');
    },

    async loadModel(modelId: string = 'facebook/musicgen-small'): Promise<void> {
        const response = await fetch(`${API_URL}/model/load`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ model_id: modelId }),
        });

        if (!response.ok) {
            throw new Error('Failed to load model');
        }
    },

    async generateMusic(prompt: string, duration: number = 5): Promise<GenerationResult> {
        const response = await fetch(`${API_URL}/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt, duration }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Generation failed');
        }

        return { ...await response.json(), prompt };
    }
};
