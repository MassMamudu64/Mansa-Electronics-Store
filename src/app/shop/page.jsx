'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { productService } from '@/services/productService';
import ProductCard from '@/components/ProductCard';
import FilterSidebar from '@/components/FilterSidebar';
import Breadcrumbs from '@/components/Breadcrumbs';

function ShopInner() {
  const params = useSearchParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState('featured');

  const initialCategory = params.get('category');
  const initialQuery = params.get('q') || '';

  const [query, setQuery] = useState(initialQuery);
  const [filters, setFilters] = useState({
    categories: initialCategory ? [initialCategory] : [],
    conditions: [],
    storages: [],
    variants: [],
    minPrice: '',
    maxPrice: '',
    inStockOnly: true,
  });

  useEffect(() => {
    let cancelled = false;
    productService.getAll().then((data) => {
      if (cancelled) return;
      setProducts(data);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const cat = params.get('category');
    const q = params.get('q') || '';
    setQuery(q);
    setFilters((f) => ({ ...f, categories: cat ? [cat] : f.categories }));
  }, [params]);

  const categories = useMemo(
    () => Array.from(new Set(products.map((p) => p.category))).sort(),
    [products]
  );
  const storages = useMemo(
    () => Array.from(new Set(products.map((p) => p.storage).filter(Boolean))).sort(),
    [products]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const min = filters.minPrice === '' ? 0 : Number(filters.minPrice);
    const max = filters.maxPrice === '' ? Infinity : Number(filters.maxPrice);
    let list = products.filter((p) => {
      if (q && !`${p.name} ${p.storage ?? ''} ${p.category}`.toLowerCase().includes(q)) return false;
      if (filters.categories.length && !filters.categories.includes(p.category)) return false;
      if (filters.conditions.length && (!p.condition || !filters.conditions.includes(p.condition))) return false;
      if (filters.storages.length && (!p.storage || !filters.storages.includes(p.storage))) return false;
      if (filters.variants.length && !filters.variants.some((v) => p.name.toLowerCase().includes(v.toLowerCase()))) return false;
      if (p.price < min || p.price > max) return false;
      if (filters.inStockOnly && p.stock <= 0) return false;
      return true;
    });

    switch (sort) {
      case 'price-asc': list = [...list].sort((a, b) => a.price - b.price); break;
      case 'price-desc': list = [...list].sort((a, b) => b.price - a.price); break;
      case 'name': list = [...list].sort((a, b) => a.name.localeCompare(b.name)); break;
      default:
        list = [...list].sort((a, b) =>
          Number(b.isBestSeller) - Number(a.isBestSeller) || b.salesCount - a.salesCount,
        );
        break;
    }
    return list;
  }, [products, query, filters, sort]);

  function clearFilters() {
    setFilters({
      categories: [],
      conditions: [],
      storages: [],
      variants: [],
      minPrice: '',
      maxPrice: '',
      inStockOnly: false,
    });
    setQuery('');
  }

  const crumbs = [
    { label: 'Home', href: '/' },
    { label: filters.categories.length === 1 ? filters.categories[0] : 'Shop' },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <Breadcrumbs items={crumbs} />
      <div className="mt-3 mb-8 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold text-ink-900 md:text-4xl">
            {filters.categories.length === 1 ? filters.categories[0] : 'Shop all'}
          </h1>
          <p className="mt-1 text-sm text-ink-500">Hand-tested. Graded. Ships worldwide.</p>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search within results"
            className="input w-56"
          />
          <label className="sr-only" htmlFor="sort">Sort</label>
          <select
            id="sort"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="input w-48"
          >
            <option value="featured">Sort: Best sellers</option>
            <option value="price-asc">Price: low → high</option>
            <option value="price-desc">Price: high → low</option>
            <option value="name">Name: A–Z</option>
          </select>
        </div>
      </div>

      <div className="grid gap-8 md:grid-cols-[260px_1fr]">
        <FilterSidebar
          categories={categories}
          storages={storages}
          filters={filters}
          onChange={setFilters}
          onClear={clearFilters}
          count={filtered.length}
          total={products.length}
        />

        <section>
          {loading ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="card animate-pulse">
                  <div className="aspect-square bg-ink-50" />
                  <div className="space-y-2 p-4">
                    <div className="h-3 w-1/3 rounded bg-ink-50" />
                    <div className="h-4 w-2/3 rounded bg-ink-50" />
                    <div className="h-5 w-1/2 rounded bg-ink-50" />
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="card p-10 text-center">
              <h3 className="text-lg font-semibold">No matches</h3>
              <p className="mt-1 text-sm text-ink-500">Try clearing filters or searching a different keyword.</p>
              <button onClick={clearFilters} className="btn-ghost mt-4">Clear filters</button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export default function ShopPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-7xl px-4 py-10">Loading…</div>}>
      <ShopInner />
    </Suspense>
  );
}
