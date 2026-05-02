-- =============================================================================
-- Mansa Electronics — banners + inventory audit log
-- Adds two new tables needed by the MVP and an RPC for atomic stock updates.
-- =============================================================================

-- =============================================================================
-- BANNERS
-- Managed by commerce admin. Read by the storefront.
-- =============================================================================
create table if not exists public.banners (
  id             uuid primary key default uuid_generate_v4(),
  title          text not null,
  subtitle       text,
  cta_label      text,
  link_url       text,
  image_url      text,
  is_active      boolean not null default true,
  display_order  integer not null default 0,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists idx_banners_active on public.banners(is_active) where is_active = true;
create index if not exists idx_banners_order  on public.banners(display_order);

create trigger trg_banners_touch
  before update on public.banners
  for each row execute function public.touch_updated_at();

-- RLS
alter table public.banners enable row level security;

create policy "public read active banners" on public.banners
  for select using (is_active = true);

create policy "staff manage banners" on public.banners
  using (
    exists (
      select 1 from public.user_roles
      where user_id = auth.uid() and role in ('admin', 'staff')
    )
  );

-- =============================================================================
-- INVENTORY_CHANGES
-- Audit log for every stock update. Immutable once written.
-- =============================================================================
create table if not exists public.inventory_changes (
  id               uuid primary key default uuid_generate_v4(),
  inventory_id     uuid not null references public.inventory(id) on delete cascade,
  product_id       uuid not null references public.products(id) on delete cascade,
  change_type      text not null check (change_type in ('restock', 'deduction', 'adjustment', 'correction')),
  quantity_before  integer not null,
  quantity_after   integer not null,
  delta            integer not null generated always as (quantity_after - quantity_before) stored,
  note             text,
  changed_by       text,
  created_at       timestamptz not null default now()
);

create index if not exists idx_inv_changes_product  on public.inventory_changes(product_id);
create index if not exists idx_inv_changes_created  on public.inventory_changes(created_at desc);

-- RLS
alter table public.inventory_changes enable row level security;

create policy "staff read inventory changes" on public.inventory_changes
  for select using (
    exists (
      select 1 from public.user_roles
      where user_id = auth.uid() and role in ('admin', 'staff')
    )
  );

create policy "staff insert inventory changes" on public.inventory_changes
  for insert with check (
    exists (
      select 1 from public.user_roles
      where user_id = auth.uid() and role in ('admin', 'staff')
    )
  );

-- =============================================================================
-- RPC: update_inventory
-- Atomic stock update with audit logging.
-- Only callable by authenticated staff/admin (security definer guards writes).
-- =============================================================================
create or replace function public.update_inventory(
  p_product_id   uuid,
  p_new_quantity integer,
  p_change_type  text default 'adjustment',
  p_note         text default null,
  p_changed_by   text default null
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_inventory_id  uuid;
  v_old_qty       integer;
  v_caller_role   user_role;
begin
  -- Verify caller is staff or admin
  select role into v_caller_role
  from public.user_roles
  where user_id = auth.uid();

  if v_caller_role is null then
    raise exception 'Permission denied: staff or admin role required';
  end if;

  if p_new_quantity < 0 then
    raise exception 'Quantity cannot be negative';
  end if;

  if p_change_type not in ('restock', 'deduction', 'adjustment', 'correction') then
    raise exception 'Invalid change_type: %', p_change_type;
  end if;

  -- Lock the inventory row
  select id, quantity
  into v_inventory_id, v_old_qty
  from public.inventory
  where product_id = p_product_id
  for update;

  if not found then
    raise exception 'Inventory record not found for product %', p_product_id;
  end if;

  -- Update stock
  update public.inventory
  set quantity = p_new_quantity
  where id = v_inventory_id;

  -- Append audit record
  insert into public.inventory_changes (
    inventory_id, product_id, change_type,
    quantity_before, quantity_after,
    note, changed_by
  )
  values (
    v_inventory_id, p_product_id, p_change_type,
    v_old_qty, p_new_quantity,
    p_note, p_changed_by
  );

  return json_build_object(
    'product_id',    p_product_id,
    'old_quantity',  v_old_qty,
    'new_quantity',  p_new_quantity,
    'delta',         p_new_quantity - v_old_qty
  );
end;
$$;

-- Revoke direct table write on inventory from public; only RPC and service role write
revoke insert, update, delete on public.inventory from anon, authenticated;

-- Re-grant RPC execution to authenticated users (RLS inside checks role)
grant execute on function public.update_inventory to authenticated;
