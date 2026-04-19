'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Breadcrumbs from '@/components/Breadcrumbs';
import RatingStars from '@/components/RatingStars';
import { useCart } from '@/context/CartContext';

const tone = { A: 'badge-green', B: 'badge-amber', C: 'badge-rose' };
const conditionBlurb = {
  A: 'Excellent — minimal to no visible wear, battery ≥ 90%.',
  B: 'Very Good — light signs of use, battery ≥ 85%.',
  C: 'Good — visible wear but fully functional, battery ≥ 80%.',
};

export default function ProductDetailPage() {
  const { id } = useParams();
  const { add } = useCart();
  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      const [pRes, allRes] = await Promise.all([
        fetch(`/api/products/${id}`),
        fetch('/api/products'),
      ]);
      if (cancelled) return;
      if (pRes.status === 404) { setNotFound(true); setLoading(false); return; }
      const p = await pRes.json();
      const all = await allRes.json();
      setProduct(p);
      setRelated(all.filter((x) => x.id !== p.id && x.category === p.category).slice(0, 4));
      setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, [id]);

  function addToCart() {
    add(product, qty);
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  }

  if (loading) return <div className="mx-auto max-w-7xl px-4 py-20 text-ink-400">Loading product…</div>;
  if (notFound || !product) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <h1 className="text-2xl font-bold">Product not found</h1>
        <Link href="/shop" className="btn-primary mt-6 inline-flex">Back to shop</Link>
      </div>
    );
  }

  const oos = product.quantity <= 0;
  const msrp = Math.round((product.price * (product.category === 'iPhone' ? 1.35 : 1.2)) / 5) * 5 - 1;
  const savings = Math.max(0, msrp - product.price);

  const crumbs = [
    { label: 'Home', href: '/' },
    { label: product.category, href: `/shop?category=${encodeURIComponent(product.category)}` },
    { label: product.model },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <Breadcrumbs items={crumbs} />

      <div className="mt-6 grid gap-10 lg:grid-cols-[1.15fr_1fr]">
        {/* Gallery */}
        <div>
          <div className="card aspect-square overflow-hidden bg-cream">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={product.image || '/placeholder.svg'}
              alt={product.model}
              className="h-full w-full object-cover"
            />
          </div>
          <div className="mt-3 grid grid-cols-4 gap-3">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="card aspect-square overflow-hidden bg-cream">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={product.image || '/placeholder.svg'} alt="" className="h-full w-full object-cover opacity-70" />
              </div>
            ))}
          </div>
        </div>

        {/* Info */}
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className={`badge ${tone[product.condition] || 'badge-ink'}`}>Grade {product.condition}</span>
            <span className="badge badge-ink">{product.category}</span>
            {savings > 0 && <span className="badge badge-gold">Save ${savings} vs new</span>}
          </div>

          <h1 className="mt-3 text-3xl font-extrabold text-ink-900 md:text-4xl">{product.model}</h1>
          {product.storage && product.storage !== '-' && (
            <p className="mt-1 text-sm text-ink-500">Storage: <span className="font-semibold text-ink-700">{product.storage}</span></p>
          )}

          <div className="mt-3"><RatingStars value={4.7} count={142} /></div>

          <div className="mt-5 flex items-end gap-3">
            <span className="text-4xl font-extrabold text-ink-900">${product.price.toFixed(2)}</span>
            {savings > 0 && (
              <span className="text-sm text-ink-400">
                <span className="line-through">${msrp}</span>
                <span className="ml-2 font-semibold text-emerald-600">−{Math.round((savings / msrp) * 100)}%</span>
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-ink-400">Taxes & shipping calculated after order is placed.</p>

          {/* Condition callout */}
          <div className="mt-6 rounded-xl bg-cream p-4 ring-1 ring-ink-100">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-gold-600 ring-1 ring-ink-100">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9"/><path d="M12 8v5M12 16h.01"/></svg>
              </div>
              <div>
                <div className="text-sm font-semibold">Condition: Grade {product.condition}</div>
                <div className="text-sm text-ink-500">{conditionBlurb[product.condition]}</div>
              </div>
            </div>
          </div>

          {/* Quantity + CTA */}
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <div className="inline-flex items-center rounded-full border border-ink-100">
              <button
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                className="h-11 w-11 text-lg"
                aria-label="Decrease quantity"
              >−</button>
              <span className="w-10 text-center font-semibold">{qty}</span>
              <button
                onClick={() => setQty((q) => Math.min(product.quantity || 1, q + 1))}
                className="h-11 w-11 text-lg"
                aria-label="Increase quantity"
                disabled={qty >= product.quantity}
              >+</button>
            </div>
            <button
              onClick={addToCart}
              disabled={oos}
              className="btn-primary flex-1 min-w-[200px]"
            >
              {oos ? 'Sold out' : added ? 'Added to cart ✓' : 'Add to cart'}
            </button>
            <Link href="/cart" className="btn-ghost">Go to cart</Link>
          </div>

          <p className="mt-3 text-xs text-ink-500">
            {oos ? 'This variant is currently unavailable.' :
              product.quantity <= 3
                ? `Only ${product.quantity} left — ships same day.`
                : 'In stock — ships same business day.'}
          </p>

          {/* Trust rail */}
          <ul className="mt-6 grid grid-cols-2 gap-3 text-xs text-ink-700">
            {[
              ['Free shipping over $99', 'M3 7h13v10H3zM16 10h4l2 3v4h-6z'],
              ['12-month warranty', 'M12 2l8 4v6c0 5-3.5 9-8 10-4.5-1-8-5-8-10V6z'],
              ['30-day returns', 'M3 12a9 9 0 1018 0c0-3-1.5-6-4-7.5M3 12V6m0 6h6'],
              ['Tested & certified', 'M20 6L9 17l-5-5'],
            ].map(([label, path]) => (
              <li key={label} className="flex items-center gap-2 rounded-lg border border-ink-100 bg-white px-3 py-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gold-600"><path d={path}/></svg>
                {label}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Details tabs */}
      <section className="mt-16 grid gap-10 md:grid-cols-3">
        <div>
          <h3 className="text-lg font-bold">Description</h3>
          <p className="mt-2 text-sm text-ink-600">
            The {product.model}{product.storage && product.storage !== '-' ? ` in ${product.storage}` : ''} has been
            fully inspected, wiped, and refurbished by our in-house team. Each device is
            factory-reset, battery-verified, and ready to activate out of the box.
          </p>
        </div>

        <div>
          <h3 className="text-lg font-bold">What's in the box</h3>
          <ul className="mt-2 space-y-1 text-sm text-ink-600">
            <li>• {product.model}</li>
            <li>• Braided USB-C charging cable</li>
            <li>• Mansa Certificate of Inspection</li>
            <li>• Protective packaging</li>
          </ul>
        </div>

        <div>
          <h3 className="text-lg font-bold">Specifications</h3>
          <dl className="mt-2 divide-y divide-ink-100 rounded-xl border border-ink-100 bg-white text-sm">
            <SpecRow k="Model" v={product.model} />
            <SpecRow k="Storage" v={product.storage && product.storage !== '-' ? product.storage : '—'} />
            <SpecRow k="Condition" v={`Grade ${product.condition}`} />
            <SpecRow k="Category" v={product.category} />
            <SpecRow k="Warranty" v="12 months" />
          </dl>
        </div>
      </section>

      {related.length > 0 && (
        <section className="section">
          <h2 className="mb-6 text-2xl font-extrabold">You may also like</h2>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((r) => <RelatedCard key={r.id} product={r} />)}
          </div>
        </section>
      )}
    </div>
  );
}

function SpecRow({ k, v }) {
  return (
    <div className="flex justify-between gap-4 px-4 py-2.5">
      <dt className="text-ink-500">{k}</dt>
      <dd className="font-medium text-ink-900">{v}</dd>
    </div>
  );
}

function RelatedCard({ product }) {
  return (
    <Link href={`/product/${product.id}`} className="card group overflow-hidden transition hover:shadow-card-hover">
      <div className="aspect-square bg-cream">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={product.image || '/placeholder.svg'} alt={product.model} className="h-full w-full object-cover transition group-hover:scale-[1.03]" />
      </div>
      <div className="p-4">
        <div className="text-[11px] uppercase tracking-widest text-ink-400">{product.category}</div>
        <div className="mt-1 font-semibold text-ink-900">{product.model}</div>
        <div className="mt-1 text-gold-700 font-bold">${product.price.toFixed(2)}</div>
      </div>
    </Link>
  );
}
