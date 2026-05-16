# GEMINI.md

Read by Gemini CLI / Gemini Code Assist. Full architecture: see `CLAUDE.md`. Agent caveats and commands: see `AGENTS.md`.

## Gemini-Specific Notes

**Paths (Gemini tends to assume common layouts — these differ here):**
- Backend is in `api/` — not `app/backend/` or `src/`
- Frontend is in `web/` — not `app/frontend/` or `web/src/`
- Next.js App Router pages live in `web/app/` — there is no `src/` directory

**Auth (do not use localStorage):**
- The project uses HttpOnly cookies, not `localStorage`. Do not generate `localStorage.setItem('token', ...)`.
- All HTTP requests must include `credentials: 'include'`. Use the existing `@/lib/api/http-client`.

**Python:**
- Use `async`/`await` throughout — all FastAPI route handlers, services, and DB operations are async.
- Settings are loaded once via `@lru_cache` on `get_settings()` in `core/settings.py`. Do not instantiate `Settings()` directly.

**Frontend:**
- Tailwind CSS v4 — no `tailwind.config.js`. Theme tokens are CSS custom properties in `web/app/globals.css`.
- `radix-ui` is imported from the v1 monorepo package (`import { Dialog } from 'radix-ui'`), not `@radix-ui/react-dialog`.
- shadcn/ui components live in `web/components/ui/`. Check before re-generating.
