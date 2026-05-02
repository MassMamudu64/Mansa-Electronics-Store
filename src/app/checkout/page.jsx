'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useState } from 'react';
import {
  useCartStore,
  selectItems,
  selectItemCount,
  selectSubtotal,
  useCartHasHydrated,
} from '@/store/cartStore';
import { cartService } from '@/services/cartService';
import Breadcrumbs from '@/components/Breadcrumbs';

const EMAIL_RX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function CheckoutPage() {
  const router = useRouter();
  const items = useCartStore(selectItems);
  const subtotal = useCartStore(selectSubtotal);
  const count = useCartStore(selectItemCount);
  const hydrated = useCartHasHydrated();
  const clear = () => cartService.clear();
  const [form, setForm] = useState({ name: '', email: '', phone: '', address: '' });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');

  if (!hydrated) return <div className="mx-auto max-w-7xl px-4 py-20 text-ink-400">Loading…</div>;

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <h1 className="text-2xl font-extrabold">Nothing to check out</h1>
        <p className="mt-2 text-ink-500">Your cart is empty.</p>
        <Link href="/shop" className="btn-primary mt-6 inline-flex">Browse products</Link>
      </div>
    );
  }

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
    if (errors[field]) setErrors((e) => ({ ...e, [field]: null }));
  }

  function validate() {
    const e = {};
    if (form.name.trim().length < 2) e.name = 'Enter your full name';
    if (!EMAIL_RX.test(form.email)) e.email = 'Enter a valid email';
    if (form.phone.replace(/\D/g, '').length < 7) e.phone = 'Enter a valid phone number';
    if (form.address.trim().length < 6) e.address = 'Enter a complete shipping address';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function onSubmit(ev) {
    ev.preventDefault();
    setServerError('');
    if (!validate()) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer: form,
          items: items.map((i) => ({ id: i.productId, quantity: i.quantity })),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setServerError(data.error || 'Something went wrong');
        setSubmitting(false);
        return;
      }
      clear();
      const params = new URLSearchParams({
        id: data.orderId,
        email: String(!!data.emailSent),
        total: String(data.total),
      });
      router.push(`/success?${params.toString()}`);
    } catch (err) {
      setServerError(err.message || 'Network error');
      setSubmitting(false);
    }
  }

  const shipping = subtotal >= 99 ? 0 : 9.99;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Cart', href: '/cart' }, { label: 'Checkout' }]} />

      {/* Step indicator */}
      <div className="mt-4 mb-6 flex items-center gap-3 text-xs font-semibold">
        <StepPill n={1} label="Cart" done />
        <StepConn />
        <StepPill n={2} label="Details" active />
        <StepConn />
        <StepPill n={3} label="Confirmation" />
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_400px]">
        <form className="card-elev space-y-5 p-6" onSubmit={onSubmit} noValidate>
          <div>
            <h1 className="text-2xl font-extrabold">Shipping details</h1>
            <p className="mt-1 text-sm text-ink-500">
              No payment collected on this page. We'll email you to confirm and arrange payment.
            </p>
          </div>

          <Field label="Full name" error={errors.name}>
            <input className={`input ${errors.name ? 'input-error' : ''}`} value={form.name} onChange={(e) => update('name', e.target.value)} autoComplete="name" required />
          </Field>

          <div className="grid gap-5 md:grid-cols-2">
            <Field label="Email" error={errors.email}>
              <input type="email" className={`input ${errors.email ? 'input-error' : ''}`} value={form.email} onChange={(e) => update('email', e.target.value)} autoComplete="email" required />
            </Field>
            <Field label="Phone" error={errors.phone}>
              <input type="tel" className={`input ${errors.phone ? 'input-error' : ''}`} value={form.phone} onChange={(e) => update('phone', e.target.value)} autoComplete="tel" required />
            </Field>
          </div>

          <Field label="Shipping address" error={errors.address} help="Street, city, state/province, postal code, country.">
            <textarea className={`input min-h-[96px] ${errors.address ? 'input-error' : ''}`} value={form.address} onChange={(e) => update('address', e.target.value)} autoComplete="street-address" required />
          </Field>

          {serverError && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
              {serverError}
            </div>
          )}

          <button type="submit" className="btn-primary w-full text-base py-3" disabled={submitting}>
            {submitting ? 'Submitting order…' : `Submit order · $${(subtotal + shipping).toFixed(2)}`}
          </button>

          <div className="flex items-center gap-3 rounded-lg border border-ink-100 bg-cream p-3 text-xs text-ink-500">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gold-600 shrink-0">
              <rect x="3" y="11" width="18" height="10" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
            </svg>
            Your details are only used to fulfill this order. No payment info is collected here.
          </div>
        </form>

        <aside>
          <div className="card-elev sticky top-32 p-6">
            <h2 className="text-lg font-bold">Your order</h2>

            <ul className="mt-4 space-y-3">
              {items.map((i) => (
                <li key={i.productId} className="flex items-center gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={i.image || '/placeholder.svg'} alt={i.name} className="h-14 w-14 rounded-lg object-cover bg-cream" />
                  <div className="flex-1 text-sm">
                    <div className="font-semibold text-ink-900">{i.name}</div>
                    <div className="text-xs text-ink-400">
                      {i.storage && i.storage !== '-' ? `${i.storage} · ` : ''}
                      {i.condition ? `Grade ${i.condition} · ` : ''}Qty {i.quantity}
                    </div>
                  </div>
                  <div className="text-sm font-semibold">${(i.unitPrice * i.quantity).toFixed(2)}</div>
                </li>
              ))}
            </ul>

            <div className="mt-5 hr" />

            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between"><dt className="text-ink-500">Subtotal ({count})</dt><dd className="font-medium">${subtotal.toFixed(2)}</dd></div>
              <div className="flex justify-between"><dt className="text-ink-500">Shipping</dt><dd className="font-medium">{shipping === 0 ? 'Free' : `$${shipping.toFixed(2)}`}</dd></div>
            </dl>

            <div className="my-4 hr" />

            <div className="flex items-center justify-between text-base font-extrabold">
              <span>Total</span>
              <span className="text-gold-700">${(subtotal + shipping).toFixed(2)}</span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Field({ label, error, children, help }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold uppercase tracking-widest text-ink-500">{label}</span>
      {children}
      {help && !error && <span className="mt-1 block text-xs text-ink-400">{help}</span>}
      {error && <span className="mt-1 block text-xs text-rose-600">{error}</span>}
    </label>
  );
}

function StepPill({ n, label, active, done }) {
  return (
    <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 ${
      active ? 'bg-ink-900 text-white'
      : done ? 'bg-emerald-50 text-emerald-700'
      : 'bg-ink-50 text-ink-400'
    }`}>
      <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] ${
        active ? 'bg-white/20' : done ? 'bg-emerald-600 text-white' : 'bg-ink-100 text-ink-500'
      }`}>{done ? '✓' : n}</span>
      {label}
    </span>
  );
}
function StepConn() { return <span className="h-px flex-1 max-w-8 bg-ink-100" />; }
