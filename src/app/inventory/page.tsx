'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Search, RefreshCw, Loader2, TrendingDown, AlertTriangle, CheckCircle2 } from 'lucide-react';

type StockStatus = 'in_stock' | 'low_stock' | 'out_of_stock';

const STATUS_CONFIG: Record<StockStatus, { badge: string; label: string; icon: typeof AlertTriangle }> = {
  in_stock:      { badge: 'badge-green', label: 'In Stock',     icon: CheckCircle2 },
  low_stock:     { badge: 'badge-amber', label: 'Low Stock',    icon: AlertTriangle },
  out_of_stock:  { badge: 'badge-red',   label: 'Out of Stock', icon: TrendingDown },
};

type ChangeType = 'restock' | 'adjustment' | 'correction';

const CHANGE_TYPES: ChangeType[] = ['restock', 'adjustment', 'correction'];

export default function InventoryPage() {
  const qc = useQueryClient();
  const [q, setQ] = useState('');
  const [filterStatus, setFilterStatus] = useState<StockStatus | 'all'>('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newQty, setNewQty] = useState('');
  const [changeType, setChangeType] = useState<ChangeType>('adjustment');
  const [note, setNote] = useState('');

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['inventory', 'list'],
    queryFn: () => fetch('/api/inventory').then((r) => r.json()),
    refetchInterval: 60_000,
  });

  const updateMutation = useMutation({
    mutationFn: async ({ productId, newQuantity }: { productId: string; newQuantity: number }) => {
      const res = await fetch('/api/inventory', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, newQuantity, changeType, note }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? 'Update failed');
      return res.json();
    },
    onSuccess: (data) => {
      const delta = data.delta;
      toast.success(`Stock updated (${delta >= 0 ? '+' : ''}${delta} units)`);
      qc.invalidateQueries({ queryKey: ['inventory'] });
      setEditingId(null);
      setNewQty('');
      setNote('');
      setChangeType('adjustment');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const items = data?.items ?? [];

  const filtered = items.filter((item: any) => {
    if (filterStatus !== 'all' && item.stockStatus !== filterStatus) return false;
    if (q) {
      const lower = q.toLowerCase();
      return (
        item.name?.toLowerCase().includes(lower) ||
        item.sku?.toLowerCase().includes(lower) ||
        item.category?.toLowerCase().includes(lower)
      );
    }
    return true;
  });

  const summary = {
    total: items.length,
    inStock: items.filter((i: any) => i.stockStatus === 'in_stock').length,
    lowStock: items.filter((i: any) => i.stockStatus === 'low_stock').length,
    outOfStock: items.filter((i: any) => i.stockStatus === 'out_of_stock').length,
  };

  function startEdit(item: any) {
    setEditingId(item.id);
    setNewQty(String(item.stock));
    setNote('');
    setChangeType('adjustment');
  }

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-charcoal-900">Inventory</h1>
          <p className="mt-0.5 text-sm text-charcoal-500">Source of truth for stock levels</p>
        </div>
        <button
          onClick={() => refetch()}
          className="btn-secondary-sm flex items-center gap-1.5"
        >
          <RefreshCw size={13} />
          Refresh
        </button>
      </div>

      {/* Summary cards */}
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: 'Total SKUs', value: summary.total,      color: 'text-charcoal-900' },
          { label: 'In Stock',   value: summary.inStock,    color: 'text-emerald-700' },
          { label: 'Low Stock',  value: summary.lowStock,   color: 'text-amber-600' },
          { label: 'Out of Stock', value: summary.outOfStock, color: 'text-red-600' },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-xl border border-charcoal-100 bg-white px-4 py-3 shadow-card">
            <p className="text-xs font-medium text-charcoal-400">{label}</p>
            <p className={`mt-0.5 text-xl font-extrabold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-charcoal-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by name, SKU…"
            className="input-sm pl-9"
          />
        </div>
        <div className="flex gap-1.5">
          {(['all', 'in_stock', 'low_stock', 'out_of_stock'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`chip ${filterStatus === s ? 'chip-active' : ''}`}
            >
              {s === 'all' ? 'All' : s.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Inventory table */}
      <div className="rounded-2xl border border-charcoal-100 bg-white shadow-card overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-sm text-charcoal-400">Loading inventory…</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-sm text-charcoal-400">No items match your filters.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead>
                <tr className="border-b border-charcoal-100 bg-charcoal-50">
                  <th className="table-header px-5 py-3">Product</th>
                  <th className="table-header px-5 py-3">SKU</th>
                  <th className="table-header px-5 py-3">Category</th>
                  <th className="table-header px-5 py-3">Stock</th>
                  <th className="table-header px-5 py-3">Status</th>
                  <th className="table-header px-5 py-3">Last Updated</th>
                  <th className="table-header px-5 py-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item: any) => {
                  const config = STATUS_CONFIG[item.stockStatus as StockStatus] ?? STATUS_CONFIG.in_stock;
                  const isEditing = editingId === item.id;

                  return (
                    <tr key={item.id} className={`border-b border-charcoal-100 transition ${item.stockStatus === 'out_of_stock' ? 'bg-red-50/30' : item.stockStatus === 'low_stock' ? 'bg-amber-50/30' : ''}`}>
                      <td className="table-cell px-5 font-semibold text-charcoal-900">{item.name}</td>
                      <td className="table-cell px-5 font-mono text-xs text-charcoal-500">{item.sku}</td>
                      <td className="table-cell px-5 text-charcoal-500">{item.category}</td>
                      <td className="table-cell px-5">
                        <span className="text-base font-extrabold text-charcoal-900">{item.stock}</span>
                        <span className="ml-1 text-xs text-charcoal-400">/ {item.lowStockThreshold} min</span>
                      </td>
                      <td className="table-cell px-5">
                        <span className={`badge ${config.badge}`}>{config.label}</span>
                      </td>
                      <td className="table-cell px-5 text-xs text-charcoal-400">
                        {new Date(item.updatedAt).toLocaleDateString()}
                      </td>
                      <td className="table-cell px-5">
                        {isEditing ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              min="0"
                              value={newQty}
                              onChange={(e) => setNewQty(e.target.value)}
                              className="input-sm w-20"
                              autoFocus
                            />
                            <select
                              value={changeType}
                              onChange={(e) => setChangeType(e.target.value as ChangeType)}
                              className="input-sm w-28"
                            >
                              {CHANGE_TYPES.map((t) => <option key={t}>{t}</option>)}
                            </select>
                            <button
                              onClick={() =>
                                updateMutation.mutate({
                                  productId: item.id,
                                  newQuantity: Number(newQty),
                                })
                              }
                              disabled={updateMutation.isPending || newQty === ''}
                              className="btn-primary-sm gap-1"
                            >
                              {updateMutation.isPending ? <Loader2 size={12} className="animate-spin" /> : 'Save'}
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="btn-secondary-sm"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => startEdit(item)}
                            className="btn-secondary-sm"
                          >
                            Update Stock
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
