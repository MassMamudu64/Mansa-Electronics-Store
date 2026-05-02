-- =============================================================================
-- Mansa Electronics — initial schema
-- =============================================================================
create extension if not exists "uuid-ossp";

-- =============================================================================
-- PRODUCTS
-- =============================================================================
create table public.products (
  id                uuid primary key default uuid_generate_v4(),
  slug              text not null unique,
  name              text not null check (char_length(name) >= 3),
  category          text not null,
  brand             text,
  sku               text unique,
  device_type       text not null default 'Universal',
  compatibility     text[] not null default '{}',
  description       text not null default '',
  bullets           text[] not null default '{}',
  image_url         text,
  images            jsonb not null default '[]'::jsonb,
  cost_price        numeric(10,2) not null default 0 check (cost_price >= 0),
  selling_price     numeric(10,2) not null check (selling_price >= 0),
  compare_at_price  numeric(10,2),
  currency          text not null default 'USD',
  condition         text check (condition in ('New','A','B','C')),
  storage           text,
  tags              text[] not null default '{}',
  is_best_seller    boolean not null default false,
  is_active         boolean not null default true,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index idx_products_active       on public.products(is_active) where is_active = true;
create index idx_products_category     on public.products(category);
create index idx_products_best_seller  on public.products(is_best_seller) where is_best_seller = true;
create index idx_products_compatibility on public.products using gin (compatibility);

-- =============================================================================
-- INVENTORY
-- Separated from products so frequent stock updates don't churn catalog rows
-- and so we can extend to multi-location later (add location_id).
-- =============================================================================
create table public.inventory (
  id                  uuid primary key default uuid_generate_v4(),
  product_id          uuid not null unique references public.products(id) on delete cascade,
  quantity            integer not null default 0 check (quantity >= 0),
  low_stock_threshold integer not null default 3 check (low_stock_threshold >= 0),
  last_restocked      timestamptz,
  updated_at          timestamptz not null default now()
);

create index idx_inventory_low on public.inventory(quantity) where quantity > 0;

-- =============================================================================
-- CUSTOMERS
-- Keyed by phone (normalized E.164) — manual checkout, no accounts required.
-- Lets us compute repeat-customer rate without forcing sign-up.
-- =============================================================================
create table public.customers (
  id              uuid primary key default uuid_generate_v4(),
  phone           text not null unique,
  name            text not null,
  email           text,
  city            text,
  address         text,
  first_seen      timestamptz not null default now(),
  last_seen       timestamptz not null default now(),
  order_count     integer not null default 0,
  lifetime_value  numeric(10,2) not null default 0
);

-- =============================================================================
-- ORDERS
-- =============================================================================
create type order_status   as enum ('pending','confirmed','completed','cancelled');
create type payment_method as enum ('cod','transfer','mobile_money');

create table public.orders (
  id                uuid primary key default uuid_generate_v4(),
  short_code        text not null unique,
  customer_id       uuid references public.customers(id) on delete set null,
  customer_name     text not null,
  customer_phone    text not null,
  customer_address  text not null,
  customer_city     text not null,
  status            order_status   not null default 'pending',
  payment           payment_method not null default 'cod',
  notes             text,
  subtotal          numeric(10,2) not null check (subtotal >= 0),
  bundle_discount   numeric(10,2) not null default 0,
  total             numeric(10,2) not null check (total >= 0),
  whatsapp_sent     boolean not null default false,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index idx_orders_status   on public.orders(status);
create index idx_orders_created  on public.orders(created_at desc);
create index idx_orders_customer on public.orders(customer_id);

-- =============================================================================
-- ORDER_ITEMS
-- Snapshot product_name/sku/price_at_sale so historical orders read correctly
-- even after catalog changes.
-- =============================================================================
create table public.order_items (
  id            uuid primary key default uuid_generate_v4(),
  order_id      uuid not null references public.orders(id) on delete cascade,
  product_id    uuid not null references public.products(id) on delete restrict,
  product_name  text not null,
  product_sku   text,
  quantity      integer not null check (quantity > 0),
  price_at_sale numeric(10,2) not null check (price_at_sale >= 0),
  line_total    numeric(10,2) not null check (line_total >= 0)
);

create index idx_order_items_order   on public.order_items(order_id);
create index idx_order_items_product on public.order_items(product_id);

-- =============================================================================
-- USER_ROLES — admin/staff RBAC bound to Supabase Auth users
-- =============================================================================
create type user_role as enum ('admin','staff');

create table public.user_roles (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  role       user_role not null,
  created_at timestamptz not null default now()
);

-- =============================================================================
-- Auto-update updated_at
-- =============================================================================
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_products_touch  before update on public.products  for each row execute function public.touch_updated_at();
create trigger trg_inventory_touch before update on public.inventory for each row execute function public.touch_updated_at();
create trigger trg_orders_touch    before update on public.orders    for each row execute function public.touch_updated_at();
