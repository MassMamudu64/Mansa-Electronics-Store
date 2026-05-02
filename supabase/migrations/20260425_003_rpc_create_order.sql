-- =============================================================================
-- create_order — atomic order creation with row-level inventory locks.
-- Prevents overselling under concurrent load. ALL OR NOTHING.
-- =============================================================================
create or replace function public.create_order(
  p_customer_name    text,
  p_customer_phone   text,
  p_customer_address text,
  p_customer_city    text,
  p_payment          payment_method,
  p_notes            text,
  p_short_code       text,
  p_cart_items       jsonb           -- [{ "product_id": "...", "quantity": 1 }, ...]
)
returns table (
  order_id   uuid,
  short_code text,
  total      numeric
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order_id        uuid;
  v_customer_id     uuid;
  v_subtotal        numeric(10,2) := 0;
  v_bundle_discount numeric(10,2) := 0;
  v_total           numeric(10,2);
  v_distinct        integer;
  v_item            jsonb;
  v_inv             record;
  v_qty             integer;
begin
  if p_cart_items is null or jsonb_array_length(p_cart_items) = 0 then
    raise exception 'Cart is empty' using errcode = 'P0001';
  end if;
  if char_length(trim(p_customer_name)) < 2 then
    raise exception 'Invalid customer name' using errcode = 'P0001';
  end if;
  if char_length(trim(p_customer_phone)) < 7 then
    raise exception 'Invalid phone number' using errcode = 'P0001';
  end if;

  -- 1. Lock inventory rows + validate stock for ALL items before any mutation
  for v_item in select * from jsonb_array_elements(p_cart_items)
  loop
    v_qty := (v_item->>'quantity')::int;
    if v_qty <= 0 then
      raise exception 'Invalid quantity for item %', v_item->>'product_id' using errcode = 'P0001';
    end if;

    select i.product_id, i.quantity, p.name, p.selling_price, p.is_active
      into v_inv
      from public.inventory i
      join public.products  p on p.id = i.product_id
     where i.product_id = (v_item->>'product_id')::uuid
     for update;

    if not found then
      raise exception 'Product not found: %', v_item->>'product_id' using errcode = 'P0002';
    end if;
    if not v_inv.is_active then
      raise exception 'Product unavailable: %', v_inv.name using errcode = 'P0002';
    end if;
    if v_inv.quantity < v_qty then
      raise exception 'Insufficient stock for %: have %, need %',
        v_inv.name, v_inv.quantity, v_qty using errcode = 'P0003';
    end if;

    v_subtotal := v_subtotal + (v_inv.selling_price * v_qty);
  end loop;

  -- 2. Bundle discount: 10% if 3+ distinct products
  select count(distinct (item->>'product_id'))
    into v_distinct
    from jsonb_array_elements(p_cart_items) as item;
  if v_distinct >= 3 then
    v_bundle_discount := round(v_subtotal * 0.10, 2);
  end if;
  v_total := v_subtotal - v_bundle_discount;

  -- 3. Upsert customer (keyed by phone)
  insert into public.customers (phone, name, city, address, order_count, lifetime_value)
    values (p_customer_phone, p_customer_name, p_customer_city, p_customer_address, 1, v_total)
    on conflict (phone) do update
      set last_seen      = now(),
          name           = excluded.name,
          city           = excluded.city,
          address        = excluded.address,
          order_count    = public.customers.order_count + 1,
          lifetime_value = public.customers.lifetime_value + v_total
    returning id into v_customer_id;

  -- 4. Insert order
  insert into public.orders (
    short_code, customer_id, customer_name, customer_phone,
    customer_address, customer_city, payment, notes,
    subtotal, bundle_discount, total
  ) values (
    p_short_code, v_customer_id, p_customer_name, p_customer_phone,
    p_customer_address, p_customer_city, p_payment, p_notes,
    v_subtotal, v_bundle_discount, v_total
  ) returning id into v_order_id;

  -- 5. Insert line items + decrement inventory
  for v_item in select * from jsonb_array_elements(p_cart_items)
  loop
    v_qty := (v_item->>'quantity')::int;

    insert into public.order_items (
      order_id, product_id, product_name, product_sku,
      quantity, price_at_sale, line_total
    )
    select v_order_id,
           p.id,
           p.name,
           p.sku,
           v_qty,
           p.selling_price,
           p.selling_price * v_qty
      from public.products p
     where p.id = (v_item->>'product_id')::uuid;

    update public.inventory
       set quantity = quantity - v_qty
     where product_id = (v_item->>'product_id')::uuid;
  end loop;

  return query select v_order_id, p_short_code, v_total;
end;
$$;

-- Allow anonymous + authenticated callers to invoke
grant execute on function public.create_order(
  text, text, text, text, payment_method, text, text, jsonb
) to anon, authenticated;
