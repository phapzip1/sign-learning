# Sign Learning

A web app for learning sign language vocabulary: find a sign (by typing a word, or by signing to your webcam), save it to a collection, and practise it with spaced-repetition flashcards.

The project is split into three independent services:

| Folder | What it is | Tech |
|---|---|---|
| [`ui/`](ui/README.md) | Web app (pages, components, calls to the API) | React, TanStack Start, shadcn/ui, Tailwind, Clerk |
| [`service/`](service/README.md) | Application API (data, auth checks, flashcard scheduling) | ASP.NET Core (.NET 10), EF Core, MySQL, Clerk |
| [`inference/`](inference/README.md) | Sign recognition from a video clip | Python, FastAPI, MediaPipe, TensorFlow Lite |

## How the parts connect

```
Browser (ui) ──HTTP + Clerk token──▶ API (service) ──EF Core──▶ MySQL
     │
     └──────────video clip──────────▶ Recognition (inference) ──▶ top 5 signs
```

- Users sign in with **Clerk**. The web app sends the Clerk session token with every API request, and the API checks it. Admin endpoints also require the token's `role` claim to be `admin`.
- The **API** stores words, decks, cards, review history and word suggestions in MySQL, and schedules flashcards with the FSRS algorithm.
- For sign search, the browser records a clip of up to 10 seconds and sends it to the **recognition service**. That service turns each frame into 543 landmarks with MediaPipe, runs the TFLite model (250 signs, trained on Google's Isolated Sign Language Recognition dataset), and returns the 5 most likely signs.

## Running everything locally

Prerequisites: Node.js 24, .NET 10 SDK, Python 3.11, MySQL 8, and a Clerk application.

Use three terminals:

```bash
# 1. API → http://localhost:5026
cd service && dotnet run --launch-profile http

# 2. Recognition service → http://localhost:8080
cd inference && .venv/bin/python main.py

# 3. Web app → http://localhost:3000
cd ui && npm install && npm run dev
```

First-time setup for each service (configuration, database, Python environment) is described in its own README.

Check that the backends are running:

```bash
curl http://localhost:5026/health   # OK
curl http://localhost:8080/health   # {"health-check":"oke"}
```

## Configuration at a glance

| Service | Setting | Where | Purpose |
|---|---|---|---|
| ui | `VITE_CLERK_PUBLISHABLE_KEY` | `ui/.env.local` | Clerk sign-in in the browser |
| ui | `CLERK_SECRET_KEY` | `ui/.env.local` | Server-side admin user list |
| ui | `VITE_API_URL`, `VITE_INFERENCE_URL` | `ui/.env.local` | Backend addresses (default localhost) |
| service | `ConnectionStrings__DefaultConnection` | appsettings / env | MySQL connection |
| service | `Clerk__Issuer` | appsettings / env | Clerk token issuer URL |
| service | `CLERK_API_KEY` | `service/.env` / env | Clerk backend API (user management) |
| service | `Cors__AllowedOrigins` | env | Allowed web app origins (default `http://localhost:3000`) |
| inference | `HOST`, `PORT`, `CORS_ORIGINS` | env | Listen address and allowed origins |

Never commit real secrets. `.env` files are for local use only.

## Deployment

The API and the recognition service each have a Dockerfile (`service/Dockerfile.vercel`, `inference/Dockerfile`). The current setup is: web app on Render, API on Vercel, MySQL on Aiven, with the recognition service run locally.

## Known issues and limitations

- **Duplicate words return 500:** adding or editing a word with an existing value throws an exception that the API does not turn into 409 Conflict.
- **Ban/unban is not safe to expose:** those endpoints only require a signed-in user (not an admin), and `UserService.BanUserAsync` has its ban and unban branches swapped. No UI uses them yet.
- **User list paging:** `UserService.GetUsersAsync` ignores `limit` and `offset`.
- **Recognition is called directly:** the browser calls the recognition service directly instead of going through the API.
- **Daily review limit:** the "maximum reviews per day" deck setting is saved but not enforced.
- **Time zone:** study days (streak, calendar, new-card limit) reset at midnight UTC.
- **Webcam tool:** in `inference.py`, the auto-stop after `--max-frames` fails, and the command-line flags are ignored.
- **No automated tests yet.**
- **Unused files** kept from prototyping:
  - `ui/src/lib/mock.ts`, `ui/src/providers/app-provider.ts`, and the empty admin stub pages,
  - `service/Models/Instruction.cs`, `service/DTOs/ReviewDTOs.cs`,
  - `inference/assets/holistic_landmarker.task`.
