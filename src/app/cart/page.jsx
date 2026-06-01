'use client';

import Link from 'next/link';
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight } from 'lucide-react';
import { useCartStore, selectItems, selectSubtotal } from '@/store/cartStore';
import { computeTotals } from '@/lib/cart';
import { formatPrice } from '@/lib/money';
import { deliveryFor, DELIVERY_FEE, FREE_DELIVERY_THRESHOLD } from '@/lib/shipping';

export default function CartPage() {
  const items = useCartStore(selectItems);
  const subtotal = useCartStore(selectSubtotal);
  const removeItem = useCartStore((s) => s.removeItem);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const totals = computeTotals(items);

  if (items.length === 0) {
    return (
      <div className="min-h-[60vh] bg-white">
        <div className="container-site flex flex-col items-center justify-center py-32 text-center">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-charcoal-100">
            <ShoppingBag size={32} className="text-charcoal-400" />
          </div>
          <h1 className="text-2xl font-black text-charcoal-900">Your cart is empty</h1>
          <p className="mt-2 text-sm text-charcoal-500">
            Add some products to get started.
          </p>
          <Link href="/shop" className="mt-8 btn-primary gap-2">
            Browse Products
            <ArrowRight size={15} />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-charcoal-50">
      <div className="container-site py-10">
        <h1 className="mb-8 text-3xl font-black tracking-tight text-charcoal-900">
          Your Cart
          <span className="ml-3 text-lg font-normal text-charcoal-400">
            ({items.reduce((n, i) => n + i.quantity, 0)} items)
          </span>
        </h1>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Items */}
          <div className="lg:col-span-2 space-y-3">
            {items.map((item) => (
              <div
                key={item.productId}
                className="flex gap-4 rounded-2xl border border-charcoal-100 bg-white p-4 shadow-card"
              >
                <Link href={`/product/${item.productId}`} className="flex-shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.image ?? '/placeholder.svg'}
                    alt={item.name}
                    className="h-20 w-20 rounded-xl object-cover bg-charcoal-50"
                  />
                </Link>

                <div className="flex flex-1 flex-col gap-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <Link href={`/product/${item.productId}`}>
                      <h3 className="text-sm font-semibold text-charcoal-900 leading-snug hover:text-charcoal-600">
                        {item.name}
                      </h3>
                    </Link>
                    <button
                      onClick={() => removeItem(item.productId)}
                      className="flex-shrink-0 rounded-lg p-1.5 text-charcoal-400 transition hover:bg-charcoal-50 hover:text-charcoal-900"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  {item.category && (
                    <p className="text-[11px] text-charcoal-400">{item.category}</p>
                  )}

                  <div className="mt-auto flex items-center justify-between pt-2">
                    {/* Qty controls */}
                    <div className="flex items-center rounded-lg border border-charcoal-200">
                      <button
                        onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                        className="flex h-8 w-8 items-center justify-center text-charcoal-600 hover:bg-charcoal-50 transition"
                      >
                        <Minus size={12} />
                      </button>
                      <span className="w-8 text-center text-sm font-semibold text-charcoal-900">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() =>
                          updateQuantity(
                            item.productId,
                            Math.min(item.quantity + 1, item.maxQuantity ?? 99),
                          )
                        }
                        className="flex h-8 w-8 items-center justify-center text-charcoal-600 hover:bg-charcoal-50 transition"
                      >
                        <Plus size={12} />
                      </button>
                    </div>

                    <span className="text-sm font-bold text-charcoal-900">
                      {formatPrice(item.unitPrice * item.quantity, 'USD')}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Order summary */}
          <div className="h-fit rounded-2xl border border-charcoal-100 bg-white p-6 shadow-card">
            <h2 className="mb-5 text-base font-bold text-charcoal-900">Order Summary</h2>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between text-charcoal-700">
                <span>Subtotal</span>
                <span>{formatPrice(subtotal, 'USD')}</span>
              </div>
              {totals.bundleDiscount > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Bundle discount</span>
                  <span>−{formatPrice(totals.bundleDiscount, 'USD')}</span>
                </div>
              )}
              <div className="flex justify-between text-charcoal-500">
                <span>Delivery</span>
                <span>{deliveryFor(subtotal) === 0 ? 'Free' : formatPrice(DELIVERY_FEE, 'USD')}</span>
              </div>
            </div>

            <div className="my-4 border-t border-charcoal-100" />

            <div className="flex justify-between text-base font-extrabold text-charcoal-900">
              <span>Total</span>
              <span>
                {formatPrice(
                  totals.total + deliveryFor(subtotal),
                  'USD',
                )}
              </span>
            </div>

            {subtotal < FREE_DELIVERY_THRESHOLD && (
              <p className="mt-2 text-xs text-charcoal-500">
                Add{' '}
                <span className="font-semibold text-charcoal-800">
                  {formatPrice(FREE_DELIVERY_THRESHOLD - subtotal, 'USD')}
                </span>{' '}
                more for free delivery.
              </p>
            )}

            <Link
              href="/checkout"
              className="mt-5 flex w-full items-center justify-center gap-2 btn-primary py-3.5 text-base"
            >
              Proceed to Checkout
              <ArrowRight size={16} />
            </Link>

            <Link
              href="/shop"
              className="mt-3 flex w-full items-center justify-center text-sm text-charcoal-500 hover:text-charcoal-900"
            >
              Continue shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
