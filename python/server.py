import os
import uvicorn
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
import torch
from scipy.io import wavfile
from transformers import AutoProcessor, MusicgenForConditionalGeneration
import numpy as np
import uuid
import logging
from typing import List, Optional

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

# Enable CORS for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global variables to hold model
model = None
processor = None
active_model_id = None
OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "generated")

# Ensure output directory exists
os.makedirs(OUTPUT_DIR, exist_ok=True)

# Serve generated files statically
app.mount("/generated", StaticFiles(directory=OUTPUT_DIR), name="generated")

# Supported Models
SUPPORTED_MODELS = [
    {"id": "facebook/musicgen-small", "name": "MusicGen Small (Fast)", "description": "Good quality, fastest generation."},
    {"id": "facebook/musicgen-medium", "name": "MusicGen Medium (Quality)", "description": "Better quality, slower generation."},
    {"id": "facebook/musicgen-melody", "name": "MusicGen Melody", "description": "Can be conditioned on melody (audio)."},
    {"id": "facebook/musicgen-large", "name": "MusicGen Large (Slow)", "description": "Best quality, requires significant VRAM."}
]

class GenerateRequest(BaseModel):
    prompt: str
    duration: int = 5

class LoadModelRequest(BaseModel):
    model_id: str

class ModelInfo(BaseModel):
    id: str
    name: str
    description: str
    is_downloaded: bool
    is_active: bool

def is_model_downloaded(model_id: str) -> bool:
    try:
        # Check if model can be loaded with local_files_only=True
        # This is a bit heavy but accurate check for huggingface cache
        AutoProcessor.from_pretrained(model_id, local_files_only=True)
        return True
    except OSError:
        return False
    except Exception:
        return False

@app.get("/health")
async def health_check():
    return {"status": "ok", "active_model": active_model_id}

@app.get("/models", response_model=List[ModelInfo])
async def list_models():
    models_status = []
    
    # Check status for each model
    for m in SUPPORTED_MODELS:
        is_active = (active_model_id == m["id"])
        # We can optimize is_downloaded check if it's too slow, but for 4 models it's okay-ish
        # Actually, let's just try to infer from cache path or assume false if not active?
        # No, better to try/catch
        is_dl = is_model_downloaded(m["id"])
        
        models_status.append(ModelInfo(
            id=m["id"],
            name=m["name"],
            description=m["description"],
            is_downloaded=is_dl,
            is_active=is_active
        ))
        
    return models_status

@app.post("/model/download")
async def download_model(req: LoadModelRequest, background_tasks: BackgroundTasks):
    # We use background tasks to download so we don't block response
    # But for simplicity in UI, we might want to block or report progress?
    # Blocking is easiest for "Loading..." spinner.
    
    try:
        logger.info(f"Downloading model: {req.model_id}")
        # This triggers download
        AutoProcessor.from_pretrained(req.model_id)
        MusicgenForConditionalGeneration.from_pretrained(req.model_id)
        logger.info(f"Downloaded {req.model_id}")
        return {"status": "success", "message": f"{req.model_id} downloaded."}
    except Exception as e:
        logger.error(f"Download failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/model/load")
async def load_model(req: LoadModelRequest):
    global model, processor, active_model_id
    
    if req.model_id == active_model_id and model is not None:
        return {"status": "success", "message": "Model already loaded"}
        
    try:
        if not is_model_downloaded(req.model_id):
            # Try to download if not found? Or fail?
            # Let's auto-download if user explicitly asked to load
            pass

        logger.info(f"Loading model: {req.model_id}")
        
        processor = AutoProcessor.from_pretrained(req.model_id)
        model = MusicgenForConditionalGeneration.from_pretrained(req.model_id)
        
        # Move to GPU if available
        device = "cuda" if torch.cuda.is_available() else "cpu"
        if torch.backends.mps.is_available():
            device = "mps"
            
        logger.info(f"Using device: {device}")
        
        # Free up memory if previous model exists?
        # Python GC should handle it if we overwrite global variables
        model.to(device)
        active_model_id = req.model_id
        
        return {"status": "success", "message": f"Loaded {req.model_id} on {device}"}
    except Exception as e:
        logger.error(f"Failed to load model: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/generate")
async def generate_music(req: GenerateRequest):
    global model, processor, active_model_id
    
    if model is None:
        # Check if we have a default downloaded, otherwise error
        # Try small by default
        default_id = "facebook/musicgen-small"
        try:
            await load_model(LoadModelRequest(model_id=default_id))
        except Exception:
             raise HTTPException(status_code=400, detail="No model loaded and failed to load default.")

    try:
        logger.info(f"Generating: '{req.prompt}' for {req.duration}s")
        
        device = model.device
        inputs = processor(
            text=[req.prompt],
            padding=True,
            return_tensors="pt",
        ).to(device)
        
        tokens_to_generate = int(req.duration * 50)
        if tokens_to_generate > 1500:
            tokens_to_generate = 1500
            
        audio_values = model.generate(**inputs, max_new_tokens=tokens_to_generate)
        
        sampling_rate = model.config.audio_encoder.sampling_rate
        
        filename = f"{uuid.uuid4()}.wav"
        filepath = os.path.join(OUTPUT_DIR, filename)
        
        audio_data = audio_values[0].cpu().numpy()
        # Normalize to int16 for WAV format
        audio_int16 = (audio_data * 32767).astype(np.int16)
        # If stereo, transpose to (samples, channels)
        if audio_int16.ndim > 1:
            audio_int16 = audio_int16.T
        wavfile.write(filepath, sampling_rate, audio_int16)
        
        public_path = f"http://localhost:8000/generated/{filename}"
        
        return {
            "status": "success",
            "path": public_path,
            "duration": req.duration,
            "filename": filename,
            "model": active_model_id
        }
        
    except Exception as e:
        logger.error(f"Generation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
