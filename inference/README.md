# Sign recognition service (`inference/`)

FastAPI service that recognises a sign from a short video clip.

How it works:
1. Each frame of the uploaded video is passed through **MediaPipe Holistic**, giving 543 landmarks per frame (468 face, 21 per hand, 33 body), each with x, y and z.
2. The sequence of landmark frames goes into a **TensorFlow Lite** model trained on Google's [Isolated Sign Language Recognition](https://www.kaggle.com/competitions/asl-signs) dataset (250 signs).
3. The service returns the **5 highest-scoring signs**.

The scores are raw model outputs, not probabilities, so the web app shows them as a ranking and lets the learner choose.

## Files

| File | Purpose |
|---|---|
| `app.py` | FastAPI app: `/health` and `/predict`, CORS, model loading |
| `inference.py` | Landmark extraction, model calls, and a webcam testing tool |
| `main.py` | Entry point (`python main.py`) |
| `assets/model.tflite` | The trained model |
| `assets/sign_to_prediction_index_map.json` | Sign label → model output index |
| `Dockerfile` | Container image for hosting |

## API

| Method | Route | Body | Response |
|---|---|---|---|
| `GET` | `/health` | — | `{"health-check": "oke"}` |
| `POST` | `/predict` | `multipart/form-data` with a `video` file (WebM/MP4) | `{"<sign>": <score>, …}`, the top 5, highest first |

Uploaded videos are saved to a temporary file and always deleted after recognition.

## Run locally

```bash
cd inference
python3.11 -m venv .venv
.venv/bin/pip install -r requirements.txt
.venv/bin/python main.py            # → http://127.0.0.1:8080
```

Test it with a video file:

```bash
curl -F "video=@my-sign.webm" http://127.0.0.1:8080/predict
```

To test the model with your webcam (press SPACE to start and stop recording, Q to quit):

```bash
.venv/bin/python inference.py
```

## Configuration

| Variable | Default | Purpose |
|---|---|---|
| `HOST` | `127.0.0.1` | Listen address (`0.0.0.0` in containers) |
| `PORT` | `8080` | Listen port |
| `CORS_ORIGINS` | `http://localhost:3000` | Comma-separated web app origins allowed to call the service |

## Docker

```bash
docker build -t sign-inference .
docker run -p 8080:8080 -e CORS_ORIGINS="http://localhost:3000" sign-inference
```
