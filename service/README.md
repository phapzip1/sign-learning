# Sign Learning API (`service/`)

ASP.NET Core (.NET 10) Web API that owns the application data and rules: the dictionary, decks and cards, flashcard scheduling (FSRS), learning statistics, and word suggestions. It authenticates users with Clerk session tokens.

## Project layout

| Folder | Contents |
|---|---|
| `Controllers/` | HTTP endpoints. Each action is documented with its route and status codes. |
| `Services/` | Business logic behind the controllers (one interface + implementation each). |
| `Models/` | EF Core entities: `Word`, `Deck`, `Card`, `ReviewLog`, `WordSuggestion`. |
| `DTOs/` | Response shapes that differ from the entities. |
| `Data/` | `SignLearningContext`, the EF Core database context. |
| `Authentication/` | Clerk JWT bearer setup. |
| `Utils/` | `FsrsScheduler` (spaced repetition) and shared exceptions. |
| `Migrations/` | EF Core migrations (generated). |
| `Scripts/` | SQL scripts: schema, the first 40 words, and demo data. |
| `Program.cs` | Startup: configuration, CORS, authentication, the `Admin` policy, services. |

## Endpoints

| Method and route | Auth | Purpose |
|---|---|---|
| `GET /api/words` | — | Search words (search, topic, levels, sort, page, pageSize) |
| `GET /api/words/{id}` | — | One word |
| `GET /api/words/{id}/deck` | user | The caller's deck that contains this word |
| `POST`, `PUT`, `DELETE /api/words[/{id}]` | admin | Manage words |
| `GET`, `POST /api/decks` | user | List or create decks |
| `GET`, `PUT`, `DELETE /api/decks/{deckId}` | user | Read, update (partial) or delete a deck |
| `GET /api/decks/{deckId}/cards` | user | Cards in a deck |
| `POST /api/decks/{deckId}/words` | user | Add or move words into a deck |
| `GET /api/decks/{deckId}/study` | user | Counts and the next card to study |
| `POST /api/decks/{deckId}/cards/{cardId}/review` | user | Submit a rating (Again, Hard, Good, Easy) |
| `GET /api/stats/streak`, `/activity/{year}`, `/line-chart/{period}`, `/years` | user | Progress statistics |
| `POST /api/word-suggestions`, `GET /api/word-suggestions/mine` | user | Suggest words and see your own suggestions |
| `GET /api/admin/word-suggestions`, `POST …/{id}/approve`, `POST …/{id}/reject` | admin | Moderate suggestions |
| `GET /health` | — | Health check |

"user" means a valid Clerk session token. "admin" also requires the token's `role` claim to be `admin`. To add that claim, go to the Clerk dashboard, then Sessions → Customize session token, and add `"role": "{{user.public_metadata.role}}"`.

## Configuration

| Key (appsettings) | Environment variable | Purpose |
|---|---|---|
| `ConnectionStrings:DefaultConnection` | `ConnectionStrings__DefaultConnection` | MySQL, e.g. `Host=localhost;Port=3306;Username=…;Password=…;Database=learning` (add `SslMode=Required` for hosted databases) |
| `Clerk:Issuer` | `Clerk__Issuer` | Clerk issuer URL, e.g. `https://<your-app>.clerk.accounts.dev` |
| — | `CLERK_API_KEY` | Clerk secret key for the backend API (can live in `service/.env`) |
| `Cors:AllowedOrigins` | `Cors__AllowedOrigins` | Comma-separated web app origins; default `http://localhost:3000` |
| — | `PORT` | Listen port in containers; locally `launchSettings.json` uses 5026 |

## Setup

```bash
cd service
dotnet restore

# Create the database schema (either option):
dotnet ef database update                # uses the connection string
#   or run Scripts/create_schema.sql in a MySQL client

# Load dictionary words (the first 40 signs the model knows):
mysql -u <user> -p <database> < Scripts/insert_first_40_words.sql

# Optional: demo decks, review history and suggestions for one user
#   (edit @uid in the script to your Clerk user id first)
mysql -u <user> -p <database> < Scripts/demo_data.sql

dotnet run --launch-profile http         # → http://localhost:5026
```

## Docker / Vercel

`Dockerfile.vercel` builds and runs the API in a container. Vercel uses it through `vercel.json`. The app listens on `$PORT`. Set the configuration above as environment variables on the host.

```bash
docker build -f Dockerfile.vercel -t sign-learning-api .
docker run -p 8080:80 -e ConnectionStrings__DefaultConnection="…" -e Clerk__Issuer="…" -e CLERK_API_KEY="…" sign-learning-api
```
