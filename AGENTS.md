# AGENTS.md

Read by non-Claude agents (Codex, Gemini, etc.). Claude Code reads `CLAUDE.md` instead, which has the full architecture and MCP tool guidance.

## Quick Commands

```bash
# Backend (from api/)
uv sync
uv run uvicorn app.main:app --reload --port 8000
uv run celery -A app.tasks.celery_app worker --loglevel=info
uv run alembic upgrade head
uv run pytest

# Frontend (from web/)
npm install && npm run dev
npx tsc --noEmit   # type-check
npm run lint
```

## Agent Caveats

- **Auth is cookie-only.** Never use `localStorage` for tokens. All `fetch` calls must use `credentials: 'include'`. The existing `http-client.ts` already does this — don't bypass it.
- **Registering new routes:** Add the router to `api/app/core/app_factory.py`. Routes are not auto-discovered.
- **Celery tasks:** Must be listed in the `include=` parameter in `api/app/tasks/celery_app.py`.
- **GmailSyncContext** is only available inside the `/dashboard` segment — it is mounted in `web/app/dashboard/layout.tsx`. Do not call `useGmailSyncContext()` from pages outside this layout.
- **`@/` path alias** resolves to `web/` (the frontend root), not `web/src/` or `web/app/`.
- **Mail provider tokens** are Fernet-encrypted in the DB. Always use `MailTokenService` to read/write them — never store raw tokens.
