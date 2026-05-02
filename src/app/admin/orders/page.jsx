'use client';

import { useEffect, useState } from 'react';
import { orderService } from '@/services/orderService';
import { formatPrice } from '@/lib/money';

const STATUSES = ['pending', 'confirmed', 'completed', 'cancelled'];

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  async function load() {
    setLoading(true);
    setOrders(await orderService.listAll());
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function setStatus(id, status) {
    await orderService.updateStatus(id, status);
    load();
  }

  const visible = filter === 'all' ? orders : orders.filter((o) => o.status === filter);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <span className="eyebrow">Operations</span>
          <h1 className="mt-1 text-3xl font-extrabold">Orders</h1>
        </div>
        <div className="flex gap-2">
          {['all', ...STATUSES].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-widest ${
                filter === s ? 'bg-ink-900 text-white' : 'bg-cream text-ink-600 hover:text-ink-900'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-ink-400">Loading orders…</div>
      ) : visible.length === 0 ? (
        <div className="card p-10 text-center text-ink-400">No orders match this filter.</div>
      ) : (
        <div className="card-elev overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-cream text-xs uppercase tracking-widest text-ink-400">
              <tr>
                <th className="p-3 text-left">Code</th>
                <th className="p-3 text-left">Customer</th>
                <th className="p-3 text-left">Items</th>
                <th className="p-3 text-right">Total</th>
                <th className="p-3 text-left">Status</th>
                <th className="p-3 text-left">Created</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((o) => (
                <tr key={o.id} className="border-t border-ink-100 hover:bg-cream/40">
                  <td className="p-3 font-mono text-xs">{o.shortCode}</td>
                  <td className="p-3">
                    <div className="font-semibold">{o.customer.name}</div>
                    <div className="text-xs text-ink-400">{o.customer.phone}</div>
                  </td>
                  <td className="p-3 text-ink-700">
                    {o.totals.itemCount} item{o.totals.itemCount !== 1 ? 's' : ''}
                  </td>
                  <td className="p-3 text-right font-semibold text-gold-700">
                    {formatPrice(o.totals.total)}
                  </td>
                  <td className="p-3">
                    <StatusBadge status={o.status} />
                  </td>
                  <td className="p-3 text-xs text-ink-500">
                    {new Date(o.createdAt).toLocaleString()}
                  </td>
                  <td className="p-3 text-right">
                    <select
                      value={o.status}
                      onChange={(e) => setStatus(o.id, e.target.value)}
                      className="input py-1 text-xs"
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }) {
  const cls = {
    pending:   'bg-amber-50 text-amber-800 ring-amber-200',
    confirmed: 'bg-sky-50 text-sky-800 ring-sky-200',
    completed: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
    cancelled: 'bg-rose-50 text-rose-800 ring-rose-200',
  }[status] ?? 'bg-ink-50 text-ink-700 ring-ink-200';
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest ring-1 ${cls}`}>
      {status}
    </span>
  );
}
