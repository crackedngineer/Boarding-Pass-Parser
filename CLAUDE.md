# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**FlightTrackr** is a full-stack boarding pass parsing application. It reads airline boarding pass PDFs, decodes the BCBP (Bar Coded Boarding Pass) barcode embedded in the document, and extracts structured flight data. The project name in the repository is "Boarding-Pass-Parser".

- **Backend**: Python/FastAPI at `app/backend/`
- **Frontend**: Next.js 16 / React 19 / TypeScript at `app/frontend/`
- **Database**: Supabase (Postgres via `supabase-js` and Python `supabase`)
- **Auth**: Google OAuth (backend Google API client + frontend token storage in `localStorage`)

---

## Backend

### Commands (run from `app/backend/`)

```bash
# Install dependencies (uses uv)
uv sync

# Run dev server
uv run uvicorn main:app --reload --port 8000

# Run directly (respects settings.debug for reload)
uv run python main.py
```

Python version is pinned in `.python-version` (3.12+). Dependencies managed via `pyproject.toml` / `uv.lock`.

### Environment

Copy `app/backend/.env.example` to `app/backend/.env` and fill in:
- `SUPABASE_URL`, `SUPABASE_KEY` — required
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI` — for OAuth
- `JWT_SECRET_KEY`, `ALLOWED_ORIGINS`, etc.

Settings are loaded via `pydantic-settings` in `core/settings.py` and cached with `@lru_cache`.

### Architecture

```
app/backend/
├── main.py                     # Entry point — calls get_application()
├── core/
│   ├── app_factory.py          # FastAPI factory, registers routers and middleware
│   ├── settings.py             # Pydantic Settings (env vars, .env file)
│   ├── config.py               # ApplicationConfig (wraps Settings for injection)
│   ├── dependencies.py         # FastAPI dependency providers (BoardingPassService, etc.)
│   ├── exceptions.py           # Custom exceptions + global exception handlers
│   └── middleware.py           # CORS and other middleware setup
├── routes/v1/
│   ├── boarding_pass.py        # POST /boarding-pass/parse, GET /boarding-pass/supported-airlines
│   ├── health.py               # GET /health
│   └── endpoints/
│       ├── auth.py             # Google OAuth routes
│       └── gmail.py            # Gmail integration routes
├── services/
│   ├── parser_service.py       # BoardingPassService — orchestrates parsing pipeline
│   ├── auth_service.py         # Auth business logic
│   └── google_oauth.py         # Google OAuth token exchange
├── parsers/
│   ├── base.py                 # Abstract BoardingPassParser (can_handle / _parse_content)
│   ├── factory.py              # ParserFactory — maps airline codes to parser classes
│   ├── bcbp_decoder.py         # PDF → barcode image → BCBP string → dict
│   ├── dataclass.py            # ParsedBoardingPass dataclass
│   ├── utils.py                # pdfplumber text extraction, barcode decode helpers
│   ├── constants.py / enum.py  # Airline codes (AirlineCodeEnum)
│   └── airlines/
│       ├── indigo.py           # IndigoParser (code "6E")
│       ├── akasa.py            # AkasaParser (code "QP")
│       └── generic.py          # IATAGenericParser (fallback)
├── schemas/                    # Pydantic request/response schemas
└── db/supabase.py              # Supabase client factory
```

**Parsing pipeline** (`BoardingPassService.process`):
1. `extract_bcbp_barcode(pdf_bytes)` — renders each page at 200 DPI (then 300 DPI fallback), scans for BCBP barcode using `zxing-cpp`
2. `parse_bcbp_barcode(bcbp_data)` — slices fixed-width IATA BCBP fields (name, PNR, airports, operator code, flight number, seat, etc.)
3. `extract_text_pdfplumber(pdf_bytes)` — pulls raw text from PDF
4. `ParserFactory.get_parser(operator_code, raw_data)` — returns airline-specific or generic parser
5. `parser.parse(raw_data, bcbp_details)` — populates `ParsedBoardingPass` with regex patterns

**Adding a new airline parser**: subclass `BoardingPassParser`, implement `_can_handle` and `_parse_content`, add to `AirlineCodeEnum`, register in `ParserFactory`.

### API endpoints

All routes are prefixed `/api/v1`. Swagger UI is available at `/docs` (non-production only).

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/health` | Health check |
| POST | `/api/v1/boarding-pass/parse` | Upload PDF, returns parsed boarding pass JSON |
| GET | `/api/v1/boarding-pass/supported-airlines` | List supported airlines |
| POST | `/api/v1/auth/...` | Google OAuth exchange |

---

## Frontend

### Commands (run from `app/frontend/`)

```bash
npm install
npm run dev       # Next.js dev server on port 3000
npm run build     # Production build
npm run start     # Serve production build
npm run lint      # ESLint
```

### Environment

Create `app/frontend/.env.local`:
```
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api/v1
NEXT_PUBLIC_APP_NAME=FlightTrackr
NEXT_PUBLIC_ENVIRONMENT=development
NEXT_PUBLIC_GOOGLE_CLIENT_ID=...
```

### Architecture

```
app/frontend/
├── app/
│   ├── layout.tsx              # Root layout (Geist font, providers)
│   ├── page.tsx                # Root page (redirect to /login or /dashboard)
│   ├── globals.css             # Tailwind v4 theme tokens (shadcn/ui convention)
│   ├── (auth)/
│   │   ├── layout.tsx          # Auth layout (centered card)
│   │   ├── login/page.tsx      # Login page with AuthForm
│   │   └── callback/page.tsx   # OAuth callback handler
│   ├── dashboard/page.tsx      # Main app view (post-login)
│   └── api/health/route.ts     # Next.js route handler — proxies to backend health
├── components/
│   ├── auth-form.tsx           # Google Sign-In button component
│   ├── common/
│   │   ├── ErrorBoundary.tsx
│   │   └── Loading.tsx
│   └── ui/                     # shadcn/ui primitives (button, card, input, etc.)
└── lib/
    ├── api/
    │   ├── http-client.ts      # HttpClient class — fetch wrapper with auth, retry, timeout
    │   ├── auth-service.ts     # authService — token storage + OAuth API calls
    │   ├── boarding-pass-service.ts  # boardingPassService — upload/parse API calls
    │   ├── health-service.ts
    │   └── index.ts            # Re-exports all services
    ├── hooks/
    │   ├── useAuth.ts          # Auth state + signIn/signOut/refreshTokens
    │   ├── useBoardingPass.ts  # Upload state + parse result
    │   └── index.ts
    ├── config/index.ts         # ConfigManager singleton (reads NEXT_PUBLIC_* env vars)
    ├── types/index.ts          # Shared TypeScript types
    └── utils.ts                # cn() (clsx + tailwind-merge)
```

**Auth flow**: Google OAuth redirect → backend exchanges code → JWTs stored in `localStorage` as `access_token` / `refresh_token` → `HttpClient` attaches `Authorization: Bearer <token>` on every request.

**Styling**: Tailwind CSS v4 with shadcn/ui. CSS custom properties defined in `globals.css` map directly to Tailwind color tokens (`--color-primary`, etc.). Component variants use `class-variance-authority`.

**Path alias**: `@/` maps to `app/frontend/` (configured in `tsconfig.json`).

---

## Key Constraints

- BCBP barcode parsing currently supports only **single-leg** boarding passes (multi-leg is a known TODO in `bcbp_decoder.py`).
- Supported airlines with dedicated parsers: IndiGo (`6E`), Akasa Air (`QP`). All other airlines fall through to `IATAGenericParser`.
- File upload limit is 5 MB, PDF only.
- `ParsedBoardingPass` uses `dataclass` (not Pydantic), so field aliasing/serialization must be done manually at the route layer.

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
