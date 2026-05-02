-- =============================================================================
-- Analytics views — feed the admin dashboard.
-- Plain views (not materialized) — promote when orders > ~100k rows.
-- =============================================================================

-- ---------- Per-product performance ------------------------------------------
create or replace view public.v_product_performance as
select
  p.id,
  p.name,
  p.category,
  p.sku,
  coalesce(sum(oi.quantity), 0)::int    as units_sold,
  coalesce(sum(oi.line_total), 0)::numeric(12,2) as revenue,
  coalesce(sum(oi.quantity * (p.selling_price - p.cost_price)), 0)::numeric(12,2) as gross_profit,
  i.quantity                            as stock_on_hand,
  (i.quantity <= i.low_stock_threshold) as is_low_stock
from public.products p
left join public.order_items oi on oi.product_id = p.id
left join public.orders o on o.id = oi.order_id and o.status in ('confirmed','completed')
left join public.inventory i on i.product_id = p.id
group by p.id, p.name, p.category, p.sku, i.quantity, i.low_stock_threshold;

-- ---------- Weekly revenue (rolling 12 weeks) --------------------------------
create or replace view public.v_weekly_revenue as
select
  date_trunc('week', created_at)                          as week_start,
  count(*)                                                as order_count,
  sum(total)::numeric(12,2)                               as revenue,
  sum(case when status = 'cancelled' then 1 else 0 end)   as cancelled_count
from public.orders
where created_at >= now() - interval '12 weeks'
group by 1
order by 1 desc;

-- ---------- Customer metrics -------------------------------------------------
create or replace view public.v_customer_metrics as
select
  count(*)                                                          as total_customers,
  count(*) filter (where order_count >= 2)                          as repeat_customers,
  round(
    100.0 * count(*) filter (where order_count >= 2) / nullif(count(*), 0),
    1
  )                                                                  as repeat_rate_pct,
  coalesce(avg(lifetime_value), 0)::numeric(10,2)                   as avg_lifetime_value
from public.customers;

-- ---------- Slow movers (in stock 30+ days, < 3 sales last 30d) --------------
create or replace view public.v_slow_movers as
select
  p.id, p.name, p.category, i.quantity as stock,
  coalesce(sum(oi.quantity), 0)::int as units_sold_30d,
  p.created_at
from public.products p
join public.inventory i on i.product_id = p.id
left join public.order_items oi on oi.product_id = p.id
left join public.orders o on o.id = oi.order_id
  and o.created_at >= now() - interval '30 days'
  and o.status in ('confirmed','completed')
where p.is_active and i.quantity > 0
  and p.created_at <= now() - interval '30 days'
group by p.id, p.name, p.category, i.quantity, p.created_at
having coalesce(sum(oi.quantity), 0) < 3
order by units_sold_30d asc, i.quantity desc;

-- ---------- Permissions ------------------------------------------------------
-- Views inherit RLS from underlying tables, but we still need select grants.
grant select on public.v_product_performance to authenticated;
grant select on public.v_weekly_revenue       to authenticated;
grant select on public.v_customer_metrics     to authenticated;
grant select on public.v_slow_movers          to authenticated;
