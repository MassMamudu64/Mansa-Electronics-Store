# Pricing Engine — Operations

End-to-end runbook for the WeSellCellular pricing pipeline. Covers how to
schedule syncs, how data flows through the system, what "stale" means, and
what to do when things break.

> ShopMansa-side architectural details are in [`README.md`](./README.md);
> Next.js integration lives in [`../src/lib/pricing/`](../src/lib/pricing/)
> and [`../src/app/admin/pricing/`](../src/app/admin/pricing/).

---

## 1. End-to-end flow

```
┌──────────────────┐  cron every 3–6h   ┌────────────────────────┐
│ Scheduler        │ ─────────────────▶ │ FastAPI pricing engine │
│ (cron / Actions  │  POST /sync        │  pricing-engine/        │
│  / Render Cron)  │  Bearer key        │  app/main.py            │
└──────────────────┘                    └──────────┬─────────────┘
                                                   │ login + CSV
                                                   ▼
                                        ┌─────────────────────┐
                                        │ WeSellCellular B2B  │
                                        │ dealer portal       │
                                        └─────────────────────┘
                                                   │
                                  asyncpg, port 5432│ INSERT ... ON CONFLICT
                                                   ▼
                                        ┌─────────────────────────┐
                                        │ Supabase Postgres       │
                                        │ wholesale_sources       │
                                        │ wholesale_listings      │
                                        └────────┬────────────────┘
                                                 │ Prisma reads
                                                 ▼
                                       ┌──────────────────────┐
                                       │ Next.js              │
                                       │ /api/pricing/*       │
                                       │ /admin/pricing/*     │
                                       │ /price-check         │
                                       └──────────────────────┘
                                                 ▲
                                                 │ "Sync now" button
                                                 │ POST /api/pricing/sync
                                                 │   (dual-auth)
                                       ┌─────────┴────────────┐
                                       │ Admin operator       │
                                       │ (in browser)         │
                                       └──────────────────────┘
```

Every sync:
1. Scheduler hits `POST /sync` on the FastAPI service with `Authorization: Bearer ${PRICING_API_KEY}`.
2. FastAPI opens a session against `wholesale_sources`, upserts the row for `WeSellCellular`, and marks `status = 'syncing'`.
3. FastAPI logs into the WeSellCellular dealer portal, downloads the inventory CSV, normalizes it.
4. FastAPI opens a single Postgres transaction: bulk `INSERT … ON CONFLICT (source_id, sku) DO UPDATE` over every normalized row, then sets `status='ok'` + `last_synced_at=NOW()`. Either everything commits or nothing does.
5. Next.js admins see the new `lastSyncedAt` on `/admin/pricing`, the stale banner clears, and the public `POST /api/pricing/quote` starts returning fresh prices.

The admin "Sync now" button hits `POST /api/pricing/sync` on Next.js, which proxies to the same FastAPI `/sync` (see [`../src/lib/pricing/client.ts`](../src/lib/pricing/client.ts)). Same code path as cron, just a different trigger.

---

## 2. Scheduling /sync

The FastAPI service does not schedule itself — that's the host's job.
Pick whichever scheduler fits your deployment. Recommended cadence:
**every 3–6 hours** (the in-app stale banner trips at 6h).

### 2.1 GitHub Actions (universal, host-agnostic)

```yaml
# .github/workflows/pricing-sync.yml
name: Pricing engine sync

on:
  schedule:
    - cron: "0 */6 * * *"   # every 6 hours, on the hour, UTC
  workflow_dispatch:         # also surface a "Run workflow" button

jobs:
  sync:
    runs-on: ubuntu-latest
    timeout-minutes: 5
    steps:
      - name: POST /sync
        env:
          PRICING_API_URL: ${{ secrets.PRICING_API_URL }}
          PRICING_API_KEY: ${{ secrets.PRICING_API_KEY }}
        run: |
          curl -fsS \
            --max-time 180 \
            -X POST "$PRICING_API_URL/sync" \
            -H "Authorization: Bearer $PRICING_API_KEY" \
            -H "Accept: application/json"
```

Configure repository secrets `PRICING_API_URL` (e.g. `https://pricing.shopmansa.com`) and `PRICING_API_KEY` under **Settings → Secrets and variables → Actions**.

### 2.2 Render — Cron Job service

Create a second Render service alongside the FastAPI web service, type **Cron Job**:

- **Schedule**: `0 */6 * * *`
- **Build command**: leave empty
- **Run command**: `bash ./scripts/sync.sh`
- **Environment**:
  - `PRICING_API_URL=https://<your-fastapi>.onrender.com`
  - `PRICING_API_KEY=...`

[`scripts/sync.sh`](./scripts/sync.sh) is committed to this directory — Render checks the repo out before running.

### 2.3 Railway — Cron service

Add a new service in the same project, set **Cron Schedule** to `0 */6 * * *`, and use this start command:

```
bash ./pricing-engine/scripts/sync.sh
```

Set `PRICING_API_URL` and `PRICING_API_KEY` as service variables. Reference the same Postgres? No — the cron service doesn't talk to Postgres, only to the FastAPI URL.

### 2.4 Fly.io — scheduled machines

```toml
# fly.toml — alongside your FastAPI [[services]]
[[machines.processes]]
  name = "sync"
  cmd = ["bash", "./scripts/sync.sh"]
  schedule = "0 */6 * * *"   # every 6h
```

### 2.5 Self-hosted (systemd timer)

```ini
# /etc/systemd/system/shopmansa-sync.service
[Unit]
Description=ShopMansa pricing sync

[Service]
Type=oneshot
EnvironmentFile=/etc/shopmansa/pricing.env
ExecStart=/usr/local/bin/sync.sh
User=shopmansa
```

```ini
# /etc/systemd/system/shopmansa-sync.timer
[Unit]
Description=Sync ShopMansa pricing every 6 hours

[Timer]
OnCalendar=0/6:00
Persistent=true
Unit=shopmansa-sync.service

[Install]
WantedBy=timers.target
```

Then `systemctl enable --now shopmansa-sync.timer`.

### 2.6 Manual one-off (debug)

From a workstation with the env vars set:

```bash
export PRICING_API_URL=https://pricing.shopmansa.com
export PRICING_API_KEY=...   # from the FastAPI service's env
./pricing-engine/scripts/sync.sh
```

Or in PowerShell:

```powershell
$env:PRICING_API_URL = "https://pricing.shopmansa.com"
$env:PRICING_API_KEY = "..."
bash ./pricing-engine/scripts/sync.sh
```

The script exits non-zero on failure — easy to chain with `&&` or surface in CI.

---

## 3. The exact HTTP call

What every scheduler ultimately runs:

```http
POST /sync HTTP/1.1
Host: pricing.shopmansa.com
Authorization: Bearer <PRICING_API_KEY>
Accept: application/json
Content-Length: 0
```

Successful response (HTTP 200):

```json
{
  "source": "WeSellCellular",
  "listings_seen": 1247,
  "listings_written": 1247,
  "started_at":  "2026-05-30T14:00:01",
  "finished_at": "2026-05-30T14:00:08",
  "duration_ms": 7204,
  "status": "ok"
}
```

Failure shapes:

| HTTP | Cause | What to do |
|------|-------|------------|
| 401 | Bearer missing / wrong | Rotate `PRICING_API_KEY` in both env files. |
| 502 | FastAPI raised during scrape | Check FastAPI logs for the upstream error. `wholesale_sources.last_error` will also be populated. |
| 504 | FastAPI timed out | WeSellCellular slow or down. Retry on next cron tick. |
| 5xx | FastAPI unreachable | Container down / restarting. Healthcheck on `/health` covers this. |

---

## 4. Idempotency

- **(source_id, sku) is unique.** Bulk upsert keyed on this pair — repeated runs overwrite without duplicating.
- **One transaction per run.** The full upsert batch + the `wholesale_sources` status update happen in the same Postgres transaction. If anything throws, the entire run rolls back and `last_synced_at` does not advance.
- **Status row recovers itself.** If a run dies between Step 2 (mark `syncing`) and Step 4 (mark `ok`), the orchestrator catches the exception and opens a fresh transaction that writes `status='error'` + `last_error=<message>`. No manual cleanup needed.
- **Disappeared listings are NOT deleted.** If a SKU stops appearing in the upstream feed, its row stays in `wholesale_listings` with an old `scraped_at`. The listing-level staleness check (24h) surfaces these in [`/admin/pricing/listings`](../src/app/admin/pricing/listings/page.jsx). A "delete listings older than N days" sweeper is a future enhancement.

Practical implication: **calling /sync ten times in a row is safe.** Calling it during another sync is also safe — the second caller waits on the row lock from the first, then immediately re-upserts the same rows. No data corruption.

---

## 5. Stale-data detection

Two distinct thresholds, both centralized in [`../src/lib/pricing/staleness.ts`](../src/lib/pricing/staleness.ts):

| Concept | Source | Default threshold | Surface |
|---|---|---|---|
| Source-level | `wholesale_sources.last_synced_at` | **6 hours** | Top banner on `/admin/pricing`, KPI "Last sync" colored red. |
| Listing-level | `wholesale_listings.scraped_at` | **24 hours** | KPI card "Stale (>24h)" on `/admin/pricing`; per-row `scrapedAt` on the Listings page. |

Helper API:

```ts
import { checkStaleness, formatAge, SOURCE_STALE_HOURS } from '@/lib/pricing/staleness';

const v = checkStaleness(source.lastSyncedAt, SOURCE_STALE_HOURS);
// v: { isStale, ageHours, thresholdHours, level: 'fresh' | 'aging' | 'stale' | 'unknown' }

formatAge(v.ageHours)       // "4 hours"
formatAgo(source.lastSyncedAt) // "4h ago"
```

Levels:
- **fresh** — under the aging threshold (≤ 3h default). No UI change.
- **aging** — between aging and stale thresholds (3h–6h). Amber banner.
- **stale** — past the stale threshold (> 6h). Red banner.
- **unknown** — no timestamp recorded yet (never synced). Gray banner with "first run" copy.

To tighten or loosen, change the exported constants in `staleness.ts` — the admin overview and any future consumers automatically follow.

---

## 6. Manual operator workflow

When the admin opens `/admin/pricing`:

1. **Status query** (`GET /api/pricing/status`) returns the latest `wholesale_sources` row + counts.
2. The page computes `checkStaleness(source.lastSyncedAt, 6)`.
3. If `level !== 'fresh'`, a banner renders at the top with a **Sync now** button.
4. Clicking **Sync now** fires `POST /api/pricing/sync`:
   - Same-origin CSRF check passes (admin browser → admin host).
   - Dual-auth helper accepts the admin session cookie.
   - Audit row written to `admin_activity` (`action: 'pricing.sync'`, `via: 'session'`).
   - Forwards to FastAPI `POST /sync` using `PRICING_API_URL` + `PRICING_API_KEY` from env.
5. On success: status query auto-refetches (60 s interval), banner clears, KPI flips back to green.

The same button is also in the page header (top-right). Both call the same mutation.

External cron uses the same `POST /api/pricing/sync` endpoint via the dual-auth path (`Authorization: Bearer ${WESELL_INGEST_KEY}` instead of a session cookie). The Next.js wrapper isn't strictly needed for cron — schedulers can hit FastAPI directly (and most of the examples above do) — but it's useful when you want every sync to flow through the audit log.

---

## 7. Failure modes

| Symptom | Likely cause | Fix |
|---|---|---|
| Banner stuck on "X hours old", no errors in logs | Cron not firing | Check the scheduler's history. Re-deploy if the schedule was edited but never picked up. |
| `last_error: "Auth failed"` on the source row | WeSellCellular credentials rotated upstream | Update `WESELL_USERNAME` / `WESELL_PASSWORD` in the FastAPI env, redeploy, manually trigger sync. |
| `last_error: "no rows in CSV"` | WeSellCellular changed their CSV column names | Extend `COLUMN_MAP` in [`app/scraper/normalize.py`](./app/scraper/normalize.py). |
| `/sync` returns 502 + `code: NOT_CONFIGURED` from Next.js | `PRICING_API_URL` / `PRICING_API_KEY` not set in the Next.js env | Fill those in `.env.local` / production env. |
| `/sync` returns 504 | FastAPI took longer than the Next.js client timeout (120s) | Profile the scrape; reduce CSV size by adding upstream filters, or raise `SYNC_TIMEOUT_MS` in `client.ts`. |
| 200 OK but `listings_written: 0` | Upstream feed empty (rare), or `COLUMN_MAP` produced no valid rows | Check `wholesale_sources.last_error` (likely empty); check FastAPI logs for `normalize.rows_skipped`. |

When investigating: the **`admin_activity`** table has every sync trigger (who / when / via session vs api key), and **`wholesale_sources.last_error`** holds the most recent FastAPI exception message.

---

## 8. Tuning cadence

- The stale banner trips at **6 hours**. Pair that with a cron cadence of **every 3 hours** for headroom; a missed run won't immediately surface as red.
- If you tighten the schedule to every hour, also lower `SOURCE_STALE_HOURS` (default 6) and `SOURCE_AGING_HOURS` (default 3) in `staleness.ts`. They should sit at roughly 2× and 4× the cron interval respectively.
- The 24h `LISTING_STALE_HOURS` is independent of the cron schedule — it surfaces SKUs that have disappeared from upstream. Don't tighten it below ~12h unless you want to flag every brief outage as "stale."

---

## 9. Quick reference

| Action | Where |
|---|---|
| Cadence | This doc, §2. |
| Stale threshold (source) | [`src/lib/pricing/staleness.ts`](../src/lib/pricing/staleness.ts) — `SOURCE_STALE_HOURS`. |
| Stale threshold (listing) | [`src/app/api/pricing/status/route.ts`](../src/app/api/pricing/status/route.ts) — `STALE_THRESHOLD_HOURS`. |
| Manual sync button | `/admin/pricing` → top-right or stale banner. |
| Audit log | Postgres `admin_activity` table. |
| Engine error message | Postgres `wholesale_sources.last_error`. |
| Engine health | `GET /health` on the FastAPI service (no auth). |
