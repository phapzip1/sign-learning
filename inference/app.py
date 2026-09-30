import os
import aiofiles
import uvicorn
from fastapi import FastAPI, Depends, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.concurrency import run_in_threadpool
from inference import Inference

origins = [
    "http://localhost:3000"
]

def _get_inference():
    prediction_fn = Inference.load_prediction_fn("./assets/model.tflite")
    labels = Inference.load_label_map("./assets/sign_to_prediction_index_map.json")
    inference = Inference(prediction_fn=prediction_fn, idx_to_sign=labels)

    return inference

_app = FastAPI()

@_app.get("/health")
def _health_check():
    return { "health-check": "oke" }

@_app.post("/predict")
async def _predict(video: UploadFile = File(...),  infernce: Inference = Depends(_get_inference)):
    try:
        async with aiofiles.tempfile.NamedTemporaryFile("wb", delete=False) as temp:
            try:
                contents = await video.read()
                await temp.write(contents)
            except Exception as e:
                raise HTTPException(status_code=500, detail=e)
            finally:
                await video.close()

        result = await run_in_threadpool(infernce.run_on_video_file, temp.name, 5)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=e)
    finally:
        os.remove(temp.name)

class App:        
    @staticmethod
    def run(http_addr = "127.0.0.1", http_port = 8080):
        _app.add_middleware(
            CORSMiddleware,
            allow_origins=origins,
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
        )
        uvicorn.run(_app, port=http_port, host=http_addr)
        pass