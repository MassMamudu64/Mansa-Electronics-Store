'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { ChevronLeft, ShieldCheck, Loader2 } from 'lucide-react';
import { useCartStore, selectItems, selectSubtotal } from '@/store/cartStore';
import { computeTotals } from '@/lib/cart';
import { formatPrice } from '@/lib/money';
import { deliveryFor } from '@/lib/shipping';

const FIELDS = [
  { name: 'name',    label: 'Full Name',       type: 'text',  placeholder: 'Jane Doe',              required: true },
  { name: 'phone',   label: 'Phone Number',    type: 'tel',   placeholder: '+1 234 567 8901',       required: true },
  { name: 'email',   label: 'Email Address',   type: 'email', placeholder: 'jane@example.com',      required: true },
  { name: 'address', label: 'Delivery Address', type: 'text', placeholder: '123 Main Street, City', required: true },
  { name: 'notes',   label: 'Order Notes',     type: 'text',  placeholder: 'Any special instructions… (optional)', required: false },
];

export default function CheckoutPage() {
  const router = useRouter();
  const items = useCartStore(selectItems);
  const subtotal = useCartStore(selectSubtotal);
  const clearCart = useCartStore((s) => s.clear);
  const totals = computeTotals(items);
  const delivery = deliveryFor(subtotal);
  const grandTotal = totals.total + delivery;

  const [form, setForm] = useState({ name: '', phone: '', email: '', address: '', notes: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  if (items.length === 0) {
    return (
      <div className="min-h-[60vh] bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl font-black text-charcoal-900">Your cart is empty</p>
          <Link href="/shop" className="mt-4 btn-primary inline-flex">Shop Now</Link>
        </div>
      </div>
    );
  }

  function validate() {
    const errs = {};
    if (!form.name.trim() || form.name.trim().length < 2) errs.name = 'Enter your full name';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Enter a valid email';
    if (form.phone.replace(/\D/g, '').length < 7) errs.phone = 'Enter a valid phone number';
    if (!form.address.trim() || form.address.trim().length < 6) errs.address = 'Enter your delivery address';
    return errs;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setLoading(true);

    try {
      const payload = {
        customer: {
          name: form.name.trim(),
          phone: form.phone.trim(),
          email: form.email.trim(),
          address: form.address.trim(),
          notes: form.notes.trim(),
        },
        items: items.map((i) => ({ id: i.productId, quantity: i.quantity })),
      };

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error ?? 'Order failed. Please try again.');
        setLoading(false);
        return;
      }

      // Store confirmation data for the success page
      sessionStorage.setItem(
        'mansa:last_order',
        JSON.stringify({
          orderId: data.orderId,
          orderRef: data.orderRef ?? data.orderId,
          customer: payload.customer,
          items: items.map((i) => ({ name: i.name, quantity: i.quantity, unitPrice: i.unitPrice })),
          subtotal: totals.subtotal,
          delivery,
          total: grandTotal,
          emailSent: data.emailSent,
          placedAt: new Date().toISOString(),
        }),
      );

      clearCart();
      router.push('/success');
    } catch (err) {
      toast.error('Something went wrong. Please try again.');
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-charcoal-50">
      <div className="container-site py-10">
        <Link
          href="/cart"
          className="mb-8 inline-flex items-center gap-1.5 text-sm text-charcoal-500 hover:text-charcoal-900"
        >
          <ChevronLeft size={15} /> Back to Cart
        </Link>

        <h1 className="mb-8 text-3xl font-black tracking-tight text-charcoal-900">Checkout</h1>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Form */}
            <div className="lg:col-span-2">
              <div className="rounded-2xl border border-charcoal-100 bg-white p-6 shadow-card">
                <h2 className="mb-6 text-base font-bold text-charcoal-900">Delivery Information</h2>

                <div className="grid gap-5 sm:grid-cols-2">
                  {FIELDS.map(({ name, label, type, placeholder, required }) => (
                    <div key={name} className={name === 'address' || name === 'notes' ? 'sm:col-span-2' : ''}>
                      <label htmlFor={name} className="label">
                        {label}
                        {required && <span className="ml-0.5 text-red-500">*</span>}
                      </label>
                      <input
                        id={name}
                        type={type}
                        value={form[name]}
                        onChange={(e) => setForm((f) => ({ ...f, [name]: e.target.value }))}
                        placeholder={placeholder}
                        className={`input ${errors[name] ? 'input-error' : ''}`}
                      />
                      {errors[name] && (
                        <p className="mt-1 text-xs text-red-500">{errors[name]}</p>
                      )}
                    </div>
                  ))}
                </div>

                <div className="mt-6 rounded-xl bg-charcoal-50 p-4">
                  <p className="text-xs text-charcoal-500 leading-relaxed">
                    <span className="font-semibold text-charcoal-700">Cash on Delivery:</span>{' '}
                    Pay when your order arrives. You will receive a confirmation email with your order details shortly after placing your order.
                  </p>
                </div>
              </div>
            </div>

            {/* Summary */}
            <div className="h-fit space-y-4">
              <div className="rounded-2xl border border-charcoal-100 bg-white p-6 shadow-card">
                <h2 className="mb-4 text-base font-bold text-charcoal-900">Order Summary</h2>

                <div className="space-y-3">
                  {items.map((item) => (
                    <div key={item.productId} className="flex items-center gap-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.image ?? '/placeholder.svg'}
                        alt={item.name}
                        className="h-12 w-12 flex-shrink-0 rounded-xl object-cover bg-charcoal-50"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="truncate text-sm font-medium text-charcoal-800">{item.name}</p>
                        <p className="text-xs text-charcoal-400">Qty: {item.quantity}</p>
                      </div>
                      <span className="flex-shrink-0 text-sm font-semibold text-charcoal-900">
                        {formatPrice(item.unitPrice * item.quantity, 'USD')}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="my-4 border-t border-charcoal-100" />

                <div className="space-y-2 text-sm text-charcoal-700">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>{formatPrice(totals.subtotal, 'USD')}</span>
                  </div>
                  {totals.bundleDiscount > 0 && (
                    <div className="flex justify-between text-emerald-600">
                      <span>Bundle discount</span>
                      <span>−{formatPrice(totals.bundleDiscount, 'USD')}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-charcoal-500">
                    <span>Delivery</span>
                    <span>{delivery === 0 ? 'Free' : formatPrice(delivery, 'USD')}</span>
                  </div>
                </div>

                <div className="my-3 border-t border-charcoal-100" />

                <div className="flex justify-between text-base font-extrabold text-charcoal-900">
                  <span>Total</span>
                  <span>{formatPrice(grandTotal, 'USD')}</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full gap-2 py-4 text-base"
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Placing Order…
                  </>
                ) : (
                  <>
                    <ShieldCheck size={16} />
                    Place Order
                  </>
                )}
              </button>

              <p className="text-center text-xs text-charcoal-400">
                By placing your order you agree to our Terms of Service.
              </p>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
