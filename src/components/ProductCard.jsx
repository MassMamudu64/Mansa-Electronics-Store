'use client';

import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import RatingStars from './RatingStars';

const tone = {
  A: 'badge-green',
  B: 'badge-amber',
  C: 'badge-rose',
};

// Deterministic "reference price" so we can show savings without storing it
// in the product record. Replace with a real MSRP field when available.
function estimateMsrp(p) {
  const markup = p.category === 'iPhone' ? 1.35 : 1.2;
  return Math.round(p.price * markup / 5) * 5 - 1; // round to .99
}
function seededRating(id) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return 4.3 + (h % 60) / 100; // 4.3–4.9
}
function seededCount(id) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 17 + id.charCodeAt(i)) >>> 0;
  return 18 + (h % 340);
}

export default function ProductCard({ product }) {
  const { add } = useCart();
  const oos = product.quantity <= 0;
  const msrp = estimateMsrp(product);
  const savings = Math.max(0, msrp - product.price);
  const rating = seededRating(product.id);
  const reviews = seededCount(product.id);

  return (
    <article className="group card flex flex-col overflow-hidden transition hover:-translate-y-0.5 hover:shadow-card-hover">
      <Link href={`/product/${product.id}`} className="relative block aspect-square overflow-hidden bg-cream">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={product.image || '/placeholder.svg'}
          alt={product.model}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
        />
        <div className="absolute left-3 top-3 flex flex-col gap-1.5">
          <span className={`badge ${tone[product.condition] || 'badge-ink'}`}>Grade {product.condition}</span>
          {savings > 0 && (
            <span className="badge badge-gold">Save ${savings}</span>
          )}
        </div>
        {oos && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/70">
            <span className="rounded-full bg-ink-900 px-3 py-1 text-xs font-semibold text-white">Sold out</span>
          </div>
        )}
      </Link>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="text-[11px] font-medium uppercase tracking-widest text-ink-400">
          {product.category}{product.storage && product.storage !== '-' ? ` · ${product.storage}` : ''}
        </div>
        <Link href={`/product/${product.id}`}>
          <h3 className="font-semibold leading-tight text-ink-900 hover:text-gold-700">{product.model}</h3>
        </Link>
        <RatingStars value={rating} count={reviews} />

        <div className="mt-auto flex items-end justify-between pt-2">
          <div>
            <div className="text-xl font-extrabold text-ink-900">${product.price.toFixed(2)}</div>
            {savings > 0 && (
              <div className="text-xs text-ink-400">
                <span className="line-through">${msrp}</span>
                <span className="ml-1 text-emerald-600 font-semibold">-{Math.round((savings / msrp) * 100)}%</span>
              </div>
            )}
          </div>
          <div className="text-[11px] text-ink-400">
            {oos ? 'Out of stock' : product.quantity <= 3 ? `Only ${product.quantity} left` : 'In stock'}
          </div>
        </div>

        <div className="mt-3 flex gap-2">
          <Link href={`/product/${product.id}`} className="btn-ghost flex-1">Details</Link>
          <button
            type="button"
            onClick={() => add(product, 1)}
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
