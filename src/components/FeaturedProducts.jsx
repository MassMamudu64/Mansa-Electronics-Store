'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight } from 'lucide-react';
import ProductCard from '@/components/products/ProductCard';

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
    <section className="section bg-paper-warm">
      <div className="container-site">
        <div className="mb-10 flex items-end justify-between">
          <div>
            <p className="eyebrow mb-2">Handpicked</p>
            <h2 className="font-serif text-4xl font-semibold tracking-tight text-brown-800 md:text-5xl">
              {title}
            </h2>
          </div>
          <Link
            href="/shop"
            className="group hidden items-center gap-1.5 text-sm font-semibold text-gold-700 transition-colors hover:text-brown-800 sm:flex"
          >
            View all <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-72 animate-pulse rounded-2xl bg-sand-100" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-sand-300 py-20 text-center">
            <p className="text-sm text-ink-500">No featured products yet.</p>
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
