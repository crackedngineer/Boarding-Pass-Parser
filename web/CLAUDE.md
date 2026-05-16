@AGENTS.md

# Frontend

## Commands (run from `web/`)

```bash
npm install
npm run dev          # Next.js dev on :3000
npm run build
npm run lint
npx tsc --noEmit     # type-check without emitting
```

## Environment (`web/.env.local`)

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api/v1
```

## Critical Patterns

- **Path alias:** `@/` → `web/` (set in `tsconfig.json`). Use it for all internal imports.
- **Auth (no localStorage):** `useAuth` (`lib/hooks/useAuth.ts`) calls `getMe()` on mount via cookie. Never read or write auth tokens in the frontend.
- **GmailSyncContext** is mounted in `web/app/dashboard/layout.tsx`. `useGmailSyncContext()` throws outside `/dashboard` routes.
- **Supabase SSR:** import `createClient` from `@/lib/supabase/client` (browser) or `@/lib/supabase/server` (server components). Do not import `@supabase/supabase-js` directly.
- **HTTP calls:** always go through `@/lib/api/http-client` — it sets `credentials: 'include'` and handles retries. Do not use raw `fetch` for API calls.
- **Tailwind v4:** theme tokens are in `web/app/globals.css` as CSS custom properties. There is no `tailwind.config.js`.
