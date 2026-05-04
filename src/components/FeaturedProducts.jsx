'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight } from 'lucide-react';
import ProductCard from './ProductCard';

export default function FeaturedProducts({ title = 'Featured Products', tag = 'featured' }) {
  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products', 'featured'],
    queryFn: async () => {
      const res = await fetch('/api/products?featured=true&limit=8');
      if (!res.ok) return [];
      const { products } = await res.json();
      return products ?? [];
    },
  });

  return (
    <section className="section bg-white">
      <div className="container-site">
        <div className="mb-10 flex items-end justify-between">
          <div>
            <p className="eyebrow mb-2">Handpicked</p>
            <h2 className="text-3xl font-black tracking-tight text-charcoal-900 md:text-4xl">
              {title}
            </h2>
          </div>
          <Link
            href="/shop"
            className="hidden items-center gap-1.5 text-sm font-semibold text-charcoal-700 hover:text-charcoal-900 sm:flex"
          >
            View all <ArrowRight size={15} />
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-72 animate-pulse rounded-2xl bg-charcoal-100" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-charcoal-200 py-20 text-center">
            <p className="text-sm text-charcoal-400">No featured products yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {products.slice(0, 8).map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}

        <div className="mt-8 text-center sm:hidden">
          <Link href="/shop" className="btn-secondary">
            View all products
          </Link>
        </div>
      </div>
    </section>
  );
}
