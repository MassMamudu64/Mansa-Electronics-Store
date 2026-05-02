'use client';

import { useQuery } from '@tanstack/react-query';
import { RefreshCw } from 'lucide-react';

const CHANGE_TYPE_BADGE: Record<string, string> = {
  restock:    'badge-green',
  deduction:  'badge-red',
  adjustment: 'badge-blue',
  correction: 'badge-gray',
};

export default function InventoryHistoryPage() {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['inventory', 'history'],
    queryFn: async () => {
      const res = await fetch('/api/inventory/history');
      if (!res.ok) return { changes: [] };
      return res.json();
    },
    refetchInterval: 60_000,
  });

  const changes = data?.changes ?? [];

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-charcoal-900">Stock History</h1>
          <p className="mt-0.5 text-sm text-charcoal-500">
            Every stock update — {changes.length} recorded changes
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="btn-secondary-sm flex items-center gap-1.5"
        >
          <RefreshCw size={13} />
          Refresh
        </button>
      </div>

      <div className="rounded-2xl border border-charcoal-100 bg-white shadow-card overflow-hidden">
        {isLoading ? (
          <p className="p-12 text-center text-sm text-charcoal-400">Loading history…</p>
        ) : changes.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-sm text-charcoal-400">No stock changes recorded yet.</p>
            <p className="mt-1 text-xs text-charcoal-300">
              Changes appear here after you update stock in the Inventory page.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead>
                <tr className="border-b border-charcoal-100 bg-charcoal-50">
                  <th className="table-header px-5 py-3">Date</th>
                  <th className="table-header px-5 py-3">Product</th>
                  <th className="table-header px-5 py-3">SKU</th>
                  <th className="table-header px-5 py-3">Type</th>
                  <th className="table-header px-5 py-3">Before</th>
                  <th className="table-header px-5 py-3">After</th>
                  <th className="table-header px-5 py-3">Change</th>
                  <th className="table-header px-5 py-3">Note</th>
                </tr>
              </thead>
              <tbody>
                {changes.map((c: any) => (
                  <tr key={c.id} className="table-row">
                    <td className="table-cell px-5 text-xs text-charcoal-400">
                      {new Date(c.createdAt).toLocaleString('en-US', {
                        dateStyle: 'short',
                        timeStyle: 'short',
                      })}
                    </td>
                    <td className="table-cell px-5 font-medium text-charcoal-900">{c.productName}</td>
                    <td className="table-cell px-5 font-mono text-xs text-charcoal-500">{c.sku}</td>
                    <td className="table-cell px-5">
                      <span className={`badge ${CHANGE_TYPE_BADGE[c.changeType] ?? 'badge-gray'}`}>
                        {c.changeType}
                      </span>
                    </td>
                    <td className="table-cell px-5 text-charcoal-500">{c.quantityBefore}</td>
                    <td className="table-cell px-5 font-semibold text-charcoal-900">{c.quantityAfter}</td>
                    <td className="table-cell px-5">
                      <span
                        className={`font-bold ${
                          c.delta > 0 ? 'text-emerald-600' : c.delta < 0 ? 'text-red-600' : 'text-charcoal-400'
                        }`}
                      >
                        {c.delta > 0 ? '+' : ''}{c.delta}
                      </span>
                    </td>
                    <td className="table-cell px-5 text-xs text-charcoal-400">{c.note ?? '—'}</td>
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
