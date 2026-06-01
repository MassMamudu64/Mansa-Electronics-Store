'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ExternalLink, Search } from 'lucide-react';
import { formatPrice } from '@/lib/money';
import PricingTabs from '@/components/admin/PricingTabs';

function timeAgo(iso) {
  if (!iso) return '—';
  const ms = Date.now() - new Date(iso).getTime();
  if (ms < 60_000) return 'just now';
  const mins = Math.floor(ms / 60_000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 48) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function PricingListingsPage() {
  const [q, setQ] = useState('');
  const [condition, setCondition] = useState('');
  const [storage, setStorage] = useState('');
  const [inStockOnly, setInStockOnly] = useState(false);

  // Fetch a generous page of listings; client-side filters narrow it down.
  const listingsQuery = useQuery({
    queryKey: ['admin', 'pricing', 'listings', { inStockOnly }],
    queryFn: () => {
      const params = new URLSearchParams();
      params.set('limit', '500');
      if (inStockOnly) params.set('inStock', 'true');
      return fetch(`/api/pricing?${params}`).then((r) => r.json());
    },
  });

  // Loose-join by sku against products → "matched" badge column.
  const productsQuery = useQuery({
    queryKey: ['admin', 'pricing', 'matched-products'],
    queryFn: () => fetch('/api/products').then((r) => r.json()),
    staleTime: 60_000,
  });

  const listings = listingsQuery.data?.items ?? [];

  const productsBySku = useMemo(() => {
    const map = new Map();
    for (const p of productsQuery.data?.products ?? []) {
      if (p.sku) map.set(p.sku, p);
    }
    return map;
  }, [productsQuery.data]);

  const { availableConditions, availableStorages } = useMemo(() => {
    const c = new Set();
    const s = new Set();
    for (const l of listings) {
      if (l.condition) c.add(l.condition);
      if (l.storage) s.add(l.storage);
    }
    return {
      availableConditions: Array.from(c).sort(),
      availableStorages: Array.from(s).sort(storageSort),
    };
  }, [listings]);

  const filtered = useMemo(() => {
    const lower = q.trim().toLowerCase();
    return listings.filter((l) => {
      if (condition && l.condition !== condition) return false;
      if (storage && l.storage !== storage) return false;
      if (!lower) return true;
      return (
        l.sku?.toLowerCase().includes(lower) ||
        l.name?.toLowerCase().includes(lower) ||
        l.model?.toLowerCase().includes(lower) ||
        l.brand?.toLowerCase().includes(lower)
      );
    });
  }, [listings, q, condition, storage]);

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-charcoal-900">Pricing</h1>
        <p className="mt-0.5 text-sm text-charcoal-500">
          Wholesale listings — {filtered.length} of {listings.length} shown
        </p>
      </div>

      <PricingTabs />

      {/* Toolbar */}
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="relative max-w-xs flex-1">
          <Search
            size={14}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-charcoal-400"
          />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search sku, model, brand…"
            className="input-sm pl-9"
          />
        </div>

        <select
          value={condition}
          onChange={(e) => setCondition(e.target.value)}
          className="input-sm"
        >
          <option value="">All conditions</option>
          {availableConditions.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        <select
          value={storage}
          onChange={(e) => setStorage(e.target.value)}
          className="input-sm"
        >
          <option value="">All storage</option>
          {availableStorages.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        <label className="flex cursor-pointer items-center gap-2 text-sm text-charcoal-600">
          <input
            type="checkbox"
            checked={inStockOnly}
            onChange={(e) => setInStockOnly(e.target.checked)}
            className="h-4 w-4 accent-charcoal-900"
          />
          In stock only
        </label>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-charcoal-100 bg-white shadow-card">
        {listingsQuery.isLoading ? (
          <div className="p-12 text-center text-sm text-charcoal-400">
            Loading listings…
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-sm text-charcoal-400">
            No listings match your filters. Run a sync from the Overview tab
            if the table is empty.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[920px]">
              <thead>
                <tr className="border-b border-charcoal-100 bg-charcoal-50">
                  <th className="table-header px-5 py-3">SKU</th>
                  <th className="table-header px-5 py-3">Name</th>
                  <th className="table-header px-5 py-3">Brand</th>
                  <th className="table-header px-5 py-3">Cond.</th>
                  <th className="table-header px-5 py-3">Storage</th>
                  <th className="table-header px-5 py-3">Wholesale</th>
                  <th className="table-header px-5 py-3">Stock</th>
                  <th className="table-header px-5 py-3">Matched</th>
                  <th className="table-header px-5 py-3">Scraped</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((l) => {
                  const matched = productsBySku.get(l.sku);
                  return (
                    <tr key={l.id} className="table-row">
                      <td className="table-cell px-5 font-mono text-xs text-charcoal-700">
                        {l.sku}
                      </td>
                      <td className="table-cell px-5">
                        <p className="font-semibold text-charcoal-900">
                          {l.name}
                        </p>
                        {l.model && l.model !== l.name && (
                          <p className="text-[11px] text-charcoal-400">
                            {l.model}
                          </p>
                        )}
                      </td>
                      <td className="table-cell px-5 text-charcoal-500">
                        {l.brand ?? '—'}
                      </td>
                      <td className="table-cell px-5">
                        {l.condition ? (
                          <span className="badge badge-gray">{l.condition}</span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="table-cell px-5 text-charcoal-500">
                        {l.storage ?? '—'}
                      </td>
                      <td className="table-cell px-5 font-semibold">
                        {formatPrice(l.wholesalePrice, l.currency ?? 'USD')}
                      </td>
                      <td className="table-cell px-5">
                        {l.inStock ? (
                          <span className="badge badge-green">
                            {l.stockQuantity ?? 'In'}
                          </span>
                        ) : (
                          <span className="badge badge-red">Out</span>
                        )}
                      </td>
                      <td className="table-cell px-5">
                        {matched ? (
                          <Link
                            href={`/product/${matched.id}`}
                            target="_blank"
                            className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 hover:text-emerald-900"
                          >
                            {matched.name}
                            <ExternalLink size={11} />
                          </Link>
                        ) : (
                          <span className="text-xs text-charcoal-400">
                            unmatched
                          </span>
                        )}
                      </td>
                      <td className="table-cell px-5 text-xs text-charcoal-400">
                        {timeAgo(l.scrapedAt)}
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

function storageSort(a, b) {
  const toBytes = (s) => {
    const m = String(s).match(/(\d+(?:\.\d+)?)\s*(GB|TB|MB)?/i);
    if (!m) return 0;
    const n = parseFloat(m[1]);
    const unit = (m[2] ?? 'GB').toUpperCase();
    if (unit === 'TB') return n * 1024;
    if (unit === 'MB') return n / 1024;
    return n;
  };
  return toBytes(a) - toBytes(b);
}
