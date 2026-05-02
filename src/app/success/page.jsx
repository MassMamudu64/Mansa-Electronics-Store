'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, Mail, ArrowRight, Package } from 'lucide-react';
import { formatPrice } from '@/lib/money';

export default function SuccessPage() {
  const [order, setOrder] = useState(null);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('mansa:last_order');
      if (raw) {
        setOrder(JSON.parse(raw));
        sessionStorage.removeItem('mansa:last_order');
      }
    } catch {
      // no-op
    }
  }, []);

  return (
    <div className="min-h-screen bg-charcoal-50">
      <div className="container-site py-16">
        <div className="mx-auto max-w-2xl">

          {/* Success header */}
          <div className="mb-8 flex flex-col items-center text-center">
            <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100">
              <CheckCircle2 size={40} className="text-emerald-600" />
            </div>
            <h1 className="text-3xl font-black text-charcoal-900">Order Placed!</h1>
            <p className="mt-2 text-charcoal-500">
              Your order has been confirmed. We&apos;ll be in touch shortly.
            </p>
            {order?.emailSent && (
              <div className="mt-3 flex items-center gap-1.5 text-sm text-charcoal-500">
                <Mail size={14} />
                Confirmation details sent to {order.customer?.email}
              </div>
            )}
          </div>

          {order ? (
            <div className="space-y-4">
              {/* Order reference */}
              <div className="rounded-2xl border border-charcoal-100 bg-white p-6 shadow-card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="eyebrow mb-1">Order Reference</p>
                    <p className="text-2xl font-black tracking-wider text-charcoal-900">
                      {order.orderRef}
                    </p>
                  </div>
                  <Package size={32} className="text-charcoal-300" />
                </div>
                <p className="mt-2 text-xs text-charcoal-500">
                  Placed {new Date(order.placedAt).toLocaleString('en-US', { dateStyle: 'long', timeStyle: 'short' })}
                </p>
              </div>

              {/* Customer details */}
              <div className="rounded-2xl border border-charcoal-100 bg-white p-6 shadow-card">
                <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-charcoal-500">
                  Delivery Details
                </h2>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {[
                    { label: 'Name', value: order.customer.name },
                    { label: 'Phone', value: order.customer.phone },
                    { label: 'Email', value: order.customer.email },
                    { label: 'Address', value: order.customer.address },
                  ].map(({ label, value }) => (
                    <div key={label}>
                      <p className="text-[11px] font-medium uppercase tracking-wide text-charcoal-400">{label}</p>
                      <p className="mt-0.5 font-medium text-charcoal-900">{value}</p>
                    </div>
                  ))}
                </div>
                {order.customer.notes && (
                  <div className="mt-3 rounded-xl bg-charcoal-50 px-4 py-3 text-sm text-charcoal-600">
                    <span className="font-medium text-charcoal-700">Notes: </span>
                    {order.customer.notes}
                  </div>
                )}
              </div>

              {/* Order items */}
              <div className="rounded-2xl border border-charcoal-100 bg-white p-6 shadow-card">
                <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-charcoal-500">
                  Items Ordered
                </h2>
                <div className="space-y-3">
                  {order.items.map((item, i) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <div>
                        <p className="font-medium text-charcoal-900">{item.name}</p>
                        <p className="text-charcoal-400">Qty: {item.quantity}</p>
                      </div>
                      <span className="font-semibold text-charcoal-900">
                        {formatPrice(item.unitPrice * item.quantity, 'USD')}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="my-4 border-t border-charcoal-100" />

                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between text-charcoal-600">
                    <span>Subtotal</span>
                    <span>{formatPrice(order.subtotal, 'USD')}</span>
                  </div>
                  <div className="flex justify-between text-charcoal-600">
                    <span>Delivery</span>
                    <span>{order.delivery === 0 ? 'Free' : formatPrice(order.delivery, 'USD')}</span>
                  </div>
                  <div className="flex justify-between text-base font-extrabold text-charcoal-900">
                    <span>Total</span>
                    <span>{formatPrice(order.total, 'USD')}</span>
                  </div>
                </div>
              </div>

              {/* Next steps */}
              <div className="rounded-2xl border border-charcoal-100 bg-charcoal-900 p-6 text-white">
                <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-charcoal-400">
                  What Happens Next?
                </h2>
                <ol className="space-y-2 text-sm text-charcoal-300">
                  <li className="flex gap-2.5">
                    <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-charcoal-700 text-[10px] font-bold text-white">1</span>
                    Our team reviews your order and contacts you to confirm delivery details.
                  </li>
                  <li className="flex gap-2.5">
                    <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-charcoal-700 text-[10px] font-bold text-white">2</span>
                    Your items are packed and dispatched. You&apos;ll receive tracking info.
                  </li>
                  <li className="flex gap-2.5">
                    <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-charcoal-700 text-[10px] font-bold text-white">3</span>
                    Pay cash when your order arrives at your door.
                  </li>
                </ol>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-charcoal-100 bg-white p-8 text-center shadow-card">
              <p className="text-charcoal-500">Your order has been placed successfully.</p>
              <p className="mt-1 text-sm text-charcoal-400">
                Check your email for confirmation details.
              </p>
            </div>
          )}

          <div className="mt-8 flex justify-center">
            <Link href="/shop" className="btn-primary gap-2">
              Continue Shopping
              <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
