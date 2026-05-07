# FlightTrackr API

FastAPI backend for FlightTrackr — parses airline boarding pass PDFs, decodes BCBP barcodes, and syncs flights from Gmail.

## Stack

- **Python 3.12+** with [uv](https://github.com/astral-sh/uv) for dependency management
- **FastAPI** + **Uvicorn**
- **SQLAlchemy 2.0** (async) + **Alembic** for migrations
- **Supabase** (Postgres + Auth)
- **Celery** + **Redis** for background Gmail sync
- **pdfplumber** + **zxing-cpp** for PDF parsing and BCBP barcode decoding

## Getting Started

```bash
# Install dependencies
uv sync

# Copy and fill in environment variables
cp .env.example .env

# Run database migrations
uv run alembic upgrade head

# Start the dev server
uv run uvicorn app.main:app --reload --port 8000
```

Interactive API docs available at `http://localhost:8000/docs` (non-production only).

To run the Celery worker (required for Gmail sync):

```bash
uv run celery -A app.tasks.celery_app worker --loglevel=info
```

## Environment Variables

| Variable | Description |
|---|---|
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_KEY` | Supabase service role key |
| `DATABASE_URL` | Sync PostgreSQL URL (for Celery workers) |
| `ASYNC_DATABASE_URL` | Async PostgreSQL URL (for FastAPI routes) |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |
| `GOOGLE_REDIRECT_URI` | OAuth callback URI |
| `JWT_SECRET_KEY` | Secret for JWT signing |
| `ALLOWED_ORIGINS` | Comma-separated CORS origins |
| `REDIS_URL` | Redis URL for Celery broker |
| `TOKEN_ENCRYPTION_KEY` | Fernet key for encrypting stored OAuth tokens |

See `.env.example` for the full list.

## API Endpoints

All routes are prefixed `/api/v1`.

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/health` | — | Application health check |
| `GET` | `/readiness` | — | Service readiness check |
| `POST` | `/boarding-pass/parse` | — | Upload a PDF and parse the boarding pass |
| `GET` | `/boarding-pass/supported-airlines` | — | List airlines with dedicated parsers |
| `POST` | `/auth/google/signin` | — | Initiate Google OAuth sign-in |
| `GET` | `/auth/me` | Bearer | Get current authenticated user |
| `POST` | `/auth/refresh` | — | Refresh access token |
| `POST` | `/auth/signout` | Bearer | Sign out |
| `POST` | `/auth/connect-google` | Bearer | Store Google refresh token for Gmail access |
| `GET` | `/flights/` | Bearer | List flights (optional `?status=` filter) |
| `GET` | `/flights/{flight_id}` | Bearer | Get a single flight |
| `DELETE` | `/flights/{flight_id}` | Bearer | Delete a flight |
| `POST` | `/gmail/sync` | Bearer | Trigger background Gmail sync |
| `GET` | `/gmail/sync/status` | Bearer | Poll latest sync job status |
| `GET` | `/user/profile` | Bearer | Get current user profile |

## Architecture

```
api/
├── app/
│   ├── main.py                 # Entry point — calls create_app()
│   ├── core/
│   │   ├── app_factory.py      # FastAPI factory, registers routers and middleware
│   │   ├── settings.py         # Pydantic Settings (reads .env)
│   │   ├── config.py           # ApplicationConfig wrapper for dependency injection
│   │   ├── dependencies.py     # FastAPI Depends providers (auth, DB session)
│   │   ├── exceptions.py       # Custom exception hierarchy + global handlers
│   │   ├── middleware.py       # CORS, TrustedHost middleware
│   │   └── environment.py      # Environment-specific config (dev/prod/test)
│   ├── db/
│   │   ├── session.py          # Async engine (FastAPI) + sync engine (Celery)
│   │   ├── base.py             # SQLAlchemy declarative base
│   │   └── supabase.py         # Supabase client factory
│   ├── models/
│   │   ├── flight.py           # Flight ORM model
│   │   ├── user_oauth_token.py # Encrypted Google OAuth token storage
│   │   └── gmail_sync_job.py   # Background sync job tracking
│   ├── parsers/
│   │   ├── base.py             # Abstract BoardingPassParser
│   │   ├── factory.py          # ParserFactory — selects parser by airline code
│   │   ├── bcbp_decoder.py     # PDF → barcode image → BCBP string → dict
│   │   ├── dataclass.py        # ParsedBoardingPass dataclass
│   │   ├── utils.py            # pdfplumber text extraction, barcode decode helpers
│   │   ├── enum.py             # AirlineCodeEnum, AirlinesEnum
│   │   └── airlines/
│   │       ├── indigo.py       # IndigoParser (IATA code "6E")
│   │       ├── akasa.py        # AkasaParser (IATA code "QP")
│   │       └── generic.py      # IATAGenericParser (fallback for all others)
│   ├── routes/v1/
│   │   ├── health.py
│   │   ├── boarding_pass.py
│   │   └── endpoints/
│   │       ├── auth.py
│   │       ├── flights.py
│   │       ├── gmail.py
│   │       └── user.py
│   ├── schemas/
│   │   ├── flight_schema.py
│   │   ├── gmail_schema.py
│   │   └── auth_schema.py
│   ├── services/
│   │   ├── parser_service.py       # BoardingPassService — orchestrates parsing pipeline
│   │   ├── flight_service.py       # Flight CRUD + Gmail deduplication
│   │   ├── auth_service.py         # Google OAuth exchange + token refresh
│   │   ├── oauth_token_service.py  # Fernet encryption for stored tokens
│   │   ├── gmail_service.py        # Gmail API client (search + attachment download)
│   │   └── google_oauth.py         # OAuth URL generation
│   └── tasks/
│       ├── celery_app.py           # Celery app with Redis broker
│       └── gmail_sync.py           # sync_gmail_boarding_passes Celery task
├── alembic/                        # Database migrations
├── alembic.ini
├── pyproject.toml
└── .env.example
```

## Boarding Pass Parsing Pipeline

`BoardingPassService.process(pdf_bytes)`:

1. **Barcode extraction** — renders each PDF page at 200 DPI (300 DPI fallback) and scans for a BCBP barcode using `zxing-cpp`
2. **BCBP decoding** — slices the fixed-width IATA BCBP string into structured fields (passenger name, PNR, airports, operator code, flight number, seat, etc.)
3. **Text extraction** — extracts raw text from the PDF via `pdfplumber`
4. **Parser selection** — `ParserFactory.get_parser(operator_code)` returns an airline-specific parser or falls back to `IATAGenericParser`
5. **Content parsing** — the selected parser applies regex patterns to produce a `ParsedBoardingPass`

### Adding a new airline parser

1. Subclass `BoardingPassParser` in `app/parsers/airlines/`
2. Implement `_can_handle(operator_code)` and `_parse_content(raw_text, bcbp_details)`
3. Add the IATA code to `AirlineCodeEnum` in `app/parsers/enum.py`
4. Register the parser in `ParserFactory` (`app/parsers/factory.py`)

Currently supported airlines with dedicated parsers: **IndiGo (6E)**, **Akasa Air (QP)**. All other airlines are handled by `IATAGenericParser`.

## Gmail Sync

The `POST /gmail/sync` endpoint enqueues a Celery task (`sync_gmail_boarding_passes`) that:

1. Searches Gmail for boarding pass PDF attachments
2. Skips messages already saved (deduplicates by `gmail_message_id`)
3. Parses each new PDF through the boarding pass pipeline
4. Upserts results to the `flights` table

Job progress is tracked in `gmail_sync_jobs` and pollable via `GET /gmail/sync/status`.

## Database Migrations

```bash
# Apply all migrations
uv run alembic upgrade head

# Create a new migration
uv run alembic revision --autogenerate -m "description"

# Rollback one step
uv run alembic downgrade -1
```

Migrations live in `alembic/versions/`. The schema targets Supabase Postgres; foreign keys reference `auth.users`.

## Known Limitations

- BCBP parsing supports **single-leg** boarding passes only (multi-leg is a TODO in `bcbp_decoder.py`)
- File upload limit: **5 MB**, PDF only
- `ParsedBoardingPass` is a plain `dataclass`, not a Pydantic model — serialization is handled manually at the route layer
