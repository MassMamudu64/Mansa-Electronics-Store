-- =============================================================================
-- Row-Level Security
-- Public can read products + inventory. Orders can ONLY be created via the
-- create_order RPC. Admin/staff have authenticated write access.
-- =============================================================================

-- Helpers
create or replace function public.is_admin()
returns boolean language sql security definer stable as $$
  select exists (
    select 1 from public.user_roles
    where user_id = auth.uid() and role = 'admin'
  );
$$;

create or replace function public.is_staff_or_admin()
returns boolean language sql security definer stable as $$
  select exists (
    select 1 from public.user_roles
    where user_id = auth.uid() and role in ('admin','staff')
  );
$$;

-- ============================ PRODUCTS ============================
alter table public.products enable row level security;

create policy "products_public_read"
  on public.products for select
  using (is_active = true);

create policy "products_admin_all"
  on public.products for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ============================ INVENTORY ===========================
alter table public.inventory enable row level security;

create policy "inventory_public_read"
  on public.inventory for select using (true);

create policy "inventory_staff_write"
  on public.inventory for all
  to authenticated
  using (public.is_staff_or_admin())
  with check (public.is_staff_or_admin());

-- ============================ ORDERS ==============================
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

-- No public insert — orders are created ONLY via the create_order RPC.
create policy "orders_admin_read"
  on public.orders for select
  to authenticated
  using (public.is_staff_or_admin());

create policy "orders_admin_update"
  on public.orders for update
  to authenticated
  using (public.is_staff_or_admin())
  with check (public.is_staff_or_admin());

create policy "order_items_admin_read"
  on public.order_items for select
  to authenticated
  using (public.is_staff_or_admin());

-- ============================ CUSTOMERS ===========================
alter table public.customers enable row level security;

create policy "customers_admin_all"
  on public.customers for all
  to authenticated
  using (public.is_staff_or_admin())
  with check (public.is_staff_or_admin());

-- ============================ USER_ROLES ==========================
alter table public.user_roles enable row level security;

create policy "user_roles_self_read"
  on public.user_roles for select
  to authenticated
  using (user_id = auth.uid() or public.is_admin());

create policy "user_roles_admin_write"
  on public.user_roles for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());
