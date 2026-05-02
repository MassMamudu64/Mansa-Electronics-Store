---
name: Mansa Electronics MVP Architecture
description: System architecture, two-system separation, data layer, and key design decisions
type: project
---

Mansa Electronics is a premium electronics retailer MVP built on Next.js 14 (App Router), React, TypeScript, Tailwind CSS with a charcoal/white design system.

**Two clearly separate systems:**
1. Main Ecommerce Site (`/`, `/shop`, `/product/[id]`, `/cart`, `/checkout`, `/success`)
2. Inventory Dashboard (`/inventory`, `/inventory/history`) — separate layout, dark sidebar, internal-focused

**Commerce Admin** (`/admin`, `/admin/products`, `/admin/orders`, `/admin/customers`, `/admin/banners`) — separate from inventory dashboard, shares no UI chrome with storefront.

**Separation enforced by StoreShell component** (`src/components/StoreShell.jsx`): routes starting with `/admin` or `/inventory` get no storefront Navbar/Footer.

**Data layer:**
- `src/lib/serverDb.ts` — server-side JSON file store (reads/writes `data/products.json` and `data/orders.json`). Used by all API routes.
- `src/store/cartStore.ts` — Zustand persist (localStorage) for cart
- Supabase mode: uncomment `supabaseAdapter` in `src/lib/storage/index.ts`

**Inventory API (read-only for ecommerce):**
- `GET /api/inventory/[sku]` — single item by SKU/ID/slug
- `GET /api/inventory/snapshot` — all items bulk
- `GET /api/inventory` — full list (used by inventory dashboard)
- `PATCH /api/inventory` — update stock (inventory dashboard only)
- `GET /api/inventory/history` — audit log from `data/inventory_changes.json`
- Secured by `INVENTORY_API_KEY` env var (optional in dev)

**Order flow:**
- POST /api/orders → re-prices from server catalog, deducts stock atomically, creates order in data/orders.json, sends email via Nodemailer (no PDF attachment)
- PATCH /api/orders/[id] → update status (pending/confirmed/completed/cancelled)
- Success page reads from sessionStorage key `mansa:last_order`

**Design system:** charcoal palette (charcoal-50 to charcoal-950), class utilities in globals.css (.btn-primary, .btn-secondary, .input, .card, .badge-*, .chip, .nav-item, etc.)

**Why:** Full replacement of the previous gold/ink design and merged admin that violated the two-system requirement.

**How to apply:** When adding features, respect the two-system boundary. Don't add inventory write operations to /admin routes. Don't add storefront UI to /inventory routes.
