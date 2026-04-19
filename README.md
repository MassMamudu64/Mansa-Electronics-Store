# Mansa Electronics — MVP

A production-ready MVP storefront for a small electronics business (iPhones + accessories).
Built with **Next.js 14 (App Router) + Tailwind CSS + Node API routes + JSON storage +
PDFKit invoices + Nodemailer SMTP**.

---

## Features

- **Professional storefront** inspired by top electronics retailers (Apple, Back Market, Swappa):
  - Sticky announcement bar, premium navbar with prominent search, footer with newsletter.
  - Home page: hero, category tiles, trust rail, featured products, condition guide, "why Mansa", testimonials, FAQ accordion.
  - `/shop` listing with sticky sidebar filters (category / condition / storage / variant / price / in-stock), sort, and in-page search.
  - `/product/[id]` detail page with gallery, condition callout, specs, what's-in-the-box, related products, quantity picker.
  - Polished cart, multi-step-styled checkout with order summary sidebar, and confirmation page.
  - Admin dashboard with KPIs (inventory value, low stock, OOS), product search, inline CRUD.
- **Product catalog** — id, category, model, storage, condition (A/B/C), price, quantity, image.
- **Cart** — add / remove / adjust quantity, subtotal + total, persisted in `localStorage`.
- **Order submission** — server builds a branded PDF invoice and emails it (as an attachment) to the operator inbox via Nodemailer SMTP. Re-prices from the server-side catalog so clients can't tamper.
- **Inventory deduction** — stock is decremented atomically before the order is recorded; out-of-stock purchases are rejected.
- **Resilient** — order is still recorded if email fails; customer is informed.
- **Clean architecture** — `src/lib/db.js` hides the storage layer so it can be swapped for SQLite, Postgres, Supabase, etc. without touching UI.
- **No payment integration** — manual order flow, as specified.

---

## Project structure

```
Mansa_Store/
├── data/
│   ├── products.json          # Seed catalog (edit or wipe as needed)
│   └── orders.json            # Orders are appended here
├── public/
│   └── placeholder.svg        # Product image placeholder
├── src/
│   ├── app/
│   │   ├── layout.jsx         # Root layout, wraps everything in <CartProvider>
│   │   ├── page.jsx           # Storefront (home)
│   │   ├── globals.css        # Tailwind entry + design tokens
│   │   ├── cart/page.jsx      # Cart
│   │   ├── checkout/page.jsx  # Checkout form
│   │   ├── success/page.jsx   # Order confirmation
│   │   ├── admin/page.jsx     # Admin inventory editor
│   │   └── api/
│   │       ├── products/route.js        # GET all, POST new
│   │       ├── products/[id]/route.js   # GET, PATCH, DELETE
│   │       └── orders/route.js          # POST (creates order + PDF + email)
│   ├── components/
│   │   ├── Navbar.jsx
│   │   ├── ProductCard.jsx
│   │   └── FilterBar.jsx
│   ├── context/
│   │   └── CartContext.jsx    # Client cart store
│   └── lib/
│       ├── db.js              # JSON data access (swap me for a real DB)
│       ├── pdf.js             # PDFKit invoice builder
│       └── mailer.js          # Nodemailer wrapper
├── package.json
├── next.config.mjs
├── tailwind.config.js
├── postcss.config.js
├── jsconfig.json
└── .env.local.example
```

---

## Setup

### 1. Install dependencies

```bash
cd Mansa_Store
npm install
```

### 2. Configure environment

Copy the example and fill in your SMTP credentials:

```bash
cp .env.local.example .env.local
```

Required variables (see `.env.local.example`):

| Variable             | Purpose                                                            |
| -------------------- | ------------------------------------------------------------------ |
| `SMTP_HOST`          | SMTP server hostname (e.g. `smtp.gmail.com`)                       |
| `SMTP_PORT`          | SMTP port (587 for STARTTLS, 465 for SSL)                          |
| `SMTP_SECURE`        | `true` for port 465, `false` otherwise                             |
| `SMTP_USER`          | SMTP login (email address)                                         |
| `SMTP_PASS`          | SMTP password or app-specific password                             |
| `MAIL_FROM`          | `"Mansa Electronics <orders@...>"` — the From header               |
| `ORDERS_INBOX`       | Inbox that receives every new order (e.g. `julatechs@gmail.com`)   |
| `NEXT_PUBLIC_SITE_URL` | Public URL of the site (used in emails)                          |

> **Gmail users:** enable 2FA and create an *App Password* (Google Account → Security → App Passwords). Normal passwords will be rejected.
>
> **Testing without a real inbox:** [Mailtrap.io](https://mailtrap.io) gives you free SMTP creds that capture mail in a web UI — paste them into `.env.local` and you're done.

### 3. Run the dev server

```bash
npm run dev
```

Open <http://localhost:3000>.

### 4. Build for production

```bash
npm run build
npm run start
```

---

## URLs at a glance

| Path                | What it is                                                     |
| ------------------- | -------------------------------------------------------------- |
| `/`                 | Marketing home — hero, categories, trust, FAQ                  |
| `/shop`             | Full catalog with filter sidebar + sort (supports `?q=`, `?category=`) |
| `/product/[id]`     | Product detail page with gallery, specs, related items         |
| `/cart`             | Cart review + quantity editing                                 |
| `/checkout`         | Shipping form + Submit Order                                   |
| `/success`          | Post-order confirmation                                        |
| `/admin`            | Inventory dashboard + CRUD (no auth — MVP only)                |
| `/api/products`     | List / create                                                  |
| `/api/products/:id` | Read / update / delete                                         |
| `/api/orders`       | Submit an order (creates PDF + emails it)                      |

---

## Order flow

1. User adds products → cart in `localStorage`.
2. User fills checkout form → `POST /api/orders` with `{ customer, items: [{id, quantity}] }`.
3. Server:
   - re-reads the catalog (client prices are **ignored** — server re-prices).
   - verifies every line is in stock.
   - atomically decrements inventory.
   - appends the order to `data/orders.json`.
   - renders a PDF invoice via PDFKit.
   - emails the PDF to `ORDERS_INBOX` via Nodemailer, with `Reply-To` set to the customer.
4. User is redirected to `/success?id=...`.

If the email step fails (SMTP down, misconfigured, etc.), the order is **still persisted**
and the success page tells the user. Check `data/orders.json` to recover.

---

## Extending later

The MVP is deliberately modular:

- **Real DB** — replace the body of `src/lib/db.js` with Prisma / Drizzle / Supabase. All call sites already use its async API.
- **Payments** — add a Stripe checkout step between `checkout` and `success`. The order API already knows how to re-price and reserve inventory; call it from a Stripe webhook instead of the form.
- **Auth** — wrap `/admin` and admin-facing API routes with `next-auth` or a Next.js middleware + session cookie. Nothing else needs to change.
- **Product images** — today we ship a single `/placeholder.svg`. Swap the `image` field to a real URL (S3, Cloudinary, `/public`), or add an upload step in `/admin`.
- **Receipts for the customer** — extend `sendOrderEmail` to also send a copy to `order.customer.email`.

---

## License

MIT — use this as a starting point for your own shop.
