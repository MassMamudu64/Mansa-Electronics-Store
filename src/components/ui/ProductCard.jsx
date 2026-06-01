'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Heart, Star } from 'lucide-react';

const fmt = (n) =>
  new Intl.NumberFormat('en-GH', { style: 'currency', currency: 'GHS', maximumFractionDigits: 0 }).format(n);

/**
 * Mansa brand product card.
 * product: { slug, name, brand, category, image, price, compareAt?, rating?, reviews?, badge? ('sale'|'new'|'best') }
 */
export default function ProductCard({ product, onAdd }) {
  const {
    slug, name, brand, category, image,
    price, compareAt, rating = 0, reviews = 0, badge,
  } = product;

  const discount = compareAt && compareAt > price ? Math.round(((compareAt - price) / compareAt) * 100) : 0;

  return (
    <div className="group overflow-hidden rounded-2xl border border-sand-300 bg-white shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-card-lg">
      <Link href={`/product/${slug}`} className="block">
        <div className="relative flex aspect-square items-center justify-center overflow-hidden bg-paper-warm">
          {/* Badges */}
          <div className="absolute inset-x-3 top-3 z-10 flex items-start justify-between">
            {badge === 'sale' && discount > 0 ? (
              <span className="rounded-full bg-gold-gradient px-2.5 py-1 text-[11px] font-bold text-brown-900">
                −{discount}%
              </span>
            ) : badge === 'new' ? (
              <span className="rounded-full bg-brown-800 px-2.5 py-1 text-[11px] font-bold text-white">New</span>
            ) : badge === 'best' ? (
              <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-bold text-gold-700 ring-1 ring-gold-500">
                ★ Best Seller
              </span>
            ) : <span />}

            <button
              type="button"
              aria-label="Add to wishlist"
              onClick={(e) => e.preventDefault()}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-brown-700 shadow-card transition hover:text-gold-600"
            >
              <Heart size={15} />
            </button>
          </div>

          {image ? (
            <Image
              src={image}
              alt={name}
              width={600}
              height={600}
              className="h-full w-full object-contain p-6 transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <span className="text-6xl transition-transform duration-300 group-hover:scale-105">📦</span>
          )}
        </div>
      </Link>

      <div className="p-4">
        {(brand || category) && (
          <div className="text-[10px] font-semibold uppercase tracking-eyebrow text-ink-500">
            {[brand, category].filter(Boolean).join(' · ')}
          </div>
        )}

        <Link href={`/product/${slug}`}>
          <h3 className="mt-1 line-clamp-1 text-[15px] font-semibold text-brown-800 transition hover:text-gold-700">
            {name}
          </h3>
        </Link>

        {rating > 0 && (
          <div className="mt-1.5 flex items-center gap-1 text-gold-500">
            {[0, 1, 2, 3, 4].map((i) => (
              <Star key={i} size={13} fill={i < Math.round(rating) ? 'currentColor' : 'none'} strokeWidth={i < Math.round(rating) ? 0 : 1.5} />
            ))}
            <span className="ml-1 text-xs text-ink-500">{rating.toFixed(1)} ({reviews})</span>
          </div>
        )}

        <div className="mt-2.5 flex items-baseline gap-2">
          <span className="text-lg font-bold tabular-nums text-brown-900">{fmt(price)}</span>
          {discount > 0 && <span className="text-sm font-medium tabular-nums text-ink-500 line-through">{fmt(compareAt)}</span>}
        </div>

        <button
          type="button"
          onClick={() => onAdd?.(product)}
          className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-full bg-gold-gradient px-4 py-2.5 text-sm font-bold text-brown-900 opacity-90 transition-all duration-200 hover:shadow-gold hover:brightness-105 group-hover:opacity-100"
        >
          Add to Cart
        </button>
      </div>
    </div>
  );
}
