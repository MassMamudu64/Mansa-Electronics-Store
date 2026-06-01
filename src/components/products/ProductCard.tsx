'use client';

import Link from 'next/link';
import { useState, type MouseEvent } from 'react';
import { motion } from 'framer-motion';
import { ShoppingBag, Heart, Check } from 'lucide-react';
import { useAddToCartPopup, type PopupProductInput } from '@/hooks/useAddToCartPopup';
import { formatPrice } from '@/lib/money';

type ProductImage = { url: string; alt?: string };

export interface ProductCardProduct {
  id: string;
  slug?: string;
  name?: string;
  model?: string;
  category?: string;
  brand?: string;
  storage?: string;
  condition?: string;
  color?: string;
  price?: number;
  selling_price?: number;
  compareAtPrice?: number | null;
  compare_at_price?: number | null;
  currency?: string;
  stock?: number;
  lowStockThreshold?: number;
  isBestSeller?: boolean;
  is_best_seller?: boolean;
  rating?: number;
  reviewCount?: number;
  image?: string;
  image_url?: string;
  images?: ProductImage[];
}

interface Props {
  product: ProductCardProduct;
  /** Stagger animation index for fade-in entry */
  index?: number;
}

const CONDITION_LABEL: Record<string, string> = {
  A: 'Excellent',
  B: 'Very Good',
  C: 'Good',
};

export default function ProductCard({ product, index = 0 }: Props) {
  const { addAndShow } = useAddToCartPopup();
  const [added, setAdded] = useState(false);
  const [wishlisted, setWishlisted] = useState(false);

  const price = (product.price ?? product.selling_price ?? 0) as number;
  const compareAt = (product.compareAtPrice ?? product.compare_at_price ?? null) as number | null;
  const hasDiscount = compareAt != null && compareAt > price;
  const discountPct = hasDiscount ? Math.round(((compareAt! - price) / compareAt!) * 100) : 0;
  const currency = product.currency ?? 'USD';

  const stock = product.stock ?? 0;
  const oos = stock <= 0;
  const lowStock = !oos && stock <= (product.lowStockThreshold ?? 3);

  const isBestSeller = product.isBestSeller ?? product.is_best_seller ?? false;
  const displayName = product.name ?? product.model ?? 'Product';
  const image = product.images?.[0]?.url ?? product.image_url ?? product.image ?? '/placeholder.svg';
  const href = `/product/${product.slug ?? product.id}`;
  const showStorage = product.storage && product.storage !== '-' && product.storage !== '';
  const conditionLabel = product.condition ? CONDITION_LABEL[product.condition] ?? product.condition : null;

  function handleAddToCart(e: MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
    e.stopPropagation();
    if (oos) return;
    addAndShow(product as PopupProductInput, 1);
    setAdded(true);
    setTimeout(() => setAdded(false), 1400);
  }

  function handleWishlist(e: MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
    e.stopPropagation();
    setWishlisted((w) => !w);
  }

  return (
    <motion.article
      initial={{ opacity: 0, y: 22 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: Math.min(index, 8) * 0.06 }}
      whileHover={{ y: -6 }}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-sand-300 bg-white shadow-product transition-shadow duration-300 ease-mansa hover:border-gold-500/40 hover:shadow-product-hover"
    >
      {/* Image */}
      <Link
        href={href}
        className="relative block aspect-square overflow-hidden bg-paper-warm"
        aria-label={displayName}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={image}
          alt={displayName}
          loading="lazy"
          className="h-full w-full object-contain p-6 transition-transform duration-500 ease-mansa group-hover:scale-110 sm:p-8"
        />

        {/* Warm hover glaze */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-brown-900/[0.06] to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

        {/* Top-left badges */}
        <div className="pointer-events-none absolute left-3 top-3 z-10 flex flex-col gap-1.5">
          {isBestSeller && (
            <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-gold-700 shadow-card ring-1 ring-gold-500">
              ★ Best Seller
            </span>
          )}
          {hasDiscount && (
            <span className="rounded-full bg-gold-gradient px-2.5 py-1 text-[10px] font-bold text-brown-900 shadow-gold-sm">
              −{discountPct}%
            </span>
          )}
        </div>

        {/* Wishlist */}
        <motion.button
          type="button"
          onClick={handleWishlist}
          whileTap={{ scale: 0.8 }}
          whileHover={{ scale: 1.12 }}
          aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-brown-700 shadow-card backdrop-blur-sm transition-colors hover:bg-white hover:text-gold-600"
        >
          <Heart
            size={16}
            className={`transition-all ${wishlisted ? 'fill-gold-600 text-gold-600' : ''}`}
          />
        </motion.button>

        {/* Out of stock overlay */}
        {oos && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-paper-warm/70 backdrop-blur-[2px]">
            <span className="rounded-full bg-brown-800 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-white shadow">
              Sold Out
            </span>
          </div>
        )}

        {/* Quick Add — slides up on hover (desktop only), gold shimmer */}
        {!oos && (
          <div className="pointer-events-none absolute inset-x-3 bottom-3 z-10 hidden translate-y-3 opacity-0 transition-all duration-300 ease-mansa group-hover:pointer-events-auto group-hover:translate-y-0 group-hover:opacity-100 md:block">
            <button
              type="button"
              onClick={handleAddToCart}
              className={`group/qa relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl py-2.5 text-xs font-bold backdrop-blur-md transition-colors ${
                added ? 'bg-success text-white' : 'bg-gold-gradient text-brown-900 hover:shadow-gold'
              }`}
            >
              <span className="relative z-10 inline-flex items-center gap-2">
                {added ? (<><Check size={14} /> Added</>) : (<><ShoppingBag size={14} /> Quick Add</>)}
              </span>
              {!added && (
                <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gold-sheen transition-transform duration-700 ease-mansa group-hover/qa:translate-x-full" />
              )}
            </button>
          </div>
        )}
      </Link>

      {/* Info */}
      <div className="flex flex-1 flex-col gap-2 p-4">
        <p className="text-[10px] font-semibold uppercase tracking-eyebrow text-ink-500">
          {product.brand ?? product.category ?? 'Electronics'}
        </p>

        <Link href={href} className="block">
          <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-brown-800 transition-colors group-hover:text-gold-700 sm:text-[15px]">
            {displayName}
          </h3>
        </Link>

        {/* Spec chips */}
        {(showStorage || conditionLabel || product.color) && (
          <div className="flex flex-wrap gap-1.5">
            {showStorage && (
              <span className="rounded-md bg-sand-100 px-2 py-0.5 text-[10px] font-medium text-ink-700 ring-1 ring-inset ring-sand-300">
                {product.storage}
              </span>
            )}
            {conditionLabel && (
              <span className="rounded-md bg-sand-100 px-2 py-0.5 text-[10px] font-medium text-ink-700 ring-1 ring-inset ring-sand-300">
                {conditionLabel}
              </span>
            )}
            {product.color && (
              <span className="rounded-md bg-sand-100 px-2 py-0.5 text-[10px] font-medium text-ink-700 ring-1 ring-inset ring-sand-300">
                {product.color}
              </span>
            )}
          </div>
        )}

        {/* Rating */}
        {product.rating != null && (
          <div className="flex items-center gap-1 text-[11px] text-ink-500">
            <Stars value={product.rating} />
            <span className="font-medium text-brown-700">{product.rating.toFixed(1)}</span>
            {product.reviewCount != null && (
              <span className="text-ink-500">({product.reviewCount})</span>
            )}
          </div>
        )}

        {/* Price block */}
        <div className="mt-auto flex items-end justify-between gap-2 pt-2">
          <div className="flex flex-col">
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-bold tabular-nums tracking-tight text-brown-900 sm:text-xl">
                {formatPrice(price, currency)}
              </span>
              {hasDiscount && (
                <span className="text-xs text-ink-500 line-through">
                  {formatPrice(compareAt!, currency)}
                </span>
              )}
            </div>
            {lowStock && (
              <span className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-gold-700">
                Only {stock} left
              </span>
            )}
          </div>

          {/* Mobile / always-visible compact add button */}
          {!oos && (
            <motion.button
              type="button"
              onClick={handleAddToCart}
              whileTap={{ scale: 0.9 }}
              aria-label="Add to cart"
              className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full transition-colors md:hidden ${
                added ? 'bg-success text-white' : 'bg-brown-800 text-white hover:bg-brown-700'
              }`}
            >
              {added ? <Check size={15} /> : <ShoppingBag size={15} />}
            </motion.button>
          )}
        </div>
      </div>
    </motion.article>
  );
}

/* Lightweight gold stars matching the Mansa palette. */
function Stars({ value }: { value: number }) {
  const full = Math.floor(value);
  const half = value - full >= 0.5;
  return (
    <div className="inline-flex items-center">
      {[0, 1, 2, 3, 4].map((i) => {
        const filled = i < full;
        const isHalf = !filled && i === full && half;
        return (
          <svg key={i} width={12} height={12} viewBox="0 0 24 24" className="text-gold-500">
            {isHalf ? (
              <>
                <defs>
                  <linearGradient id={`star-h-${i}`}>
                    <stop offset="50%" stopColor="currentColor" />
                    <stop offset="50%" stopColor="#D8CCBC" />
                  </linearGradient>
                </defs>
                <path fill={`url(#star-h-${i})`} d="M12 2l3 7h7l-5.5 4.5L18 21l-6-4-6 4 1.5-7.5L2 9h7z" />
              </>
            ) : (
              <path
                fill={filled ? 'currentColor' : '#D8CCBC'}
                d="M12 2l3 7h7l-5.5 4.5L18 21l-6-4-6 4 1.5-7.5L2 9h7z"
              />
            )}
          </svg>
        );
      })}
    </div>
  );
}
