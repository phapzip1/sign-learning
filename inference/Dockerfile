FROM python:3.11-slim

# OpenCV (pulled in by mediapipe) needs these system libraries even without a display.
RUN apt-get update \
    && apt-get install -y --no-install-recommends libgl1 libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /inference

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# The app loads ./assets/..., so keep the folder.
COPY assets/ ./assets/
COPY app.py inference.py main.py ./

# Listen on all interfaces; platforms can override PORT. Set CORS_ORIGINS to the UI origin(s).
ENV HOST=0.0.0.0 PORT=8080
EXPOSE 8080

CMD ["python", "main.py"]
