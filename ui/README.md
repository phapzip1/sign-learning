# Sign Learning web app (`ui/`)

React web app built with TanStack Start (file-based routing and server rendering), shadcn/ui on Base UI, and Tailwind CSS. Users sign in with Clerk. All application data comes from the ASP.NET Core API in `service/`; sign search sends video clips to the recognition service in `inference/`.

## Run

```bash
cd ui
npm install
npm run dev      # development server → http://localhost:3000
npm run build    # production build (output in .output/)
```

There are no lint or test scripts yet. Type-check with `npx tsc --noEmit -p .`.

## Configuration

Create `ui/.env.local` (git-ignored):

| Variable | Required | Default | Purpose |
|---|---|---|---|
| `VITE_CLERK_PUBLISHABLE_KEY` | yes | — | Clerk sign-in in the browser |
| `CLERK_SECRET_KEY` | for the admin Users tab | — | Server-only key used by the `getAdminUsers` server function; never sent to the browser |
| `VITE_API_URL` | no | `http://localhost:5026` | ASP.NET Core API |
| `VITE_INFERENCE_URL` | no | `http://localhost:8080` | FastAPI recognition service |

`VITE_` variables are built into the browser code, so after changing them, rebuild (or restart `npm run dev`). On hosts like Render, run a fresh build too.

## Pages

| Route | File | What it does |
|---|---|---|
| `/` | `src/routes/index.tsx` | Landing page |
| `/dictionary` | `src/routes/dictionary/index.tsx` | Search, filters, sort, pagination and sign search; state kept in the URL |
| `/dictionary/:wordId` | `src/routes/dictionary/$wordId.tsx` | Word page: video, instructions, related signs, save to a collection |
| `/flashcards` | `src/routes/flashcards/index.tsx` | Study home: decks with new/learning/due counts |
| `/flashcards/:collectionId/learn` | `src/routes/flashcards/$collectionId.learn.tsx` | Sign-first flashcard session with ratings |
| `/me` | `src/routes/me/index.tsx` | Streak, study calendar and activity chart |
| `/me/collections` | `src/routes/me/collections.tsx` | Manage decks and their study settings |
| `/me/suggestions` | `src/routes/me/suggestions.tsx` | Suggest new words and see their status |
| `/admin` | `src/routes/admin/index.tsx` | Admin tabs: suggestions, words, users |

## Code layout

| Folder | Contents |
|---|---|
| `src/routes/` | Pages (TanStack file-based routes). `routeTree.gen.ts` is generated, so don't edit it. |
| `src/components/` | Feature components (sign search, deck editor, admin tabs, word cards …) |
| `components/ui/` | shadcn/ui building blocks (button, dialog, select …) |
| `src/lib/api.ts` | All HTTP calls to the API and recognition service |
| `src/lib/errors.ts` | Maps failed requests to friendly messages |
| `src/types/` | Types matching the API's JSON |

Every file starts with a short comment that explains its purpose. Exported functions and components have JSDoc comments.

## Auth notes

- Signed-in requests send the Clerk session token as `Authorization: Bearer <token>`.
- The Admin link is shown when the session token's `role` claim is `admin`. That only controls what is visible: the API checks the role on every admin request.
