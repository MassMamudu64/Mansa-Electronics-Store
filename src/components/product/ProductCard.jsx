'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Heart, Star } from 'lucide-react';

const fmt = (n) =>
  new Intl.NumberFormat('en-GH', { style: 'currency', currency: 'GHS', maximumFractionDigits: 0 }).format(n);

export default function ProductCard({ product, onAdd, index = 0 }) {
  const {
    slug, name, brand, category, image,
    price, compareAt, rating = 0, reviews = 0, badge,
  } = product;

  const discount = compareAt && compareAt > price ? Math.round(((compareAt - price) / compareAt) * 100) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 22 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: (index % 4) * 0.07 }}
      whileHover={{ y: -6 }}
      className="group relative overflow-hidden rounded-2xl border border-sand-300 bg-white shadow-product transition-shadow duration-300 ease-mansa hover:shadow-product-hover"
    >
      <Link href={`/product/${slug}`} className="block">
        <div className="relative flex aspect-square items-center justify-center overflow-hidden bg-paper-warm">
          <div className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-t from-brown-900/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

          <div className="absolute inset-x-3 top-3 z-10 flex items-start justify-between">
            {badge === 'sale' && discount > 0 ? (
              <span className="rounded-full bg-gold-gradient px-2.5 py-1 text-[11px] font-bold text-brown-900 shadow-gold-sm">−{discount}%</span>
            ) : badge === 'new' ? (
              <span className="rounded-full bg-brown-800 px-2.5 py-1 text-[11px] font-bold text-white">New</span>
            ) : badge === 'best' ? (
              <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-bold text-gold-700 ring-1 ring-gold-500">★ Best Seller</span>
            ) : <span />}

            <motion.button
              type="button"
              aria-label="Add to wishlist"
              whileTap={{ scale: 0.8 }}
              whileHover={{ scale: 1.12 }}
              onClick={(e) => e.preventDefault()}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-brown-700 shadow-card backdrop-blur transition hover:text-gold-600"
            >
              <Heart size={15} />
            </motion.button>
          </div>

          {image ? (
            <Image
              src={image}
              alt={name}
              width={600}
              height={600}
              className="h-full w-full object-contain p-6 transition-transform duration-500 ease-mansa group-hover:scale-110"
            />
          ) : (
            <span className="text-6xl transition-transform duration-500 ease-mansa group-hover:scale-110">📦</span>
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
          <h3 className="mt-1 line-clamp-1 text-[15px] font-semibold text-brown-800 transition-colors group-hover:text-gold-700">
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

        <motion.button
          type="button"
          whileTap={{ scale: 0.97 }}
          onClick={() => onAdd?.(product)}
          className="group/btn relative mt-3 inline-flex w-full items-center justify-center overflow-hidden rounded-full bg-gold-gradient px-4 py-2.5 text-sm font-bold text-brown-900 opacity-95 transition-all duration-200 hover:shadow-gold group-hover:opacity-100"
        >
          <span className="relative z-10">Add to Cart</span>
          <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gold-sheen transition-transform duration-700 ease-mansa group-hover/btn:translate-x-full" />
        </motion.button>
      </div>
    </motion.div>
  );
}
