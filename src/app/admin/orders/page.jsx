'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ChevronDown, ChevronUp, Search } from 'lucide-react';
import { formatPrice } from '@/lib/money';

const STATUSES = ['all', 'pending', 'confirmed', 'completed', 'cancelled'];

const STATUS_BADGE = {
  pending:   'badge-amber',
  confirmed: 'badge-blue',
  completed: 'badge-green',
  cancelled: 'badge-red',
};

const STATUS_NEXT = {
  pending:   ['confirmed', 'cancelled'],
  confirmed: ['completed', 'cancelled'],
  completed: [],
  cancelled: [],
};

// Add order status update API route
async function updateOrderStatus(id, status) {
  const res = await fetch(`/api/orders/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error((await res.json()).error ?? 'Update failed');
  return res.json();
}

export default function AdminOrdersPage() {
  const qc = useQueryClient();
  const [filterStatus, setFilterStatus] = useState('all');
  const [q, setQ] = useState('');
  const [expanded, setExpanded] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'orders'],
    queryFn: () => fetch('/api/orders').then((r) => r.json()),
    refetchInterval: 30_000,
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }) => updateOrderStatus(id, status),
    onSuccess: (_, { status }) => {
      toast.success(`Order marked as ${status}`);
      qc.invalidateQueries({ queryKey: ['admin', 'orders'] });
    },
    onError: (err) => toast.error(err.message),
  });

  const orders = (data?.orders ?? []).filter((o) => {
    if (filterStatus !== 'all' && o.status !== filterStatus) return false;
    if (q) {
      const lower = q.toLowerCase();
      return (
        o.shortCode?.toLowerCase().includes(lower) ||
        o.customer?.name?.toLowerCase().includes(lower) ||
        o.customer?.phone?.includes(lower)
      );
    }
    return true;
  });

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-charcoal-900">Orders</h1>
        <p className="mt-0.5 text-sm text-charcoal-500">{orders.length} orders</p>
      </div>

      {/* Filters */}
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="relative max-w-xs flex-1">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-charcoal-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by ref, name, phone…"
            className="input-sm pl-9"
          />
        </div>
        <div className="flex gap-1.5">
          {STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`chip ${filterStatus === s ? 'chip-active' : ''}`}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Orders list */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="rounded-2xl border border-charcoal-100 bg-white p-12 text-center text-sm text-charcoal-400">
            Loading orders…
          </div>
        ) : orders.length === 0 ? (
          <div className="rounded-2xl border border-charcoal-100 bg-white p-12 text-center text-sm text-charcoal-400">
            No orders found.
          </div>
        ) : (
          orders.map((order) => {
            const isOpen = expanded === order.id;
            const nextStatuses = STATUS_NEXT[order.status] ?? [];

            return (
              <div key={order.id} className="rounded-2xl border border-charcoal-100 bg-white shadow-card overflow-hidden">
                {/* Header row */}
                <div
                  className="flex cursor-pointer items-center gap-4 px-5 py-4 hover:bg-charcoal-50 transition"
                  onClick={() => setExpanded(isOpen ? null : order.id)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="font-mono text-sm font-bold text-charcoal-900">
                        {order.shortCode ?? order.id?.slice(0, 8)}
                      </span>
                      <span className={`badge ${STATUS_BADGE[order.status] ?? 'badge-gray'}`}>
                        {order.status}
                      </span>
                    </div>
                    <p className="mt-0.5 text-sm text-charcoal-500">
                      {order.customer?.name} · {order.customer?.phone}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm font-extrabold text-charcoal-900">
                        {formatPrice(order.totals?.total ?? 0, 'USD')}
                      </p>
                      <p className="text-xs text-charcoal-400">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    {isOpen ? <ChevronUp size={16} className="text-charcoal-400" /> : <ChevronDown size={16} className="text-charcoal-400" />}
                  </div>
                </div>

                {/* Expanded detail */}
                {isOpen && (
                  <div className="border-t border-charcoal-100 p-5 animate-fade-in">
                    <div className="grid gap-6 md:grid-cols-2">
                      {/* Customer info */}
                      <div>
                        <p className="label mb-2">Customer Details</p>
                        <div className="space-y-1 text-sm">
                          {[
                            ['Name', order.customer?.name],
                            ['Phone', order.customer?.phone],
                            ['Email', order.customer?.email],
                            ['Address', order.customer?.address],
                            ...(order.customer?.notes ? [['Notes', order.customer.notes]] : []),
                          ].map(([k, v]) => (
                            <div key={k} className="flex gap-2">
                              <span className="w-16 flex-shrink-0 text-charcoal-400">{k}</span>
                              <span className="text-charcoal-800">{v}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Items */}
                      <div>
                        <p className="label mb-2">Order Items</p>
                        <div className="space-y-1.5">
                          {order.items?.map((item, i) => (
                            <div key={i} className="flex items-center justify-between text-sm">
                              <span className="text-charcoal-700">{item.name} <span className="text-charcoal-400">× {item.quantity}</span></span>
                              <span className="font-semibold">{formatPrice((item.price ?? item.unitPrice ?? 0) * item.quantity, 'USD')}</span>
                            </div>
                          ))}
                          <div className="border-t border-charcoal-100 pt-1.5 flex justify-between font-bold text-sm">
                            <span>Total</span>
                            <span>{formatPrice(order.totals?.total ?? 0, 'USD')}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Status actions */}
                    {nextStatuses.length > 0 && (
                      <div className="mt-4 flex items-center gap-3">
                        <span className="text-xs text-charcoal-500">Update status:</span>
                        {nextStatuses.map((s) => (
                          <button
                            key={s}
                            onClick={() => statusMutation.mutate({ id: order.id, status: s })}
                            disabled={statusMutation.isPending}
                            className="btn-secondary-sm capitalize"
                          >
                            Mark {s}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
