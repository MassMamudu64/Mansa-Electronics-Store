# Hostinger MySQL → Supabase PostgreSQL — Migration Checklist

**Strategy:** Option A — keep Prisma as the ORM, swap the underlying database
provider from MySQL (Hostinger) to PostgreSQL (Supabase). Query layer stays.
Old Hostinger code is preserved as comments, not deleted.

**Auth scope:** unchanged. The custom HMAC-cookie admin session
(`ADMIN_ID` / `ADMIN_PASSWORD` / `ADMIN_SESSION_SECRET`,
[src/lib/auth/session.ts](src/lib/auth/session.ts)) is **not** being migrated
to Supabase Auth.

---

## Files modified by this migration

| File | What changed |
|---|---|
| [.env.local.example](.env.local.example) | New `DATABASE_URL` (Supabase pooled), new `DIRECT_URL`, new `SUPABASE_*` keys. Old MySQL line preserved as comment. |
| [prisma/schema.prisma](prisma/schema.prisma) | `provider` swapped `mysql` → `postgresql`. Added `directUrl`. Old datasource block preserved as comment. Models unchanged (types are portable). |
| [src/lib/prisma.ts](src/lib/prisma.ts) | Header migration note only. Singleton works against PG unchanged. |
| [src/lib/db/products.ts](src/lib/db/products.ts) | `contains` filters now use `mode: 'insensitive'` (PG `LIKE` is case-sensitive; MySQL collation was case-insensitive by default). Old block preserved as comment. |
| [prisma/migrations/20260503000000_init/migration.sql](prisma/migrations/20260503000000_init/migration.sql) | Header note: this MySQL migration must NOT be run against PG. |
| [scripts/import-json-to-mysql.mjs](scripts/import-json-to-mysql.mjs) | Header note: provider-agnostic via Prisma; runs unchanged against PG. Filename preserved to avoid breaking the `db:import` script. |

## Files explicitly NOT modified

These were reviewed and confirmed provider-agnostic — no MySQL-specific code:

- [src/lib/db/inventory.ts](src/lib/db/inventory.ts)
- [src/lib/db/orders.ts](src/lib/db/orders.ts)
- [src/lib/db/adminActivity.ts](src/lib/db/adminActivity.ts) — Prisma error codes `P2002`/`P2025` are provider-agnostic
- [src/lib/db/serialize.ts](src/lib/db/serialize.ts)
- All [src/app/api/](src/app/api/) route handlers — they call DB helpers, never raw SQL
- [src/lib/auth/](src/lib/auth/) — in-memory rate limiter, HMAC sessions, no DB
- [src/lib/supabase/{client,server,types}.ts](src/lib/supabase/) — already exist; left alone (Option A does not use supabase-js for queries)

---

## Manual steps (Mass — do these in order)

### 1. Provision Supabase
- [ ] Create a new Supabase project (or use an existing one)
- [ ] Dashboard → **Project Settings → Database → Connection string**
  - Copy the **Transaction pooler** URL (port `6543`) → goes in `DATABASE_URL`
  - Copy the **Session pooler** or direct URL (port `5432`) → goes in `DIRECT_URL`
  - URL-encode any special characters in the password (`@` → `%40`, etc.)
- [ ] Dashboard → **Project Settings → API**
  - Copy `URL`, `anon public key`, `service_role key`
  - Paste into the corresponding `SUPABASE_*` and `NEXT_PUBLIC_SUPABASE_*` vars

### 2. Update local env
- [ ] Copy `.env.local.example` → `.env.local`
- [ ] Fill in every `TODO:` placeholder
- [ ] Confirm `ADMIN_SESSION_SECRET` is at least 32 random bytes:
  ```bash
  node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
  ```

### 3. Push the schema to Supabase
- [ ] Regenerate the Prisma client against the PG schema:
  ```bash
  npx prisma generate
  ```
- [ ] **Recommended (MVP cutover): push without migration history**
  ```bash
  npx prisma db push
  ```
  This creates all tables + indexes + enums in the empty Supabase database
  in one shot, using the PG datasource.
- [ ] **Alternative (clean migration history):**
  ```bash
  rm -rf prisma/migrations
  npx prisma migrate dev --name init_postgres
  ```
  This deletes the legacy MySQL migration and generates a fresh PG one.
  The legacy migration remains in git history for reference.

### 4. Import existing data
- [ ] (Optional) Export current Hostinger MySQL data to JSON if needed
- [ ] Run the importer (works against PG unchanged):
  ```bash
  npm run db:import
  ```

### 5. Verify
- [ ] `npm run dev` and exercise:
  - [ ] Storefront product list ([/shop](http://localhost:3000/shop))
  - [ ] Product search bar (catches the `mode: 'insensitive'` change)
  - [ ] Cart → checkout → order creation (transactional inventory deduct)
  - [ ] Admin login at [/login](http://localhost:3000/login)
  - [ ] Admin product create / edit / archive
  - [ ] Admin inventory adjustment (history row appears)
  - [ ] Admin orders page lists the test order

### 6. Cut over production
- [ ] Set the same `DATABASE_URL` / `DIRECT_URL` / `SUPABASE_*` env vars in
      the production host (Vercel / Hostinger Node app / wherever)
- [ ] Run `prisma db push` against the production Supabase project
- [ ] Re-run `npm run db:import` against production (or migrate data
      out of Hostinger MySQL via mysqldump → CSV → Supabase Studio)
- [ ] Deploy the new build
- [ ] Once stable for 48h, decommission the Hostinger MySQL database

---

## Things to know

- **PgBouncer + Prisma:** the `DATABASE_URL` MUST include
  `?pgbouncer=true&connection_limit=1`, otherwise Prisma's prepared-statement
  cache collides with PgBouncer's transaction pooling and you get random
  `prepared statement "sN" already exists` errors at runtime.
- **`prisma migrate` needs `DIRECT_URL`:** DDL (CREATE TABLE etc.) cannot
  run through PgBouncer transaction mode. Prisma uses `directUrl` for
  migrations and `url` for runtime queries automatically.
- **JSON columns:** Prisma's `Json` type maps to PG's `jsonb` by default
  (binary, indexable). No schema change needed; existing data round-trips
  identically.
- **Enums:** PG has native enum types. Prisma creates them on `db push`.
  `OrderStatus` and `InventoryChangeType` will become real PG enum types
  rather than the inline MySQL `ENUM(...)` columns they used to be.
- **Case-insensitive search:** the only behavioral MySQL → PG difference
  encountered. Fixed in [src/lib/db/products.ts](src/lib/db/products.ts)
  by adding `mode: 'insensitive'` (Prisma → `ILIKE` on PG).
- **No data was deleted.** The Hostinger DB is untouched by this code change.
  If you need to keep the old MySQL running in parallel during the cutover,
  point a second deployment at the old `DATABASE_URL`.
