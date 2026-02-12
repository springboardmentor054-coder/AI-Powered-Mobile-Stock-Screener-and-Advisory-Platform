
# Copilot Instructions (AI-Powered Mobile Stock Screener)

## Architecture Overview
- **Expo Router** app with file-based routing under [app](app). The root layout ([app/_layout.tsx](app/_layout.tsx)) wraps all screens in a single `AuthProvider` ([app/contexts/AuthContext.tsx](app/contexts/AuthContext.tsx)).
- **Authentication** is handled via Supabase (`@supabase/supabase-js`), not Clerk (README is outdated). Auth screens are in [app/auth](app/auth) and use helpers from [supabaseClient.ts](supabaseClient.ts).
- **Session state** is managed by `AuthContext`, which listens for Supabase auth changes and exposes `session`, `user`, and `loading`.
- **Route protection**: Use `ProtectedRoute` ([app/components/ProtectedRoute.tsx](app/components/ProtectedRoute.tsx)) for screens requiring auth, and `PublicRoute` ([app/components/PublicRoute.tsx](app/components/PublicRoute.tsx)) for public-only screens. Redirects are client-side (see [app/index.tsx](app/index.tsx)).
- **Stock data**: UI components for stock display are in [app/components/cards.tsx](app/components/cards.tsx) and [app/components/hero.tsx](app/components/hero.tsx). Stock queries and parsing logic live in [script/llmservicess/](script/llmservicess/).
- **Database schema** and triggers are defined in [database/authentication.psql](database/authentication.psql). Key tables: `user_profiles`, `user_sessions`, `user_activity_log`, `stocks_raw_upload`.

## Developer Workflows
- **Install dependencies**: `npm install`
- **Run app**: `npm run start` (or `npm run android` / `npm run ios` / `npm run web`)
- **Lint**: `npm run lint`
- **Reset project**: `npm run reset-project` (moves starter code to `app-example/` and creates a blank `app/`)
- **Environment**: Set `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` in `.env` (required at runtime).

## Auth & Session Patterns
- All auth logic is centralized in [supabaseClient.ts](supabaseClient.ts) and [app/contexts/AuthContext.tsx](app/contexts/AuthContext.tsx). Do not add direct Supabase calls in screens—use helpers.
- User metadata (`first_name`, `last_name`, `display_name`) is set at signup and read from `user.user_metadata` throughout the app. Keep this shape consistent.
- Login triggers an RPC (`update_last_login`) to update activity logs (see [database/authentication.psql](database/authentication.psql)).
- Auth redirects are handled in React hooks, not at the route level. Always preserve the redirect pattern in [app/index.tsx](app/index.tsx) for new screens.

## UI & Component Conventions
- Main layout uses `Header` ([app/components/header.tsx](app/components/header.tsx)) and `Hero` ([app/components/hero.tsx](app/components/hero.tsx)). `Hero` manages local message state and toggles input-only mode.
- Stock display and charting logic is in [app/components/cards.tsx](app/components/cards.tsx). Use the `StockRow` type for stock data shape.
- Profile display is handled by [app/components/ProfileCard.tsx](app/components/ProfileCard.tsx), which reads user metadata and manages logout.

## Backend & Scripting
- Stock query parsing and LLM integration are in [script/llmservicess/]. Use [llmparser.js](script/llmservicess/llmparser.js) and [queryselector.js](script/llmservicess/queryselector.js) for DSL parsing and stock filtering.
- Stock data is stored in the `stocks_raw_upload` table (see [database/authentication.psql](database/authentication.psql)).
- Scripts in [script/stocks/] and [script/auth/] provide validation and utility functions for stock and auth flows.

## Project-Specific Notes
- README references Clerk, but only Supabase is used for auth. Ignore Clerk setup instructions.
- All environment variables must be present at runtime; missing Supabase keys will cause startup errors.
- Do not add new auth/session logic in screens—extend helpers in [supabaseClient.ts](supabaseClient.ts) if needed.
- When adding new database fields or triggers, update [database/authentication.psql](database/authentication.psql) and keep metadata shape in sync with signup logic.

---
For any unclear or incomplete sections, please provide feedback so this guide can be further refined.
