'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Package, ShoppingCart, AlertTriangle, ArrowRight, TrendingUp } from 'lucide-react';
import { formatPrice } from '@/lib/money';

const STATUS_BADGE = {
  pending:   'badge-amber',
  confirmed: 'badge-blue',
  completed: 'badge-green',
  cancelled: 'badge-red',
};

export default function AdminDashboard() {
  const { data: productsData } = useQuery({
    queryKey: ['admin', 'products'],
    queryFn: () => fetch('/api/products').then((r) => r.json()),
  });

  const { data: ordersData } = useQuery({
    queryKey: ['admin', 'orders'],
    queryFn: () => fetch('/api/orders').then((r) => r.json()),
  });

  const products = productsData?.products ?? [];
  const orders = ordersData?.orders ?? [];

  const lowStock = products.filter((p) => (p.stock ?? 0) > 0 && (p.stock ?? 0) <= (p.lowStockThreshold ?? 3)).length;
  const outOfStock = products.filter((p) => (p.stock ?? 0) <= 0).length;
  const pendingOrders = orders.filter((o) => o.status === 'pending').length;
  const revenue = orders.filter((o) => o.status !== 'cancelled').reduce((s, o) => s + (o.totals?.total ?? 0), 0);

  const STATS = [
    { label: 'Products',     value: products.length, sub: `${outOfStock} out of stock`, icon: Package,      href: '/admin/products', alert: outOfStock > 0 },
    { label: 'Orders',       value: orders.length,   sub: `${pendingOrders} pending`,   icon: ShoppingCart, href: '/admin/orders',   alert: pendingOrders > 0 },
    { label: 'Revenue',      value: formatPrice(revenue, 'USD'), sub: 'All confirmed orders', icon: TrendingUp, href: '/admin/orders' },
    { label: 'Low Stock',    value: lowStock,         sub: 'Need restocking',            icon: AlertTriangle, href: '/inventory',     alert: lowStock > 0 },
  ];

  return (
    <div className="p-6 md:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-black text-charcoal-900">Dashboard</h1>
        <p className="mt-1 text-sm text-charcoal-500">Commerce overview — Mansa Electronics</p>
      </div>

      {/* Stats */}
      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {STATS.map(({ label, value, sub, icon: Icon, href, alert }) => (
          <Link key={label} href={href}
            className="group rounded-2xl border border-charcoal-100 bg-white p-5 shadow-card transition hover:border-charcoal-300 hover:shadow-card-lg"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-charcoal-400">{label}</p>
                <p className={`mt-1.5 text-2xl font-extrabold ${alert ? 'text-amber-600' : 'text-charcoal-900'}`}>
                  {String(value)}
                </p>
                <p className="mt-0.5 text-xs text-charcoal-400">{sub}</p>
              </div>
              <div className={`rounded-xl p-2.5 ${alert ? 'bg-amber-50' : 'bg-charcoal-50'}`}>
                <Icon size={18} className={alert ? 'text-amber-500' : 'text-charcoal-400'} />
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Recent orders */}
      <div className="rounded-2xl border border-charcoal-100 bg-white shadow-card">
        <div className="flex items-center justify-between border-b border-charcoal-100 px-6 py-4">
          <h2 className="text-sm font-bold text-charcoal-900">Recent Orders</h2>
          <Link href="/admin/orders" className="flex items-center gap-1 text-xs font-semibold text-charcoal-500 hover:text-charcoal-900">
            View all <ArrowRight size={12} />
          </Link>
        </div>
        {orders.length === 0 ? (
          <p className="py-12 text-center text-sm text-charcoal-400">No orders yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr className="border-b border-charcoal-100 bg-charcoal-50">
                  <th className="table-header px-6 py-3">Ref</th>
                  <th className="table-header px-6 py-3">Customer</th>
                  <th className="table-header px-6 py-3">Total</th>
                  <th className="table-header px-6 py-3">Status</th>
                  <th className="table-header px-6 py-3">Date</th>
                </tr>
              </thead>
              <tbody>
                {orders.slice(0, 8).map((o) => (
                  <tr key={o.id} className="table-row">
                    <td className="table-cell px-6 font-mono text-xs text-charcoal-500">
                      {o.shortCode ?? o.id?.slice(0, 8)}
                    </td>
                    <td className="table-cell px-6">
                      <p className="font-medium">{o.customer?.name}</p>
                      <p className="text-xs text-charcoal-400">{o.customer?.phone}</p>
                    </td>
                    <td className="table-cell px-6 font-semibold">
                      {formatPrice(o.totals?.total ?? 0, 'USD')}
                    </td>
                    <td className="table-cell px-6">
                      <span className={`badge ${STATUS_BADGE[o.status] ?? 'badge-gray'}`}>{o.status}</span>
                    </td>
                    <td className="table-cell px-6 text-charcoal-400 text-xs">
                      {new Date(o.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
