# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**FlightTrackr** is a full-stack boarding pass parsing application. It reads airline boarding pass PDFs, decodes the BCBP (Bar Coded Boarding Pass) barcode embedded in the document, and extracts structured flight data. The project name in the repository is "Boarding-Pass-Parser".

- **Backend**: Python/FastAPI at `api/`
- **Frontend**: Next.js 16 / React 19 / TypeScript at `web/`
- **Database**: Supabase (Postgres via SQLAlchemy async + Supabase Python client)
- **Auth**: Supabase Google OAuth — HttpOnly session cookies; no localStorage tokens
- **Background tasks**: Celery + Redis for async Gmail sync

---

## Backend

### Commands (run from `api/`)

```bash
# Install dependencies (uses uv)
uv sync

# Run dev server
uv run uvicorn app.main:app --reload --port 8000

# Run Celery worker (required for Gmail sync)
uv run celery -A app.tasks.celery_app worker --loglevel=info

# Run database migrations
uv run alembic upgrade head

# Run tests
uv run pytest
```

Python version is pinned in `.python-version` (3.12+). Dependencies managed via `pyproject.toml` / `uv.lock`.

### Environment

Copy `api.env` (repo root) to `api/.env` and fill in:
- `SUPABASE_URL`, `SUPABASE_KEY`, `SUPABASE_SERVICE_ROLE_KEY` — required
- `DATABASE_URL`, `SYNC_DATABASE_URL` — async + sync Postgres URLs
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`, `GOOGLE_MAIL_REDIRECT_URI` — OAuth
- `REDIS_URL`, `CELERY_BROKER_URL`, `CELERY_RESULT_BACKEND` — Redis / Celery
- `OAUTH_TOKEN_ENCRYPTION_KEY` — Fernet key for encrypting stored mail tokens
- `ALLOWED_ORIGINS` — comma-separated CORS origins
- Optional: `MICROSOFT_CLIENT_ID`, `MICROSOFT_CLIENT_SECRET`, `MICROSOFT_REDIRECT_URI` — for Outlook

Settings are loaded via `pydantic-settings` in `core/settings.py` and cached with `@lru_cache`.

### Architecture

```
api/
├── app/
│   ├── main.py                         # calls create_app()
│   ├── core/
│   │   ├── app_factory.py              # FastAPI factory, registers all routers
│   │   ├── settings.py                 # pydantic-settings (env / .env)
│   │   ├── dependencies.py             # get_current_user (cookie + Bearer), get_db_session
│   │   ├── exceptions.py               # custom exceptions + global handlers
│   │   ├── middleware.py               # CORS
│   │   └── redis.py                    # async Redis client factory
│   ├── routes/v1/
│   │   ├── health.py                   # GET /health, GET /readiness
│   │   └── endpoints/
│   │       ├── auth.py                 # OAuth signin/callback/me/refresh/signout/store-google-token
│   │       ├── boarding_pass.py        # POST /boarding-pass/upload
│   │       ├── flights.py              # GET|DELETE /bookings/...
│   │       ├── gmail.py                # POST|GET /gmail/sync[/status]
│   │       ├── user.py                 # GET /user/profile
│   │       └── mail_connections.py     # GET|POST|DELETE /mail/...
│   ├── services/
│   │   ├── parser_service.py           # BoardingPassService (parse pipeline)
│   │   ├── auth_service.py
│   │   ├── flight_service.py           # Booking/Flight/Passenger/BoardingPass CRUD
│   │   ├── gmail_service.py            # Gmail API: search, download PDF attachments
│   │   ├── mail_token_service.py       # encrypted token store/load/revoke
│   │   └── oauth_token_service.py      # token refresh helpers
│   ├── tasks/
│   │   ├── celery_app.py               # Celery instance (broker=Redis)
│   │   └── gmail_sync.py               # sync_gmail_boarding_passes task
│   ├── mail/
│   │   ├── base.py                     # MailProvider ABC
│   │   ├── gmail.py                    # OAuth2, full sync support
│   │   ├── outlook.py                  # OAuth2, token-only (sync not implemented)
│   │   ├── protonmail.py               # IMAP password via Bridge (sync not implemented)
│   │   └── registry.py                 # provider registry
│   ├── parsers/
│   │   ├── base.py                     # Abstract BoardingPassParser (can_handle / _parse_content)
│   │   ├── factory.py                  # ParserFactory — maps airline codes to parser classes
│   │   ├── bcbp_decoder.py             # PDF → barcode image → BCBP string → dict
│   │   ├── dataclass.py                # ParsedBoardingPass dataclass
│   │   ├── utils.py                    # pdfplumber text extraction, barcode decode helpers
│   │   ├── constants.py / enum.py      # Airline codes (AirlineCodeEnum)
│   │   └── airlines/
│   │       ├── indigo.py               # IndigoParser (code "6E")
│   │       ├── akasa.py                # AkasaParser (code "QP")
│   │       └── generic.py              # IATAGenericParser (fallback)
│   ├── models/                         # SQLAlchemy ORM: Airline, Airport, Booking, Flight,
│   │                                   #   Passenger, BoardingPass, GmailSyncJob, UserMailConnection
│   ├── schemas/                        # Pydantic request/response models
│   └── db/
│       ├── supabase.py                 # Supabase sync client
│       └── session.py                  # async + sync SQLAlchemy session factories
├── alembic/                            # migrations: 0001 initial, 0002 mail_connections,
│                                       #   0003 drop legacy oauth_tokens
└── pyproject.toml
```

**Parsing pipeline** (`BoardingPassService.process`):
1. `extract_bcbp_barcode(pdf_bytes)` — renders each page at 200 DPI (then 300 DPI fallback), scans for BCBP barcode using `zxing-cpp`
2. `parse_bcbp_barcode(bcbp_data)` — slices fixed-width IATA BCBP fields (name, PNR, airports, operator code, flight number, seat, etc.)
3. `extract_text_pdfplumber(pdf_bytes)` — pulls raw text from PDF
4. `ParserFactory.get_parser(operator_code, raw_data)` — returns airline-specific or generic parser
5. `parser.parse(raw_data, bcbp_details)` — populates `ParsedBoardingPass` with regex patterns

**Adding a new airline parser**: subclass `BoardingPassParser`, implement `_can_handle` and `_parse_content`, add to `AirlineCodeEnum`, register in `ParserFactory`.

### API endpoints

All routes are prefixed `/api/v1` (`root_path="/api"` is set in `create_app()`). Swagger UI is available at `/docs` (non-production only).

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/v1/health` | — | Liveness check |
| GET | `/api/v1/readiness` | — | Readiness check (verifies DB) |
| POST | `/api/v1/auth/google/signin` | — | Get Google OAuth redirect URL |
| POST | `/api/v1/auth/callback` | — | Exchange OAuth code → set HttpOnly session cookies |
| GET | `/api/v1/auth/me` | cookie/Bearer | Get current user |
| POST | `/api/v1/auth/refresh` | cookie | Refresh access token |
| POST | `/api/v1/auth/signout` | cookie | Clear session cookies |
| POST | `/api/v1/auth/store-google-token` | cookie | Persist Google OAuth tokens + trigger first sync |
| POST | `/api/v1/boarding-pass/upload` | cookie | Upload boarding pass PDF → parse → persist as booking |
| GET | `/api/v1/bookings/` | cookie | List user bookings (filter: `status=upcoming\|completed`) |
| GET | `/api/v1/bookings/{id}` | cookie | Get booking by ID |
| DELETE | `/api/v1/bookings/{id}` | cookie | Delete booking |
| POST | `/api/v1/gmail/sync` | cookie | Enqueue Gmail sync Celery task |
| GET | `/api/v1/gmail/sync/status` | cookie | Get latest sync job progress |
| GET | `/api/v1/user/profile` | cookie | User profile |
| GET | `/api/v1/mail/connections` | cookie | List connected mail providers |
| POST | `/api/v1/mail/{provider}/connect` | cookie | Start OAuth / password connect |
| POST | `/api/v1/mail/{provider}/callback` | cookie | Complete OAuth callback for provider |
| DELETE | `/api/v1/mail/connections/{id}` | cookie | Disconnect mail account |

**Auth flow**: Google OAuth redirect via `/auth/google/signin`. On callback, backend exchanges the code, creates a Supabase session, and sets HttpOnly `access_token` (1 h) and `refresh_token` (7 d) cookies. `get_current_user` dependency validates JWT from cookie or `Authorization: Bearer` header.

---

## Frontend

### Commands (run from `web/`)

```bash
npm install
npm run dev       # Next.js dev server on port 3000
npm run build     # Production build
npm run lint      # ESLint
npx tsc --noEmit  # TypeScript type-check
```

### Environment

Create `web/.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api/v1
```

### Architecture

```
web/
├── app/
│   ├── layout.tsx                      # Root layout (Syne + DM Mono fonts)
│   ├── page.tsx                        # Redirect: /dashboard if auth, /login if not
│   ├── globals.css                     # Tailwind v4 theme tokens (CSS custom properties)
│   ├── (auth)/
│   │   ├── login/page.tsx              # Google sign-in entry
│   │   └── callback/page.tsx           # POST /auth/callback → /dashboard
│   ├── dashboard/
│   │   ├── layout.tsx                  # Mounts GmailSyncContext.Provider + Sidebar
│   │   ├── page.tsx                    # Flights list (upcoming / completed)
│   │   └── flights/[id]/page.tsx       # Booking detail + boarding pass ticket
│   ├── mail-callback/page.tsx          # Mail provider OAuth callback → /dashboard
│   └── api/health/route.ts             # Next.js route — proxies to backend health
├── components/                         # shadcn/ui primitives + app components
│   ├── booking-card.tsx                # BookingCard (grouped by PNR)
│   ├── boarding-pass-ticket.tsx        # Full boarding pass with QR code
│   ├── sync-screen.tsx                 # Animated Gmail sync progress overlay
│   └── sidebar.tsx                     # Navigation sidebar (desktop + mobile drawer)
└── lib/
    ├── api/
    │   ├── http-client.ts              # fetch wrapper (credentials:include, retry, 10s timeout)
    │   ├── auth-service.ts             # signInWithGoogle, callback, getMe, signOut
    │   ├── flight-service.ts           # listBookings, getBooking
    │   ├── gmail-service.ts            # startGmailSync, getGmailSyncStatus
    │   ├── mail-connection-service.ts  # listConnections, connectProvider, exchangeMailCode, revoke
    │   └── boarding-pass-service.ts    # upload (multipart/form-data)
    ├── context/
    │   └── gmail-sync-context.tsx      # GmailSyncContext (DashboardLayout only)
    ├── hooks/
    │   ├── useAuth.ts                  # calls getMe() on mount; no localStorage
    │   ├── useFlights.ts               # lists + maps BookingResponse → Flight[]
    │   ├── useGmailSync.ts             # drives GmailSyncContext; polls every 20s
    │   └── useMailConnection.ts        # connect / revoke mail providers
    ├── supabase/
    │   ├── client.ts                   # createBrowserClient (@supabase/ssr)
    │   └── server.ts                   # createServerClient (@supabase/ssr)
    ├── data/mock-flights.ts            # groupFlightsByPnr() — used in dashboard + detail page
    ├── config/index.ts                 # ConfigManager: NEXT_PUBLIC_* env reader + validation
    ├── types/index.ts                  # Shared TS types (Flight, BookingGroup, GmailSyncState, etc.)
    └── utils.ts                        # cn() (clsx + tailwind-merge)
```

**Auth**: `useAuth` calls `getMe()` on mount — cookies are HttpOnly and managed by the browser. The frontend never reads or stores tokens. `GmailSyncContext` is provided by `web/app/dashboard/layout.tsx`; calling `useGmailSyncContext()` outside that segment throws. Supabase SSR: import clients from `@/lib/supabase/client` (browser) or `@/lib/supabase/server` (server components).

**Styling**: Tailwind CSS v4 with shadcn/ui. CSS custom properties defined in `globals.css` — no `tailwind.config.js`. Component variants use `class-variance-authority`.

**Path alias**: `@/` maps to `web/` (configured in `tsconfig.json`).

---

## Key Constraints

- BCBP barcode parsing currently supports only **single-leg** boarding passes (multi-leg is a known TODO in `bcbp_decoder.py`).
- Supported airlines with dedicated parsers: IndiGo (`6E`), Akasa Air (`QP`). All other airlines fall through to `IATAGenericParser`.
- File upload limit is 5 MB, PDF only.
- `ParsedBoardingPass` uses `dataclass` (not Pydantic), so field aliasing/serialization must be done manually at the route layer.
- Mail provider sync: Gmail is fully implemented. Outlook and ProtonMail store credentials but do not yet sync.

<!-- code-review-graph MCP tools -->
## MCP Tools: code-review-graph

**IMPORTANT: This project has a knowledge graph. ALWAYS use the
code-review-graph MCP tools BEFORE using Grep/Glob/Read to explore
the codebase.** The graph is faster, cheaper (fewer tokens), and gives
you structural context (callers, dependents, test coverage) that file
scanning cannot.

### When to use graph tools FIRST

- **Exploring code**: `semantic_search_nodes` or `query_graph` instead of Grep
- **Understanding impact**: `get_impact_radius` instead of manually tracing imports
- **Code review**: `detect_changes` + `get_review_context` instead of reading entire files
- **Finding relationships**: `query_graph` with callers_of/callees_of/imports_of/tests_for
- **Architecture questions**: `get_architecture_overview` + `list_communities`

Fall back to Grep/Glob/Read **only** when the graph doesn't cover what you need.

### Key Tools

| Tool | Use when |
|------|----------|
| `detect_changes` | Reviewing code changes — gives risk-scored analysis |
| `get_review_context` | Need source snippets for review — token-efficient |
| `get_impact_radius` | Understanding blast radius of a change |
| `get_affected_flows` | Finding which execution paths are impacted |
| `query_graph` | Tracing callers, callees, imports, tests, dependencies |
| `semantic_search_nodes` | Finding functions/classes by name or keyword |
| `get_architecture_overview` | Understanding high-level codebase structure |
| `refactor_tool` | Planning renames, finding dead code |

### Workflow

1. The graph auto-updates on file changes (via hooks).
2. Use `detect_changes` for code review.
3. Use `get_affected_flows` to understand impact.
4. Use `query_graph` pattern="tests_for" to check coverage.
