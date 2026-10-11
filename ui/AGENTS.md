# UI Workspace Instructions

## Product Overview

This workspace is the frontend for a sign-language dictionary and flashcard-learning application.

The frontend is built with:
- React and TanStack Start / TanStack Router
- shadcn/ui components built on Base UI
- Axios for HTTP requests
- Clerk for authentication
- Recharts for charts
- Zustand for client-side state

Before changing code, inspect the existing package manifest, lockfile, route tree, component conventions, and installed library versions. Follow the existing project structure rather than introducing a new architecture or upgrading dependencies without a clear need.

## Product Principles

- Make the dictionary and learning experience the main focus of the application.
- Design for desktop and mobile, including touch-friendly signing/camera interactions.
- Treat sign languages as distinct languages with regional variation. Never assume all sign languages share the same vocabulary or grammar. Use language/region metadata already present in the data model; do not invent a default language.
- Prefer clear, encouraging learning feedback. Do not shame users for missed days or incorrect answers.
- Keep public dictionary discovery useful without requiring sign-in. Require sign-in only for actions that need an account, such as saving words to personal decks or managing personal data.
- Reuse existing design tokens and shadcn/ui Base UI components. Avoid creating a parallel design system.

## Workspace Boundaries and API Integration

- The ASP.NET Core service is the application API. Use its existing endpoints for application data.
- The FastAPI inference service is responsible for model inference. Do not call it directly from the browser unless the architecture explicitly changes and the security implications have been reviewed. Prefer the intended frontend -> ASP.NET Core -> FastAPI flow.
- Inspect API DTOs, OpenAPI documentation, existing Axios clients, and environment configuration before writing requests.
- Do not invent endpoints, request fields, response fields, sort keys, filter names, or status values. If a required API capability is missing, document the gap instead of faking production behavior with local arrays.
- Centralize Axios configuration, API base URL handling, auth-token attachment, and common error handling using the existing project patterns.
- Do not expose Clerk secret keys, backend credentials, internal service URLs, or other server-only configuration to browser code.
- Keep backend response types and frontend types aligned. Prefer shared/generated types if the repository already supports them.
- Handle loading, empty, unauthorized, forbidden, validation, network, timeout, and server-error states explicitly.

## Authentication and Authorization

- Use Clerk's existing TanStack Start integration and the current project conventions for obtaining the session token.
- Send a valid Clerk session token to the ASP.NET Core API using the established authentication mechanism.
- Route guards are a user-experience feature, not a security boundary. The ASP.NET Core API must independently verify authentication and enforce authorization for every protected operation.
- Admin pages and admin actions must require a server-verified admin role/permission. Never trust a role stored only in Zustand, local storage, query parameters, or client-editable state.
- After sign-in, return the user to the originally requested page when supported by the existing auth flow.
- For unauthenticated users who attempt to save a word or access personal decks, show a clear sign-in prompt and preserve the intended action where practical.
- Never log session tokens or private user data.

## Routing and Data Loading

- Follow TanStack Start's file-based routing and typed route conventions already used by this repository.
- Use route loaders/search parameters or the existing data-fetching approach for page data. Keep shareable dictionary search, filters, sorting, pagination, selected admin list views, and other navigable list state in URL search parameters where appropriate.
- Use Zustand for genuinely shared client state, such as transient UI preferences or camera-search workflow state when needed. Do not duplicate server-owned records or cache all API responses in Zustand without a clear reason.
- Keep route components focused. Extract reusable feature components and hooks when doing so improves clarity and testability.
- Add page titles and route-appropriate metadata using the project's existing TanStack Start conventions.

## Required Pages and Behaviors

### 1. Landing Page

- Explain what the app does and who it is for.
- Provide clear primary actions to browse the dictionary, search by signing, and open the decks/study area.
- Preview supported sign-language variants and representative dictionary/learning content using real data when available.
- Explain how sign-based search works and what camera permissions are used for.
- Include responsive layouts, useful empty/loading states for dynamic sections, and clear sign-in/sign-up calls to action without blocking public browsing.

### 2. Dictionary Page

- Support text search, sorting, and filters based on fields that actually exist in the API/data model.
- Include debounced text input where appropriate, but do not delay explicit submit actions or make the UI feel unresponsive.
- Represent active filters visibly and make them easy to clear. Keep filter/sort/page state in the URL when appropriate.
- Include pagination or another bounded-results strategy for large dictionaries. Avoid loading the entire dictionary just to filter it in the browser unless the dataset is explicitly small and designed for that.
- Include clear loading, no-results, API-error, and reset-filter states.
- Provide a sign-based search entry point with an accessible explanation of camera usage.

#### Sign-Based Search and Camera Lifecycle

- Request camera access only after the user intentionally starts sign-based search; do not activate the camera on page load.
- Clearly explain whether captured frames/video are sent to the backend for inference, how they are processed, and whether anything is retained. Do not claim that processing is local if inference occurs on the server.
- Handle permission denial, no camera device, unavailable/busy camera, unsupported browser APIs, network errors, inference failures, and no confident match with helpful UI.
- Provide an obvious way to cancel/stop camera use. Stop every acquired MediaStream track when the user stops, navigates away, or the component unmounts.
- Follow the existing inference request contract. Do not invent a frame rate, capture format, confidence threshold, or endpoint.
- If the service returns confidence scores or ranked candidates, present them according to the documented contract and avoid overstating uncertain predictions.
- Camera access requires a secure context in supported browsers; account for local development and HTTPS deployment requirements.

### 3. Word Detail Page

Display the available content for a selected word:
- The word/name and its sign-language variant.
- Step-by-step signing instructions in text.
- An illustrative image with meaningful alternative text.
- The word's definition and any available examples, usage notes, or grammatical/category metadata.
- A demonstration video with usable playback controls and any available captions/transcript or descriptive text.
- Related-word suggestions that link to valid word detail pages.
- An action to save the word to one of the user's decks when signed in.

Additional behavior:
- Provide useful fallback UI for missing images, unavailable videos, missing optional fields, or failed related-word requests.
- Do not autoplay video with sound. Preserve keyboard access and visible focus for media controls.
- Saving a word must use the backend API, reflect pending/success/failure states, and prevent accidental duplicate saves when the backend contract supports duplicate detection.
- If a user is signed out, show a sign-in prompt for save-to-deck actions instead of silently failing.
- Confirm destructive actions and respect server responses as the source of truth.

### 4. Decks / Study Landing Page

This is a standalone study-home screen inspired by Anki's deck overview. It is separate from the **Decks** tab in the user area: the study-home screen helps users choose a deck and start/resume learning, while the user-area tab focuses on managing deck information and contents.

- Show the user's available decks with useful information such as deck name, card count, new cards, cards due, learning progress, and last studied time when the API provides those fields.
- Make each deck's primary action obvious, such as **Study**, **Continue**, or **View deck**, according to its state and supported API operations.
- Include a concise study summary, such as cards due today or recent activity, only when reliable API data is available.
- Support searching, sorting, or filtering decks when useful and supported by the data/API. Keep list state in URL search parameters when that improves navigation and shareability.
- Provide a clear path to create a deck and manage existing decks using the application's established flow.
- If public/shared or recommended decks are supported, separate them visually from the user's personal decks. Do not fabricate public decks or show fake progress data.
- For signed-out visitors, follow the product's intended access model: show an appropriate sign-in prompt for private decks, and allow public deck previews only if the backend supports them.
- Handle empty, loading, stale-data, API-error, and retry states. On mobile, keep the deck selection and study actions easy to use.

### 5. Flashcard Study Page

This is the focused, one-card-at-a-time study session for a selected deck. Its default experience is **sign-first recall**, similar to a flashcard app: show the sign demonstration first, then let the learner reveal the answer.

#### Before revealing the answer

- Display the current card's sign demonstration using the available video or image, with accessible playback controls and a clear **Reveal answer** button.
- Show only the prompt-side content required by the selected study mode. For sign-first recall, do not reveal the word name or definition before the learner requests the answer.
- Show session progress (for example, current card and total cards) and a way to exit or pause the session without accidentally losing progress.
- Handle missing media, loading failures, and empty decks with clear alternatives and actions.

#### After revealing the answer

- Reveal the word/name, definition, written signing instructions, and other relevant details available for that word.
- Offer review feedback controls based on the backend's supported learning model. If spaced repetition is implemented, use its defined rating options and submit the rating through the API. Otherwise, use only the simpler supported actions (such as remembered / needs practice); do not invent a scheduling algorithm or claim that a card has been learned without recording the relevant result.
- Clearly distinguish revealing an answer from submitting a review result. A reveal alone must not count as a successful review unless that is explicitly how the backend defines it.
- Advance to the next card only according to the established review flow. Prevent duplicate submissions from double-clicks and show recoverable errors if saving a review fails.
- At session completion, show a summary based on persisted results and offer a clear way to return to the deck overview or start another supported session.

#### Study session behavior

- Load cards and submit review results using the documented ASP.NET Core API contract; do not invent endpoints, due-card rules, or response fields.
- Keep session-only UI state separate from persisted deck/card/review data.
- If card order can be shuffled, make the current order stable during a session unless the user explicitly reshuffles.
- Keep progress and keyboard/touch controls accessible. Optional shortcuts (such as Space to reveal) must not interfere with typing, media controls, assistive technology, or normal browser behavior.
- Handle expired authentication, unavailable APIs, empty sessions, and interrupted sessions gracefully.
- Add tests for reveal/hide behavior, review submission, repeated clicks, failed saves, and session completion as appropriate.

### 6. User Area

Organize the user area into three tabs: **Overview**, **Decks**, and **Suggestions**. Preserve the existing routing pattern; use URL-backed tab state if appropriate for direct links and browser navigation.

#### Overview Tab

- Show the current user's basic profile information from the trusted user/API source.
- Show a learning streak with a clearly defined rule for what counts as a learning day.
- Show a GitHub-style activity heatmap (a contribution/activity grid, not a geographic map) for learning activity.
- Show a Recharts line chart of learned cards over the last 7 days, 30 days, or quarter.
- Use real API data and display zero-activity dates consistently. Make the date range selectable and label the selected period clearly.
- Handle timezone boundaries and date grouping consistently with the backend's definition of a learning day.
- Include readable chart labels, useful tooltips, a no-data state, and a non-visual/textual summary or accessible data alternative. Do not rely on color alone to convey activity or progress.

#### Decks Tab

- List the current user's decks with useful metadata such as name, card count, and last activity when returned by the API.
- Let the user select a deck and view its details/cards.
- Support creating or updating deck information and deleting a deck according to available API capabilities.
- Confirm deletion and explain what will happen to cards/saved words before the user confirms, based on the actual backend behavior.
- Include empty, loading, permission, validation, and API-error states.
- Keep edits explicit and show unsaved/saving/saved/error states as appropriate.

#### Suggestions Tab

- Let signed-in users submit a proposed new word using the fields required by the existing API contract.
- Show previous submissions and their server-defined statuses, such as pending, approved, or declined, only where those statuses exist in the API.
- Display a moderator's decline reason when provided.
- Prevent accidental duplicate submissions where feasible and clearly show validation errors.
- Do not let users approve their own suggestions or change moderation status from the client.

### 7. Admin Area

The admin area contains **Users**, **Words**, and **Word Suggestions** tabs. Protect both the routes and every associated API operation; hiding admin navigation in the UI is not authorization.

#### Users Tab

- Show users with search, filters, sorting, and pagination or another bounded-results strategy.
- Show relevant basic information from the API while minimizing exposure of sensitive information.
- Support ban/unban actions only when authorized by the backend.
- Confirm high-impact actions, show the result, and handle stale data or API failures.
- Display a clear status and, if supported, the ban reason/expiry.

#### Words Tab

- Show a searchable, filterable, sortable word list using actual server-supported fields.
- Allow an admin to inspect all relevant word details and update or delete a word according to API capabilities.
- Confirm deletion and communicate consequences where known.
- Revalidate/refetch the relevant data after a successful mutation so lists and details do not show stale values.

#### Word Suggestions Tab

- Show submitted suggestions with search, filters, sorting, and pagination.
- Show the proposal details and any associated explanatory material or media that the API supports.
- Allow authorized admins to approve a suggestion to create a word, or decline it with a reason.
- Require a reason where the API/product rules require one; validate it in the UI but treat backend validation as authoritative.
- Prevent duplicate submissions of moderation actions and handle conflicts when another moderator has already processed an item.
- After approval, show the created word or link to it if the API returns its identifier.

## Design System and Accessibility

- Use shadcn/ui components from the Base UI-based installation already present. Check the installed component APIs; do not copy Radix-specific examples into a Base UI project without verifying compatibility.
- Use semantic HTML, accessible labels, descriptive button text, keyboard-operable controls, visible focus, appropriate contrast, and reduced-motion preferences.
- Do not rely on color alone for status, charts, sorting, errors, or learning progress.
- Make tables, tabs, dialogs, dropdowns, forms, charts, and media controls accessible by keyboard and assistive technology.
- Give meaningful alternative text to informative images; use empty alt text for purely decorative images.
- Provide captions/transcripts or equivalent descriptive support when available for videos. Do not invent captions or signing instructions.
- Ensure layouts work on small screens and that camera controls remain usable on touch devices.

## State and UX Conventions

- For every data-backed screen, consider loading, success, empty, error, and retry states.
- Disable or otherwise guard repeat submissions while a mutation is in progress, without making controls inaccessible.
- Use consistent toast/inline-feedback patterns already present in the project.
- Use optimistic UI only when rollback and failure behavior are handled correctly and the existing codebase supports it.
- Confirm destructive or high-impact operations (delete, ban/unban, moderation decisions) where appropriate.
- Avoid mock data in production flows. If mock data is needed during development, mark it clearly and keep it behind a test/story/demo boundary.

## Code Quality and Testing

- Keep TypeScript strictness and project lint conventions intact. Avoid `any` unless there is a documented reason.
- Reuse shared types, API clients, form schemas, table utilities, and UI patterns where appropriate.
- Add or update tests for meaningful UI logic and error states, especially auth-gated actions, search/filter state, camera cleanup, deck mutations, and moderation actions.
- Test at least the relevant happy path and important failure/permission paths for changed behavior.
- Run the scripts that actually exist in `package.json` (for example, lint, typecheck, test, or build). Do not assume script names.
- Do not edit generated route-tree files unless the project's tooling explicitly requires it.

## Implementation Workflow

1. Inspect the existing route tree, UI components, API client, DTOs, auth integration, and available scripts.
2. Identify which page, backend contract, and workspace(s) the change affects.
3. Reuse existing patterns and make the smallest coherent implementation.
4. Update types, loading/error states, accessibility, and tests along with the main feature.
5. If a required backend capability does not exist, clearly report it rather than inventing an endpoint or simulating success.
6. Summarize files changed, behavior implemented, validation run, and any API/backend work still required.
