'use client';

import Link from 'next/link';
import { cartService } from '@/services/cartService';
import { formatPrice } from '@/lib/money';
import RatingStars from './RatingStars';

const tone = {
  A: 'badge-green',
  B: 'badge-amber',
  C: 'badge-rose',
};

function seededRating(id) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return 4.3 + (h % 60) / 100;
}
function seededCount(id) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 17 + id.charCodeAt(i)) >>> 0;
  return 18 + (h % 340);
}

export default function ProductCard({ product }) {
  const oos = product.stock <= 0;
  const lowStock = product.stock > 0 && product.stock <= (product.lowStockThreshold ?? 3);
  const image = product.images?.[0]?.url || '/placeholder.svg';
  const compareAt = product.compareAtPrice;
  const savings = compareAt && compareAt > product.price ? compareAt - product.price : 0;
  const rating = seededRating(product.id);
  const reviews = seededCount(product.id);

  return (
    <article className="group card flex flex-col overflow-hidden transition hover:-translate-y-0.5 hover:shadow-card-hover">
      <Link href={`/product/${product.id}`} className="relative block aspect-square overflow-hidden bg-cream">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={image}
          alt={product.name}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
        />
        <div className="absolute left-3 top-3 flex flex-col gap-1.5">
          {product.condition && product.condition !== 'New' && (
            <span className={`badge ${tone[product.condition] || 'badge-ink'}`}>Grade {product.condition}</span>
          )}
          {product.isBestSeller && <span className="badge badge-gold">🔥 Best Seller</span>}
          {savings > 0 && <span className="badge badge-gold">Save ${Math.round(savings)}</span>}
        </div>
        {oos && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/70">
            <span className="rounded-full bg-ink-900 px-3 py-1 text-xs font-semibold text-white">Sold out</span>
          </div>
        )}
      </Link>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="text-[11px] font-medium uppercase tracking-widest text-ink-400">
          {product.category}{product.storage ? ` · ${product.storage}` : ''}
        </div>
        <Link href={`/product/${product.id}`}>
          <h3 className="font-semibold leading-tight text-ink-900 hover:text-gold-700">{product.name}</h3>
        </Link>
        <RatingStars value={rating} count={reviews} />

        <div className="mt-auto flex items-end justify-between pt-2">
          <div>
            <div className="text-xl font-extrabold text-ink-900">{formatPrice(product.price, product.currency)}</div>
            {savings > 0 && (
              <div className="text-xs text-ink-400">
                <span className="line-through">{formatPrice(compareAt, product.currency)}</span>
                <span className="ml-1 text-emerald-600 font-semibold">-{Math.round((savings / compareAt) * 100)}%</span>
              </div>
            )}
          </div>
          <div className="text-[11px] text-ink-400">
            {oos ? 'Out of stock' : lowStock ? `Only ${product.stock} left` : 'In stock'}
          </div>
        </div>

        <div className="mt-3 flex gap-2">
          <Link href={`/product/${product.id}`} className="btn-ghost flex-1">Details</Link>
          <button
            type="button"
            onClick={() => cartService.addProductDirect(product, 1)}
            disabled={oos}
            className="btn-primary flex-1"
          >
            {oos ? 'Sold out' : 'Add to cart'}
          </button>
        </div>
      </div>
    </article>
  );
}
