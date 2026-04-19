'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import ProductCard from './ProductCard';

export default function FeaturedProducts() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/products')
      .then((r) => r.json())
      .then((data) => setItems(data))
      .finally(() => setLoading(false));
  }, []);

  // Pick the 8 freshest / in-stock products for the rail.
  const featured = items
    .filter((p) => p.quantity > 0)
    .slice(0, 8);

  return (
    <section className="section bg-cream">
      <div className="mx-auto max-w-7xl px-4">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <span className="eyebrow">Just in</span>
            <h2 className="mt-2 text-2xl font-extrabold md:text-3xl">Featured devices</h2>
          </div>
          <Link href="/shop" className="btn-link">Shop all →</Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="card animate-pulse">
                <div className="aspect-square bg-ink-50" />
                <div className="p-4 space-y-2">
                  <div className="h-3 w-1/3 rounded bg-ink-50" />
                  <div className="h-4 w-2/3 rounded bg-ink-50" />
                  <div className="h-5 w-1/2 rounded bg-ink-50" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {featured.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        )}
      </div>
    </section>
  );
}
