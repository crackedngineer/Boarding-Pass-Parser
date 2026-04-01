# 🔐 Open Security Kit (FastAPI + Next.js + Supabase)

This document defines the **secure architecture, folder structure, and best practices** for building a full-stack app using:

* FastAPI (backend)
* Next.js (App Router)
* Supabase (DB + storage)
* OAuth providers (Google)
* Optional: Better Auth / Clerk

---

# 🏗️ Monorepo Structure

```
root/
│
├── apps/
│   ├── web/                # Next.js app (App Router)
│   └── api/                # FastAPI backend
│
├── packages/
│   ├── ui/                 # Shared UI (shadcn components)
│   ├── config/             # Shared configs (eslint, tsconfig)
│   └── types/              # Shared types/interfaces
│
├── infra/                  # Deployment configs (Docker, Terraform)
├── scripts/                # Dev scripts
├── .env.example
└── README.md
```

---

# 🌐 Frontend (Next.js App Router)

## 📁 Structure

```
apps/web/
│
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   ├── callback/
│   │   └── layout.tsx
│   │
│   ├── dashboard/
│   ├── api/                # Route handlers (BFF layer)
│   ├── layout.tsx
│   └── page.tsx
│
├── components/
│   ├── ui/                # shadcn components
│   └── shared/
│
├── lib/
│   ├── auth.ts            # Auth client (Better Auth / Clerk)
│   ├── api.ts             # API client (calls FastAPI)
│   └── utils.ts
│
├── hooks/
├── styles/
└── proxy.ts
```

---

## 🎨 UI Stack

* Tailwind CSS
* shadcn/ui
* Lucide icons

---

## 🔐 Auth Flow (Frontend)

### Using Better Auth / Clerk

1. User clicks login
2. Redirect to provider (Google)
3. Callback handled in:

   ```
   app/(auth)/callback/page.tsx
   ```
4. Store session securely (HTTP-only cookies)
5. Send ID token to backend

---

## ⚠️ Security Rules

* Never store tokens in localStorage
* Use HTTP-only cookies
* CSRF protection via middleware
* Validate all backend responses

---

# ⚙️ Backend (FastAPI)

## 📁 Structure

```
apps/api/
│
├── app/
│   ├── main.py
│   │
│   ├── api/
│   │   ├── v1/
│   │   │   ├── auth.py
│   │   │   ├── users.py
│   │   │   ├── gmail.py
│   │   │   └── webhooks.py
│   │
│   ├── core/
│   │   ├── config.py
│   │   ├── security.py
│   │   └── logging.py
│   │
│   ├── services/
│   │   ├── auth_service.py
│   │   ├── token_service.py
│   │   ├── gmail_service.py
│   │   └── pubsub_service.py
│   │
│   ├── db/
│   │   ├── supabase.py
│   │   └── models.py
│   │
│   └── utils/
│       ├── encryption.py
│       └── helpers.py
│
├── tests/
└── requirements.txt
```

---

# 🔑 Authentication Flow

## Option A: Better Auth / Clerk (Recommended)

### Flow

1. Frontend authenticates user
2. Gets ID token / session
3. Sends token to FastAPI:

   ```
   Authorization: Bearer <token>
   ```
4. Backend verifies token
5. Creates/updates user in DB

---

## Token Verification (FastAPI)

```python
def verify_token(token: str):
    # Verify JWT with provider public keys
    # Extract user_id, email
    return payload
```

---

# 🗄️ Supabase Schema

## users

```
id (uuid, pk)
email
created_at
```

## oauth_tokens

```
id (uuid)
user_id (fk)
provider (google)
access_token (encrypted)
refresh_token (encrypted)
expiry
created_at
updated_at
```

---

# 🔐 Token Storage Rules

* Encrypt before storing
* Use AES or Fernet
* Never log tokens

---

## Encryption Utility

```python
from cryptography.fernet import Fernet
import os

cipher = Fernet(os.getenv("ENCRYPTION_KEY"))

def encrypt(data: str):
    return cipher.encrypt(data.encode()).decode()

def decrypt(data: str):
    return cipher.decrypt(data.encode()).decode()
```

---

# 📬 Gmail Integration

## OAuth Scope

```
https://www.googleapis.com/auth/gmail.readonly
```

---

## Save Tokens

```python
async def save_tokens(user_id, access_token, refresh_token):
    encrypted_access = encrypt(access_token)
    encrypted_refresh = encrypt(refresh_token)

    # store in supabase
```

---

# 🔔 Pub/Sub (New Emails)

## Flow

1. Backend registers Gmail watch
2. Gmail pushes to Pub/Sub
3. Pub/Sub → webhook (FastAPI)

---

## Webhook Endpoint

```
POST /api/v1/webhooks/gmail
```

---

## Handler

```python
async def gmail_webhook(payload):
    user_id = extract_user(payload)
    history_id = extract_history(payload)

    # fetch new emails
    # parse boarding pass
```

---

# ⚠️ Edge Cases Handling

## Missing refresh_token

* Happens after first login
* Solution:

  ```
  access_type=offline
  prompt=consent
  ```

---

## Token Expiry

```python
if token_expired:
    refresh_access_token()
```

---

## Token Revocation

* Detect 401 from Google
* Mark token invalid
* Ask user to reconnect

---

# 📜 Logging Strategy

## Use structured logging

```python
logger.info("oauth_failed", extra={
    "user_id": user_id,
    "error": str(e)
})
```

---

## Log Levels

| Level    | Usage            |
| -------- | ---------------- |
| INFO     | normal flow      |
| WARN     | retryable issues |
| ERROR    | failures         |
| CRITICAL | system failure   |

---

# 🔒 Environment Variables

```
# Backend
SUPABASE_URL=
SUPABASE_KEY=
ENCRYPTION_KEY=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Frontend
NEXT_PUBLIC_API_URL=
NEXT_PUBLIC_SUPABASE_URL=
```

---

# 🚫 Security DO NOTs

* ❌ Do not store raw tokens
* ❌ Do not expose secrets to frontend
* ❌ Do not trust client input
* ❌ Do not skip token verification

---

# ✅ Security Best Practices

* Use HTTPS everywhere
* Rotate encryption keys periodically
* Implement rate limiting
* Validate all external inputs
* Use background workers for parsing

---

# 🧪 Testing Strategy

* Unit tests (services)
* Integration tests (OAuth flow)
* Mock Gmail API
* Test token expiry + refresh

---

# 🚀 Developer Experience

## Principles

* Backend and frontend are **independent**
* Shared types via `/packages/types`
* Clear API contracts
* Minimal coupling

---

## Running Locally

```
# Backend
cd apps/api
uvicorn app.main:app --reload

# Frontend
cd apps/web
npm run dev
```

---

# 📈 Future Enhancements

* Multi-provider email support
* ML-based email parsing
* Flight status APIs
* Background job queue (Celery / Redis)

---

# ✅ Summary

This setup ensures:

* Secure OAuth handling
* Scalable architecture
* Clean developer experience
* Production-ready foundation
