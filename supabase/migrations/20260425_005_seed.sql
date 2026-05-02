-- =============================================================================
-- Seed catalog — mirrors src/lib/seed/products.seed.ts so storefront looks
-- identical after the adapter switch. IDs preserved.
-- Idempotent: re-running is a no-op (on conflict do nothing).
-- =============================================================================

with seeds (id, slug, name, category, brand, device_type, compatibility,
            description, bullets, image_url, cost_price, selling_price,
            compare_at_price, condition, storage, tags, is_best_seller, stock) as (
  values
    ('p_001'::text, 'iphone-13-pro-128gb-a',  'iPhone 13 Pro',         'iPhone',  'Apple', 'iPhone',  '{}'::text[],
     '', array['Battery health 90%+','Unlocked, all carriers','27-point inspection'], '/placeholder.svg',
     520.00, 749.00, 999.00,  'A',  '128GB', '{}'::text[], true, 4),

    ('p_002', 'iphone-13-pro-256gb-a', 'iPhone 13 Pro',     'iPhone', 'Apple', 'iPhone', '{}'::text[],
     '', '{}'::text[], '/placeholder.svg',
     580.00, 829.00, 1099.00, 'A', '256GB', '{}'::text[], false, 3),

    ('p_003', 'iphone-13-pro-max-256gb-b', 'iPhone 13 Pro Max', 'iPhone', 'Apple', 'iPhone', '{}'::text[],
     '', '{}'::text[], '/placeholder.svg',
     610.00, 879.00, 1199.00, 'B', '256GB', '{}'::text[], false, 2),

    ('p_004', 'iphone-14-pro-128gb-a', 'iPhone 14 Pro',     'iPhone', 'Apple', 'iPhone', '{}'::text[],
     '', '{}'::text[], '/placeholder.svg',
     680.00, 949.07, 1199.00, 'A', '128GB', '{}'::text[], true, 5),

    ('p_005', 'iphone-14-pro-max-256gb-a', 'iPhone 14 Pro Max', 'iPhone', 'Apple', 'iPhone', '{}'::text[],
     '', '{}'::text[], '/placeholder.svg',
     820.00, 1149.00, 1499.00, 'A', '256GB', '{}'::text[], false, 1),

    ('p_006', 'iphone-12-64gb-c', 'iPhone 12', 'iPhone', 'Apple', 'iPhone', '{}'::text[],
     '', '{}'::text[], '/placeholder.svg',
     280.00, 399.00, 699.00,  'C', '64GB',  '{}'::text[], false, 6),

    ('p_007', 'apple-20w-usb-c-charger-new', 'Apple 20W USB-C Charger', 'Chargers', 'Apple', 'Universal',
     array['iPhone 12','iPhone 13','iPhone 14','iPhone 15'],
     '', array['Fast charge','USB-C output','Apple-original'], '/placeholder.svg',
     12.00, 19.00, null, 'New', null, '{}'::text[], true, 19),

    ('p_008', 'lightning-cable-1m-new', 'Lightning Cable 1m', 'Cables', 'Apple', 'Universal',
     array['iPhone 12','iPhone 13','iPhone 14'],
     '', '{}'::text[], '/placeholder.svg',
     6.00, 12.00, null, 'New', null, '{}'::text[], false, 40),

    ('p_009', 'airpods-pro-2nd-gen-a', 'AirPods Pro (2nd gen)', 'Audio', 'Apple', 'iPhone', '{}'::text[],
     '', array['Active noise cancellation','MagSafe charging case'], '/placeholder.svg',
     140.00, 199.00, 249.00, 'A', null, '{}'::text[], true, 8),

    ('p_a4651fb5', 'iphone-17-pro-max-2tb-a', 'iPhone 17 Pro Max', 'iPhone', 'Apple', 'iPhone', '{}'::text[],
     '', '{}'::text[], '/Apple-iPhone-13-Pro-Unlocked.png',
     1100.00, 1400.00, 1799.00, 'A', '2TB', '{}'::text[], false, 4)
)
insert into public.products (
  id, slug, name, category, brand, device_type, compatibility,
  description, bullets, image_url, images, cost_price, selling_price,
  compare_at_price, currency, condition, storage, tags, is_best_seller, is_active
)
select
  uuid_generate_v4(),  -- new UUID; we'll join by slug below
  s.slug, s.name, s.category, s.brand, s.device_type, s.compatibility,
  s.description, s.bullets, s.image_url,
  jsonb_build_array(jsonb_build_object('url', s.image_url, 'alt', s.name)),
  s.cost_price, s.selling_price, s.compare_at_price, 'USD',
  s.condition, s.storage, s.tags, s.is_best_seller, true
from seeds s
on conflict (slug) do nothing;

-- Inventory rows for any product without one
insert into public.inventory (product_id, quantity, low_stock_threshold)
select p.id, s.stock, 3
from public.products p
join (
  values
    ('iphone-13-pro-128gb-a', 4),
    ('iphone-13-pro-256gb-a', 3),
    ('iphone-13-pro-max-256gb-b', 2),
    ('iphone-14-pro-128gb-a', 5),
    ('iphone-14-pro-max-256gb-a', 1),
    ('iphone-12-64gb-c', 6),
    ('apple-20w-usb-c-charger-new', 19),
    ('lightning-cable-1m-new', 40),
    ('airpods-pro-2nd-gen-a', 8),
    ('iphone-17-pro-max-2tb-a', 4)
) as s(slug, stock) on s.slug = p.slug
on conflict (product_id) do nothing;
