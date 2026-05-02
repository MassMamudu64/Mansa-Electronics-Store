'use client';

import { useState, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import ProductCard from '@/components/ProductCard';

const CATEGORIES = [
  { label: 'Smartphones',  value: 'iPhone' },
  { label: 'Chargers',     value: 'Chargers' },
  { label: 'Audio',        value: 'Audio' },
  { label: 'Cases',        value: 'Cases' },
  { label: 'Cables',       value: 'Cables' },
  { label: 'Power Banks',  value: 'PowerBanks' },
  { label: 'Accessories',  value: 'Accessories' },
];

const SORT_OPTIONS = [
  { value: 'featured',   label: 'Featured' },
  { value: 'newest',     label: 'Newest' },
  { value: 'price-asc',  label: 'Price: Low → High' },
  { value: 'price-desc', label: 'Price: High → Low' },
];

export default function ShopPage() {
  return (
    <Suspense fallback={<div className="container-site py-20 text-center text-sm text-charcoal-400">Loading shop…</div>}>
      <ShopContent />
    </Suspense>
  );
}

function ShopContent() {
  const searchParams = useSearchParams();

  const [category, setCategory] = useState(searchParams.get('category') ?? '');
  const [q, setQ] = useState(searchParams.get('q') ?? '');
  const [sort, setSort] = useState(searchParams.get('sort') ?? 'featured');
  const [inStockOnly, setInStockOnly] = useState(false);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products', 'all'],
    queryFn: async () => {
      const res = await fetch('/api/products');
      if (!res.ok) return [];
      const data = await res.json();
      return data.products ?? data ?? [];
    },
    staleTime: 60_000,
  });

  const filtered = useMemo(() => {
    let list = [...products];

    if (category) {
      list = list.filter(
        (p) => (p.category ?? p.category) === category,
      );
    }
    if (q.trim()) {
      const lower = q.trim().toLowerCase();
      list = list.filter(
        (p) =>
          p.name?.toLowerCase().includes(lower) ||
          p.category?.toLowerCase().includes(lower) ||
          p.brand?.toLowerCase().includes(lower) ||
          p.tags?.some?.((t) => t.toLowerCase().includes(lower)),
      );
    }
    if (inStockOnly) list = list.filter((p) => (p.stock ?? 0) > 0);

    switch (sort) {
      case 'newest':
        list.sort((a, b) =>
          (b.createdAt ?? b.created_at ?? '').localeCompare(a.createdAt ?? a.created_at ?? ''),
        );
        break;
      case 'price-asc':
        list.sort((a, b) => (a.price ?? a.selling_price ?? 0) - (b.price ?? b.selling_price ?? 0));
        break;
      case 'price-desc':
        list.sort((a, b) => (b.price ?? b.selling_price ?? 0) - (a.price ?? a.selling_price ?? 0));
        break;
      default:
        list.sort(
          (a, b) =>
            Number(b.isBestSeller ?? b.is_best_seller ?? 0) -
            Number(a.isBestSeller ?? a.is_best_seller ?? 0),
        );
    }

    return list;
  }, [products, category, q, inStockOnly, sort]);

  const hasFilters = !!category || !!q || inStockOnly || sort !== 'featured';

  function clearFilters() {
    setCategory('');
    setQ('');
    setInStockOnly(false);
    setSort('featured');
  }

  const FilterPanel = () => (
    <div className="space-y-6">
      <div>
        <p className="label">Category</p>
        <div className="mt-2 space-y-0.5">
          <button
            onClick={() => setCategory('')}
            className={`w-full rounded-lg px-3 py-2 text-left text-sm transition ${
              !category
                ? 'bg-charcoal-900 font-semibold text-white'
                : 'text-charcoal-700 hover:bg-charcoal-50'
            }`}
          >
            All Products
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setCategory(category === cat.value ? '' : cat.value)}
              className={`w-full rounded-lg px-3 py-2 text-left text-sm transition ${
                category === cat.value
                  ? 'bg-charcoal-900 font-semibold text-white'
                  : 'text-charcoal-700 hover:bg-charcoal-50'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      <div className="border-t border-charcoal-100 pt-5">
        <label className="flex cursor-pointer items-center gap-3">
          <input
            type="checkbox"
            checked={inStockOnly}
            onChange={(e) => setInStockOnly(e.target.checked)}
            className="h-4 w-4 rounded border-charcoal-300 accent-charcoal-900"
          />
          <span className="text-sm font-medium text-charcoal-700">In stock only</span>
        </label>
      </div>

      {hasFilters && (
        <button
          onClick={clearFilters}
          className="flex items-center gap-1.5 text-xs text-charcoal-500 hover:text-charcoal-900"
        >
          <X size={13} />
          Clear all filters
        </button>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b border-charcoal-100 bg-charcoal-50 py-10">
        <div className="container-site">
          <h1 className="text-3xl font-black tracking-tight text-charcoal-900 md:text-4xl">
            {category
              ? CATEGORIES.find((c) => c.value === category)?.label ?? category
              : 'All Products'}
          </h1>
          <p className="mt-1 text-sm text-charcoal-500">
            {isLoading
              ? 'Loading…'
              : `${filtered.length} product${filtered.length !== 1 ? 's' : ''}`}
          </p>
        </div>
      </div>

      <div className="container-site py-8">
        {/* Toolbar */}
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <div className="relative min-w-0 flex-1 max-w-xs">
            <Search
              size={14}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-charcoal-400"
            />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search products…"
              className="input-sm pl-9"
            />
          </div>

          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="input-sm w-auto cursor-pointer"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>

          <button
            onClick={() => setMobileFiltersOpen((o) => !o)}
            className="btn-secondary-sm flex items-center gap-1.5 lg:hidden"
          >
            <SlidersHorizontal size={14} />
            Filters
          </button>
        </div>

        {/* Mobile filter panel */}
        {mobileFiltersOpen && (
          <div className="mb-6 rounded-2xl border border-charcoal-100 bg-white p-5 shadow-card animate-fade-in lg:hidden">
            <FilterPanel />
          </div>
        )}

        <div className="flex gap-8">
          {/* Desktop sidebar */}
          <aside className="hidden w-48 flex-shrink-0 lg:block">
            <FilterPanel />
          </aside>

          {/* Product grid */}
          <div className="flex-1 min-w-0">
            {isLoading ? (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="h-72 animate-pulse rounded-2xl bg-charcoal-100" />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="py-24 text-center">
                <p className="text-3xl font-black text-charcoal-200">No results</p>
                <p className="mt-2 text-sm text-charcoal-500">
                  Try different filters or a broader search.
                </p>
                <button onClick={clearFilters} className="mt-5 btn-secondary-sm">
                  Clear filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
                {filtered.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
