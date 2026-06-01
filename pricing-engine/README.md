# ShopMansa Pricing Engine

Standalone Python service that logs into the WeSellCellular dealer portal,
scrapes the inventory feed, normalizes it, and upserts the rows into the
shared Supabase Postgres database used by the ShopMansa Next.js app.

The Next.js app (in the parent directory) consumes these wholesale listings
via Prisma + admin pages — this service does not touch products, orders,
inventory, or customers.

---

## Architecture

```
┌──────────────────┐   POST /sync     ┌────────────────────────┐
│ Next.js          │ ───────────────▶ │ FastAPI pricing engine │
│ /api/pricing/... │ Bearer token     │  (this service)        │
└──────────────────┘                  └──────────┬─────────────┘
                                                 │ login + CSV
                                                 ▼
                                       ┌─────────────────────┐
                                       │ WeSellCellular B2B  │
                                       │ dealer portal       │
                                       └─────────────────────┘
                                                 │
                          asyncpg over TLS (5432)│ INSERT ... ON CONFLICT
                                                 ▼
                                       ┌─────────────────────┐
                                       │ Supabase Postgres   │
                                       │ wholesale_sources   │
                                       │ wholesale_listings  │
                                       └─────────────────────┘
```

---

## Supabase write strategy — chosen: **direct Postgres connection**

Two options were on the table:

1. **Direct Postgres connection** via a dedicated least-privileged DB role
   using asyncpg.
2. **Supabase REST client** using the service-role key.

**Chosen: #1.** Reasons:

- **Bulk upsert performance.** A full scrape can be thousands of listings.
  `INSERT … ON CONFLICT DO UPDATE` with parameter-batched arrays runs in a
  single statement; REST requires one request per row (or one POST per ~500
  via PostgREST `Prefer: resolution=merge-duplicates`, which still goes
  through HTTP and JSON-decoding overhead).
- **Transactional integrity.** The orchestration in `app/services/sync.py`
  wraps `_upsert_listings` and `_mark_ok` in the same session so the
  `last_synced_at` bump only commits if the upsert succeeded.
- **No parallel data model.** Prisma owns the schema (see
  `../prisma/migrations/20260530000001_pricing_engine/`); SQLAlchemy ORM
  models in `app/models.py` mirror it so this service writes the exact same
  columns Next.js reads.
- **Least privilege without RLS.** The service role key in Supabase REST
  bypasses RLS entirely — too much authority for a single-purpose writer.
  A dedicated PG role with `INSERT, UPDATE, SELECT` on only the two
  wholesale tables is tighter.
- **No Supabase Auth / RPC dependency.** Per the active architecture rules,
  this codebase does not use Supabase Auth or RPC; sticking to plain PG keeps
  this service consistent.

### One-time SQL to create the least-privileged DB role

Run this once as the Supabase superuser (Dashboard → SQL Editor):

```sql
-- 1. Create the role.
CREATE ROLE mansa_pricing_writer LOGIN PASSWORD 'REPLACE_WITH_STRONG_PASSWORD';

-- 2. Allow it to connect to the database and use the public schema.
GRANT CONNECT ON DATABASE postgres TO mansa_pricing_writer;
GRANT USAGE  ON SCHEMA   public    TO mansa_pricing_writer;

-- 3. Grant only the wholesale tables — NOT products, orders, customers, etc.
GRANT SELECT, INSERT, UPDATE
  ON TABLE public.wholesale_sources, public.wholesale_listings
  TO mansa_pricing_writer;

-- 4. Allow using existing + future sequences (defensive for cuid keys).
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO mansa_pricing_writer;

-- 5. Make sure future tables in public are NOT auto-granted to this role.
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES   FROM mansa_pricing_writer;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON SEQUENCES FROM mansa_pricing_writer;
```

Rotate the password by:
```sql
ALTER ROLE mansa_pricing_writer WITH PASSWORD 'NEW_PASSWORD';
```
…then update `DATABASE_URL` in this service's env.

---

## Project layout

```
pricing-engine/
├── app/
│   ├── __init__.py
│   ├── main.py              FastAPI app, /health, /sync
│   ├── config.py            Pydantic settings (env)
│   ├── db.py                Async SQLAlchemy engine + session factory
│   ├── models.py            ORM models mirroring Prisma schema
│   ├── auth.py              Bearer-token guard for /sync
│   ├── scraper/
│   │   ├── __init__.py
│   │   ├── client.py        httpx async client + retry policy
│   │   ├── wesell.py        Login + inventory fetch
│   │   └── normalize.py     CSV row → listing dict
│   └── services/
│       ├── __init__.py
│       └── sync.py          Orchestration (upsert + status bookkeeping)
├── requirements.txt
├── Dockerfile
├── .env.example
├── .gitignore
└── README.md
```

---

## Environment variables

See `.env.example` for the full template. Required at runtime:

| Var | Purpose |
|---|---|
| `PRICING_API_KEY` | Bearer token. Callers (Next.js, cron) present this on `/sync`. |
| `DATABASE_URL` | `postgresql+asyncpg://mansa_pricing_writer:…@db.<ref>.supabase.co:5432/postgres` |
| `WESELL_USERNAME` | Dealer-portal login. |
| `WESELL_PASSWORD` | Dealer-portal password. |
| `WESELL_LOGIN_URL` | Form POST endpoint. |
| `WESELL_INVENTORY_URL` | CSV export endpoint. |
| `WESELL_SOURCE_NAME` | Display name written to `wholesale_sources.name`. Default `WeSellCellular`. |
| `WESELL_BASE_URL` | Optional — written to `wholesale_sources.base_url`. |
| `WESELL_LOGIN_USERNAME_FIELD` | Form field name for username. Default `username`. |
| `WESELL_LOGIN_PASSWORD_FIELD` | Form field name for password. Default `password`. |
| `REQUEST_TIMEOUT_S` | httpx timeout per request. Default `30`. |
| `MAX_RETRIES` | tenacity retry attempts on network errors. Default `3`. |
| `USER_AGENT` | UA string used by the scraper. |
| `ENV` | `development` / `production`. Free-form, only used in startup log. |

**Use the direct (`:5432`) Supabase connection**, not the pooler (`:6543`).
asyncpg manages its own pool, and PgBouncer's transaction mode breaks
prepared statements.

---

## Running locally

```bash
cd pricing-engine

python -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env
# Edit .env: paste DATABASE_URL, PRICING_API_KEY, WESELL_*

uvicorn app.main:app --reload --port 8000
```

Trigger a sync:
```bash
curl -X POST http://localhost:8000/sync \
  -H "Authorization: Bearer $PRICING_API_KEY"
```

Health check:
```bash
curl http://localhost:8000/health
```

---

## Running in production

Build the container:
```bash
docker build -t shopmansa-pricing:latest .
```

Run it:
```bash
docker run -d --name shopmansa-pricing -p 8000:8000 \
  --env-file .env \
  shopmansa-pricing:latest
```

### Recommended hosts
- **Fly.io** — `fly launch` from this directory, set secrets with
  `fly secrets set PRICING_API_KEY=… DATABASE_URL=…`. Schedule `/sync`
  with Fly's machines-schedule feature.
- **Railway** — `railway up`, configure secrets, add a cron job that hits
  `POST /sync` with the bearer token.
- **AWS App Runner / Render / DO App Platform** — set env vars in the
  control panel, configure a healthcheck on `/health`, schedule with an
  external cron (GitHub Actions, Cloudflare Cron Triggers, etc.).

### Scheduling /sync
Until Phase 2 wires this into the Next.js admin UI, schedule with whatever
cron facility your host provides. Example GitHub Actions workflow:

```yaml
# .github/workflows/pricing-sync.yml
on:
  schedule:
    - cron: "0 */6 * * *"   # every 6h
jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - run: |
          curl -fsS -X POST $PRICING_API_URL/sync \
            -H "Authorization: Bearer $PRICING_API_KEY"
        env:
          PRICING_API_URL: ${{ secrets.PRICING_API_URL }}
          PRICING_API_KEY: ${{ secrets.PRICING_API_KEY }}
```

---

## Observability

- Logs are JSON via structlog on stdout — pipe into your host's log shipper.
- Every sync logs `sync.ok` (or `sync.failed`) with counts and duration.
- The `wholesale_sources` row records `last_synced_at`, `status`, and
  `last_error` — query it from the admin UI to surface freshness.

---

## What this service does NOT do

- It does not write to `products`, `pricing_rules`, `price_quotes`, or
  `price_history`. Those are Next.js / admin-UI concerns (Phase 2 / 3).
- It does not apply markup or compute retail prices. The wholesale rows
  it writes are raw inputs; rule application happens in the Next.js
  admin "Apply" page in Phase 3.
- It does not delete listings that disappeared upstream. A future task will
  flag rows whose `scraped_at` is older than the latest source sync.
