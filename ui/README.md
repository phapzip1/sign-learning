# sign-learning

## Configuration

Set these in `ui/.env.local` (git-ignored) to point the UI at other servers:

| Variable | Default | Purpose |
|---|---|---|
| `VITE_API_URL` | `http://localhost:5026` | ASP.NET Core API |
| `VITE_INFERENCE_URL` | `http://localhost:8080` | FastAPI inference service |
