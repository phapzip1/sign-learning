"""FastAPI web service for sign recognition.

Endpoints:
    GET  /health   liveness check.
    POST /predict  multipart form with a "video" file; returns the top 5 signs as
                   {label: score}, highest score first.

Configuration (environment variables):
    HOST          address to listen on (default 127.0.0.1; containers use 0.0.0.0).
    PORT          port to listen on (default 8080).
    CORS_ORIGINS  comma-separated frontend origins allowed to call the API
                  (default http://localhost:3000).

Uploaded videos are written to a temporary file and deleted after recognition.
"""
import os
import threading
from functools import lru_cache
import aiofiles
import uvicorn
from fastapi import FastAPI, Depends, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.concurrency import run_in_threadpool
from inference import Inference

# Comma-separated frontend origins, e.g. CORS_ORIGINS="http://localhost:3000,https://my-ui.onrender.com".
origins = [
    origin.strip().rstrip("/")
    for origin in os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")
    if origin.strip()
]

# The TFLite model and label map are loaded once and reused across requests.
@lru_cache(maxsize=1)
def _load_model():
    """Load the TFLite model and label map once (cached) and return (prediction_fn, labels)."""
    prediction_fn = Inference.load_prediction_fn("./assets/model.tflite")
    labels = Inference.load_label_map("./assets/sign_to_prediction_index_map.json")
    return prediction_fn, labels

# The shared TFLite interpreter isn't thread-safe, so predictions run one at a time.
_predict_lock = threading.Lock()

def _get_inference():
    """FastAPI dependency: a new Inference for each request, sharing the cached model."""
    prediction_fn, labels = _load_model()
    # A fresh Inference per request gives each video its own MediaPipe tracking state.
    return Inference(prediction_fn=prediction_fn, idx_to_sign=labels)

def _run_locked(inference, file_name, topk):
    """Run recognition while holding the lock, because the shared TFLite interpreter is not thread-safe."""
    with _predict_lock:
        return inference.run_on_video_file(file_name, topk)

_app = FastAPI()

@_app.get("/health")
def _health_check():
    """GET /health: report that the service is running."""
    return { "health-check": "oke" }

@_app.post("/predict")
async def _predict(video: UploadFile = File(...),  infernce: Inference = Depends(_get_inference)):
    """POST /predict: recognise the sign in an uploaded video.

    The upload is saved to a temporary file, processed off the event loop, and the
    file is always deleted afterwards. Returns {sign label: raw score} for the top 5.
    """
    try:
        async with aiofiles.tempfile.NamedTemporaryFile("wb", delete=False) as temp:
            try:
                contents = await video.read()
                await temp.write(contents)
            except Exception as e:
                raise HTTPException(status_code=500, detail=e)
            finally:
                await video.close()

        result = await run_in_threadpool(_run_locked, infernce, temp.name, 5)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=e)
    finally:
        os.remove(temp.name)

class App:        
    """Starts the FastAPI app with Uvicorn and CORS enabled."""
    @staticmethod
    # HOST/PORT let containers listen publicly; local runs keep 127.0.0.1:8080.
    def run(http_addr = os.getenv("HOST", "127.0.0.1"), http_port = int(os.getenv("PORT", "8080"))):
        """Add CORS for the configured origins and serve the app with Uvicorn (blocks until stopped)."""
        _app.add_middleware(
            CORSMiddleware,
            allow_origins=origins,
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
        )
        uvicorn.run(_app, port=http_port, host=http_addr)
        pass