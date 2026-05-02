'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { analyticsService } from '@/services/analyticsService';
import { formatPrice } from '@/lib/money';

export default function AnalyticsPage() {
  const [overview, setOverview] = useState(null);
  const [performance, setPerformance] = useState([]);
  const [trend, setTrend] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const supabaseConfigured = !!process.env.NEXT_PUBLIC_SUPABASE_URL;

  useEffect(() => {
    if (!supabaseConfigured) { setLoading(false); return; }
    Promise.all([
      analyticsService.overview(),
      analyticsService.productPerformance(),
      analyticsService.revenueTrend(),
    ])
      .then(([o, p, t]) => {
        setOverview(o);
        setPerformance(p);
        setTrend(t);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [supabaseConfigured]);

  if (!supabaseConfigured) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <h1 className="text-2xl font-extrabold">Analytics requires Supabase</h1>
        <p className="mt-2 text-sm text-ink-500">
          Add <code className="rounded bg-cream px-1.5 py-0.5">NEXT_PUBLIC_SUPABASE_URL</code> and
          <code className="ml-1 rounded bg-cream px-1.5 py-0.5">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> to
          your <code className="rounded bg-cream px-1.5 py-0.5">.env.local</code>, then apply the
          migrations in <code className="rounded bg-cream px-1.5 py-0.5">supabase/migrations/</code>.
        </p>
        <Link href="/admin" className="btn-primary mt-6 inline-flex">Back to inventory</Link>
      </div>
    );
  }

  if (loading) return <div className="mx-auto max-w-7xl px-4 py-10 text-ink-400">Loading…</div>;
  if (error) return <div className="mx-auto max-w-7xl px-4 py-10 text-rose-700">Error: {error}</div>;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <div className="mb-8">
        <span className="eyebrow">Performance</span>
        <h1 className="mt-1 text-3xl font-extrabold">Analytics</h1>
      </div>

      <div className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Revenue this week" value={formatPrice(overview.revenueThisWeek)} />
        <Kpi label="Orders this week" value={overview.ordersThisWeek} />
        <Kpi label="Repeat customer rate" value={`${overview.repeatRate}%`} />
        <Kpi label="Avg lifetime value" value={formatPrice(overview.avgLifetimeValue)} />
      </div>

      <section className="card-elev mb-8 p-5">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-ink-500">
          Top products by revenue
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs uppercase tracking-widest text-ink-400">
              <tr className="border-b border-ink-100">
                <th className="p-2 text-left">Product</th>
                <th className="p-2 text-left">Category</th>
                <th className="p-2 text-right">Units</th>
                <th className="p-2 text-right">Revenue</th>
                <th className="p-2 text-right">Gross profit</th>
                <th className="p-2 text-right">Stock</th>
              </tr>
            </thead>
            <tbody>
              {performance.map((p) => (
                <tr key={p.id} className="border-t border-ink-100">
                  <td className="p-2 font-semibold">{p.name}</td>
                  <td className="p-2 text-ink-600">{p.category}</td>
                  <td className="p-2 text-right">{p.units_sold}</td>
                  <td className="p-2 text-right text-gold-700 font-semibold">{formatPrice(Number(p.revenue))}</td>
                  <td className="p-2 text-right">{formatPrice(Number(p.gross_profit))}</td>
                  <td className={`p-2 text-right ${p.is_low_stock ? 'text-amber-700 font-semibold' : ''}`}>
                    {p.stock_on_hand ?? '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card-elev p-5">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-ink-500">
          Revenue (last 12 weeks)
        </h2>
        <ul className="divide-y divide-ink-100 text-sm">
          {trend.map((w) => (
            <li key={w.week_start} className="flex items-center justify-between py-2">
              <span className="text-ink-600">
                Week of {new Date(w.week_start).toLocaleDateString()}
              </span>
              <span className="font-semibold text-gold-700">{formatPrice(Number(w.revenue))}</span>
              <span className="text-xs text-ink-400">{w.order_count} orders</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function Kpi({ label, value }) {
  return (
    <div className="card p-5">
      <div className="text-[11px] font-semibold uppercase tracking-widest text-ink-400">{label}</div>
      <div className="mt-2 text-2xl font-extrabold text-ink-900">{value}</div>
    </div>
  );
}
