'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, User } from 'lucide-react';
import { formatPrice } from '@/lib/money';

export default function AdminCustomersPage() {
  const [q, setQ] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'orders'],
    queryFn: () => fetch('/api/orders').then((r) => r.json()),
  });

  // Derive customers from order data
  const customers = (() => {
    const orders = data?.orders ?? [];
    const map = new Map();
    for (const order of orders) {
      const key = order.customer?.phone ?? order.customer?.email ?? order.id;
      if (!map.has(key)) {
        map.set(key, {
          name: order.customer?.name ?? '—',
          phone: order.customer?.phone ?? '—',
          email: order.customer?.email ?? '—',
          address: order.customer?.address ?? '—',
          orderCount: 0,
          totalSpend: 0,
          lastOrder: order.createdAt,
        });
      }
      const c = map.get(key);
      c.orderCount += 1;
      c.totalSpend += order.totals?.total ?? 0;
      if (order.createdAt > c.lastOrder) c.lastOrder = order.createdAt;
    }
    return [...map.values()].sort((a, b) => b.totalSpend - a.totalSpend);
  })();

  const filtered = customers.filter((c) => {
    if (!q) return true;
    const lower = q.toLowerCase();
    return (
      c.name.toLowerCase().includes(lower) ||
      c.phone.includes(lower) ||
      c.email.toLowerCase().includes(lower)
    );
  });

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-charcoal-900">Customers</h1>
        <p className="mt-0.5 text-sm text-charcoal-500">{filtered.length} customers from orders</p>
      </div>

      <div className="relative mb-5 max-w-xs">
        <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-charcoal-400" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by name, phone…"
          className="input-sm pl-9"
        />
      </div>

      <div className="rounded-2xl border border-charcoal-100 bg-white shadow-card overflow-hidden">
        {isLoading ? (
          <p className="p-12 text-center text-sm text-charcoal-400">Loading…</p>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <User size={32} className="mx-auto mb-3 text-charcoal-200" />
            <p className="text-sm text-charcoal-400">No customers yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr className="border-b border-charcoal-100 bg-charcoal-50">
                  <th className="table-header px-6 py-3">Name</th>
                  <th className="table-header px-6 py-3">Phone</th>
                  <th className="table-header px-6 py-3">Email</th>
                  <th className="table-header px-6 py-3">Orders</th>
                  <th className="table-header px-6 py-3">Total Spend</th>
                  <th className="table-header px-6 py-3">Last Order</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c, i) => (
                  <tr key={i} className="table-row">
                    <td className="table-cell px-6 font-semibold text-charcoal-900">{c.name}</td>
                    <td className="table-cell px-6 text-charcoal-600">{c.phone}</td>
                    <td className="table-cell px-6 text-charcoal-500">{c.email}</td>
                    <td className="table-cell px-6">
                      <span className="badge badge-gray">{c.orderCount}</span>
                    </td>
                    <td className="table-cell px-6 font-semibold">
                      {formatPrice(c.totalSpend, 'USD')}
                    </td>
                    <td className="table-cell px-6 text-charcoal-400 text-xs">
                      {new Date(c.lastOrder).toLocaleDateString()}
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
