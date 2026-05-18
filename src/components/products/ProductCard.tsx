'use client';

import Link from 'next/link';
import { useState, type MouseEvent } from 'react';
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
    <article
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-charcoal-100 bg-white shadow-product transition-all duration-300 ease-out hover:-translate-y-1.5 hover:border-charcoal-200 hover:shadow-product-hover motion-safe:animate-slide-up"
      style={{ animationDelay: `${Math.min(index, 12) * 40}ms`, animationFillMode: 'backwards' }}
    >
      {/* Image */}
      <Link
        href={href}
        className="relative block aspect-square overflow-hidden bg-gradient-to-br from-charcoal-50 via-white to-charcoal-50"
        aria-label={displayName}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={image}
          alt={displayName}
          loading="lazy"
          className="h-full w-full object-contain p-6 transition-transform duration-500 ease-out group-hover:scale-110 sm:p-8"
        />

        {/* Top-left badges */}
        <div className="pointer-events-none absolute left-3 top-3 flex flex-col gap-1.5">
          {isBestSeller && (
            <span className="rounded-full bg-charcoal-900 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-sm">
              Best Seller
            </span>
          )}
          {hasDiscount && (
            <span className="rounded-full bg-emerald-500 px-2.5 py-1 text-[10px] font-bold text-white shadow-sm">
              −{discountPct}%
            </span>
          )}
        </div>

        {/* Wishlist */}
        <button
          type="button"
          onClick={handleWishlist}
          aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-charcoal-700 shadow-sm backdrop-blur-sm transition-all duration-200 hover:scale-110 hover:bg-white hover:text-rose-500"
        >
          <Heart
            size={16}
            className={`transition-all ${wishlisted ? 'fill-rose-500 text-rose-500' : ''}`}
          />
        </button>

        {/* Out of stock overlay */}
        {oos && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/70 backdrop-blur-[2px]">
            <span className="rounded-full bg-charcoal-900 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-white shadow">
              Sold Out
            </span>
          </div>
        )}

        {/* Quick Add — slides up on hover (desktop only) */}
        {!oos && (
          <div className="pointer-events-none absolute inset-x-3 bottom-3 hidden translate-y-3 opacity-0 transition-all duration-300 ease-out group-hover:pointer-events-auto group-hover:translate-y-0 group-hover:opacity-100 md:block">
            <button
              type="button"
              onClick={handleAddToCart}
              className={`flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-semibold backdrop-blur-md transition-colors ${
                added
                  ? 'bg-emerald-500 text-white'
                  : 'bg-charcoal-900/95 text-white hover:bg-charcoal-900'
              }`}
            >
              {added ? (
                <>
                  <Check size={14} />
                  Added
                </>
              ) : (
                <>
                  <ShoppingBag size={14} />
                  Quick Add
                </>
              )}
            </button>
          </div>
        )}
      </Link>

      {/* Info */}
      <div className="flex flex-1 flex-col gap-2 p-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-charcoal-400">
          {product.brand ?? product.category ?? 'Electronics'}
        </p>

        <Link href={href} className="block">
          <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-charcoal-900 transition-colors group-hover:text-charcoal-600 sm:text-[15px]">
            {displayName}
          </h3>
        </Link>

        {/* Spec chips */}
        {(showStorage || conditionLabel || product.color) && (
          <div className="flex flex-wrap gap-1.5">
            {showStorage && (
              <span className="rounded-md bg-charcoal-50 px-2 py-0.5 text-[10px] font-medium text-charcoal-600 ring-1 ring-inset ring-charcoal-100">
                {product.storage}
              </span>
            )}
            {conditionLabel && (
              <span className="rounded-md bg-charcoal-50 px-2 py-0.5 text-[10px] font-medium text-charcoal-600 ring-1 ring-inset ring-charcoal-100">
                {conditionLabel}
              </span>
            )}
            {product.color && (
              <span className="rounded-md bg-charcoal-50 px-2 py-0.5 text-[10px] font-medium text-charcoal-600 ring-1 ring-inset ring-charcoal-100">
                {product.color}
              </span>
            )}
          </div>
        )}

        {/* Rating */}
        {product.rating != null && (
          <div className="flex items-center gap-1 text-[11px] text-charcoal-500">
            <Stars value={product.rating} />
            <span className="font-medium text-charcoal-700">{product.rating.toFixed(1)}</span>
            {product.reviewCount != null && (
              <span className="text-charcoal-400">({product.reviewCount})</span>
            )}
          </div>
        )}

        {/* Price block */}
        <div className="mt-auto flex items-end justify-between gap-2 pt-2">
          <div className="flex flex-col">
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-bold tracking-tight text-charcoal-900 sm:text-xl">
                {formatPrice(price, currency)}
              </span>
              {hasDiscount && (
                <span className="text-xs text-charcoal-400 line-through">
                  {formatPrice(compareAt!, currency)}
                </span>
              )}
            </div>
            {lowStock && (
              <span className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-600">
                Only {stock} left
              </span>
            )}
          </div>

          {/* Mobile / always-visible compact add button */}
          {!oos && (
            <button
              type="button"
              onClick={handleAddToCart}
              aria-label="Add to cart"
              className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full transition-all duration-200 active:scale-90 md:hidden ${
                added
                  ? 'bg-emerald-500 text-white'
                  : 'bg-charcoal-900 text-white hover:bg-charcoal-700'
              }`}
            >
              {added ? <Check size={15} /> : <ShoppingBag size={15} />}
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

/* Lightweight stars — avoids importing the legacy RatingStars (which uses
   undefined `gold-*` / `ink-*` Tailwind colors that won't render). */
function Stars({ value }: { value: number }) {
  const full = Math.floor(value);
  const half = value - full >= 0.5;
  return (
    <div className="inline-flex items-center">
      {[0, 1, 2, 3, 4].map((i) => {
        const filled = i < full;
        const isHalf = !filled && i === full && half;
        return (
          <svg key={i} width={12} height={12} viewBox="0 0 24 24" className="text-amber-400">
            {isHalf ? (
              <>
                <defs>
                  <linearGradient id={`star-h-${i}`}>
                    <stop offset="50%" stopColor="currentColor" />
                    <stop offset="50%" stopColor="#e5e5ea" />
                  </linearGradient>
                </defs>
                <path fill={`url(#star-h-${i})`} d="M12 2l3 7h7l-5.5 4.5L18 21l-6-4-6 4 1.5-7.5L2 9h7z" />
              </>
            ) : (
              <path
                fill={filled ? 'currentColor' : '#e5e5ea'}
                d="M12 2l3 7h7l-5.5 4.5L18 21l-6-4-6 4 1.5-7.5L2 9h7z"
              />
            )}
          </svg>
        );
      })}
    </div>
  );
}
