'use client';

import Link from 'next/link';
import {
  useCartStore,
  selectItems,
  selectItemCount,
  selectSubtotal,
  useCartHasHydrated,
} from '@/store/cartStore';
import { cartService } from '@/services/cartService';
import Breadcrumbs from '@/components/Breadcrumbs';

export default function CartPage() {
  const items = useCartStore(selectItems);
  const subtotal = useCartStore(selectSubtotal);
  const count = useCartStore(selectItemCount);
  const hydrated = useCartHasHydrated();
  const setQty = (productId, qty) => cartService.updateQuantity(productId, qty);
  const remove = (productId) => cartService.remove(productId);

  if (!hydrated) {
    return <div className="mx-auto max-w-7xl px-4 py-20 text-ink-400">Loading cart…</div>;
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-cream ring-1 ring-ink-100">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gold-600">
            <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
            <path d="M1 1h4l2.7 13.4a2 2 0 002 1.6h9.7a2 2 0 002-1.6L23 6H6"/>
          </svg>
        </div>
        <h1 className="text-2xl font-extrabold">Your cart is empty</h1>
        <p className="mt-2 text-ink-500">Looks like you haven't added anything yet.</p>
        <Link href="/shop" className="btn-primary mt-6 inline-flex">Start shopping</Link>
      </div>
    );
  }

  const shippingNote = subtotal >= 99 ? 'Free' : `$9.99 — add $${(99 - subtotal).toFixed(2)} for free shipping`;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Cart' }]} />
      <h1 className="mt-3 mb-8 text-3xl font-extrabold text-ink-900 md:text-4xl">Your cart</h1>

      <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
        <section>
          <ul className="space-y-3">
            {items.map((i) => (
              <li key={i.productId} className="card flex items-center gap-4 p-4">
                <Link href={`/product/${i.productId}`} className="shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={i.image || '/placeholder.svg'} alt={i.name} className="h-24 w-24 rounded-lg object-cover bg-cream" />
                </Link>
                <div className="flex-1">
                  {(i.storage || i.condition) && (
                    <div className="text-[11px] uppercase tracking-widest text-ink-400">
                      {i.storage && i.storage !== '-' ? `${i.storage} · ` : ''}
                      {i.condition ? `Grade ${i.condition}` : ''}
                    </div>
                  )}
                  <Link href={`/product/${i.productId}`} className="font-semibold text-ink-900 hover:text-gold-700">{i.name}</Link>
                  <div className="mt-1 text-sm text-ink-500">${i.unitPrice.toFixed(2)} each</div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="inline-flex items-center rounded-full border border-ink-100">
                    <button className="h-9 w-9" onClick={() => setQty(i.productId, i.quantity - 1)} aria-label="Decrease">−</button>
                    <span className="w-8 text-center text-sm font-semibold">{i.quantity}</span>
                    <button className="h-9 w-9" onClick={() => setQty(i.productId, i.quantity + 1)} aria-label="Increase" disabled={i.maxQuantity != null && i.quantity >= i.maxQuantity}>+</button>
                  </div>
                  <div className="w-20 text-right font-semibold">${(i.unitPrice * i.quantity).toFixed(2)}</div>
                  <button className="text-xs text-ink-400 hover:text-rose-600" onClick={() => remove(i.productId)} aria-label="Remove">
                    ✕
                  </button>
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-6 text-sm text-ink-500">
            Have a question? <Link href="/#faq" className="text-gold-700 font-semibold hover:underline">Read our FAQ</Link>.
          </div>
        </section>

        <aside>
          <div className="card-elev sticky top-32 p-6">
            <h2 className="text-lg font-bold">Order summary</h2>
            <dl className="mt-4 space-y-2 text-sm">
              <Row k={`Subtotal (${count} item${count !== 1 ? 's' : ''})`} v={`$${subtotal.toFixed(2)}`} />
              <Row k="Shipping" v={shippingNote} muted />
              <Row k="Taxes" v="Calculated at fulfillment" muted />
            </dl>
            <div className="my-4 hr" />
            <div className="flex items-center justify-between text-base font-extrabold">
              <span>Total</span>
              <span className="text-gold-700">${subtotal.toFixed(2)}</span>
            </div>
            <Link href="/checkout" className="btn-primary mt-6 w-full">Checkout</Link>
            <Link href="/shop" className="btn-ghost mt-2 w-full">Continue shopping</Link>

            <ul className="mt-6 space-y-2 text-xs text-ink-500">
              <li className="flex items-center gap-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gold-600"><path d="M20 6L9 17l-5-5"/></svg>
                12-month warranty
              </li>
              <li className="flex items-center gap-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gold-600"><path d="M20 6L9 17l-5-5"/></svg>
                30-day returns
              </li>
              <li className="flex items-center gap-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gold-600"><path d="M20 6L9 17l-5-5"/></svg>
                Ships worldwide
              </li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Row({ k, v, muted }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-ink-500">{k}</dt>
      <dd className={muted ? 'text-ink-500' : 'text-ink-900 font-medium'}>{v}</dd>
    </div>
  );
}
