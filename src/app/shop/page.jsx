'use client';

import { Suspense, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import ProductCard from '@/components/products/ProductCard';
import ProductCardSkeleton from '@/components/products/ProductCardSkeleton';
import ProductFilters, { EMPTY_FILTERS } from '@/components/products/ProductFilters';
import EmptyState from '@/components/products/EmptyState';
import { CATEGORIES } from '@/config/categories';

const SORT_OPTIONS = [
  { value: 'featured',   label: 'Featured' },
  { value: 'newest',     label: 'Newest' },
  { value: 'price-asc',  label: 'Price: Low → High' },
  { value: 'price-desc', label: 'Price: High → Low' },
];

export default function ShopPage() {
  return (
    <Suspense fallback={<ShopFallback />}>
      <ShopContent />
    </Suspense>
  );
}

function ShopFallback() {
  return (
    <div className="min-h-screen bg-paper-warm">
      <div className="container-site py-20 text-center text-sm text-ink-500">Loading shop…</div>
    </div>
  );
}

function ShopContent() {
  const searchParams = useSearchParams();

  const [filters, setFilters] = useState({
    ...EMPTY_FILTERS,
    category: searchParams.get('category') ?? '',
    q: searchParams.get('q') ?? '',
    sort: searchParams.get('sort') ?? 'featured',
  });

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

  // Derive available storage / condition options from the actual catalog
  const { availableStorages, availableConditions } = useMemo(() => {
    const s = new Set();
    const c = new Set();
    for (const p of products) {
      if (p.storage && p.storage !== '-' && p.storage !== '') s.add(p.storage);
      if (p.condition) c.add(p.condition);
    }
    return {
      availableStorages: Array.from(s).sort(storageSort),
      availableConditions: Array.from(c).sort(),
    };
  }, [products]);

  const filtered = useMemo(() => {
    let list = [...products];

    if (filters.category) {
      list = list.filter((p) => p.category === filters.category);
    }

    if (filters.q.trim()) {
      const lower = filters.q.trim().toLowerCase();
      list = list.filter(
        (p) =>
          p.name?.toLowerCase().includes(lower) ||
          p.model?.toLowerCase().includes(lower) ||
          p.category?.toLowerCase().includes(lower) ||
          p.brand?.toLowerCase().includes(lower) ||
          p.tags?.some?.((t) => t.toLowerCase().includes(lower)),
      );
    }

    if (filters.storages.length > 0) {
      list = list.filter((p) => p.storage && filters.storages.includes(p.storage));
    }

    if (filters.conditions.length > 0) {
      list = list.filter((p) => p.condition && filters.conditions.includes(p.condition));
    }

    const min = filters.minPrice === '' ? null : Number(filters.minPrice);
    const max = filters.maxPrice === '' ? null : Number(filters.maxPrice);
    if (min !== null && !Number.isNaN(min)) {
      list = list.filter((p) => (p.price ?? p.selling_price ?? 0) >= min);
    }
    if (max !== null && !Number.isNaN(max)) {
      list = list.filter((p) => (p.price ?? p.selling_price ?? 0) <= max);
    }

    if (filters.inStockOnly) {
      list = list.filter((p) => (p.stock ?? 0) > 0);
    }

    switch (filters.sort) {
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
  }, [products, filters]);

  const clearFilters = () => setFilters({ ...EMPTY_FILTERS });

  const activeCategoryLabel =
    CATEGORIES.find((c) => c.value === filters.category)?.label ?? null;

  return (
    <div className="min-h-screen bg-paper-warm">
      {/* ─── Hero header ─── */}
      <section className="relative overflow-hidden border-b border-sand-300 bg-hero-warm">
        {/* Subtle gold radial accent */}
        <div
          aria-hidden
          className="pointer-events-none absolute -top-32 left-1/2 h-80 w-[36rem] -translate-x-1/2 rounded-full bg-gold-200/30 blur-3xl"
        />
        <div className="container-site relative py-12 sm:py-16">
          <p className="eyebrow">Shop</p>
          <h1 className="mt-2 font-serif text-5xl font-semibold tracking-tight text-brown-800 sm:text-6xl">
            {activeCategoryLabel ?? 'All Products'}
          </h1>
          <p className="mt-3 max-w-xl text-sm text-ink-500 sm:text-base">
            Premium electronics, fully tested and ready to ship. Every device is graded, cleaned and
            backed by our guarantee.
          </p>
          <div className="hairline-gold mt-6 max-w-[6rem]" />
        </div>
      </section>

      {/* ─── Filters + Grid ─── */}
      <div className="container-site">
        <ProductFilters
          categories={CATEGORIES}
          storages={availableStorages}
          conditions={availableConditions}
          sortOptions={SORT_OPTIONS}
          filters={filters}
          onChange={setFilters}
          onClear={clearFilters}
          resultCount={filtered.length}
          totalCount={products.length}
        />

        <div className="py-8 sm:py-10">
          {isLoading ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5">
              {Array.from({ length: 10 }).map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState onClear={clearFilters} />
          ) : (
            <>
              <p className="mb-4 text-xs font-medium text-charcoal-500 sm:hidden">
                {filtered.length} product{filtered.length !== 1 ? 's' : ''}
              </p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5">
                {filtered.map((product, i) => (
                  <ProductCard key={product.id} product={product} index={i} />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/** Sort storage strings like "64GB", "128GB", "1TB" by numeric capacity. */
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
