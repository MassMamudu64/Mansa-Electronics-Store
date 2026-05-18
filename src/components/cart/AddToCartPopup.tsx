'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { Check, X, ArrowRight } from 'lucide-react';
import { useCartStore, selectSubtotal, selectItemCount } from '@/store/cartStore';
import { useAddToCartPopup } from '@/hooks/useAddToCartPopup';
import { formatPrice } from '@/lib/money';

interface AddToCartPopupProps {
  /** Auto-close duration in ms. Set to 0 to disable. Default 4000. */
  autoCloseMs?: number;
}

export default function AddToCartPopup({ autoCloseMs = 4000 }: AddToCartPopupProps) {
  const { popupItem, isOpen, closePopup } = useAddToCartPopup();
  const subtotal = useCartStore(selectSubtotal);
  const itemCount = useCartStore(selectItemCount);
  const cardRef = useRef<HTMLDivElement>(null);

  // Auto-close. Restarts whenever a new item opens the popup.
  useEffect(() => {
    if (!isOpen || !autoCloseMs) return;
    const id = window.setTimeout(closePopup, autoCloseMs);
    return () => window.clearTimeout(id);
  }, [isOpen, popupItem, autoCloseMs, closePopup]);

  // ESC to close.
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closePopup();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, closePopup]);

  // Click-outside (covers desktop slide-in where there's no full backdrop).
  // Defer attaching one tick so the click that opened the popup doesn't immediately close it.
  useEffect(() => {
    if (!isOpen) return;
    let attached = false;
    const onMouseDown = (e: MouseEvent) => {
      if (cardRef.current && !cardRef.current.contains(e.target as Node)) {
        closePopup();
      }
    };
    const id = window.setTimeout(() => {
      window.addEventListener('mousedown', onMouseDown);
      attached = true;
    }, 0);
    return () => {
      window.clearTimeout(id);
      if (attached) window.removeEventListener('mousedown', onMouseDown);
    };
  }, [isOpen, closePopup]);

  // Render nothing until a product has ever been added (avoids empty DOM on first paint).
  if (!popupItem) return null;

  const lineTotal = popupItem.unitPrice * popupItem.quantity;

  return (
    <div
      aria-hidden={!isOpen}
      className={`fixed inset-0 z-[60] ${
        isOpen ? 'pointer-events-auto' : 'pointer-events-none'
      }`}
    >
      {/* Dim backdrop — mobile only. Tap to dismiss. */}
      <button
        type="button"
        aria-label="Close confirmation"
        tabIndex={isOpen ? 0 : -1}
        onClick={closePopup}
        className={`absolute inset-0 bg-charcoal-900/40 transition-opacity duration-200 md:hidden ${
          isOpen ? 'opacity-100' : 'opacity-0'
        }`}
      />

      {/* Sheet on mobile, slide-in card top-right on md+ */}
      <div
        ref={cardRef}
        role="dialog"
        aria-modal="false"
        aria-label="Item added to cart"
        className={`absolute inset-x-0 bottom-0 transform transition-all duration-300 ease-out md:bottom-auto md:left-auto md:right-6 md:top-6 md:inset-x-auto md:w-[380px] ${
          isOpen
            ? 'translate-y-0 opacity-100 md:translate-x-0'
            : 'translate-y-full opacity-0 md:translate-y-0 md:translate-x-[120%]'
        }`}
      >
        <div className="relative rounded-t-3xl bg-white p-5 shadow-product-hover ring-1 ring-charcoal-100 md:rounded-2xl">
          {/* Drag handle (mobile only) */}
          <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-charcoal-200 md:hidden" />

          {/* Close button */}
          <button
            type="button"
            onClick={closePopup}
            aria-label="Close"
            className="absolute right-3 top-3 rounded-full p-1.5 text-charcoal-400 transition hover:bg-charcoal-50 hover:text-charcoal-900"
          >
            <X size={16} />
          </button>

          {/* Header */}
          <div className="flex items-center gap-2 pr-8">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
              <Check size={14} strokeWidth={3} />
            </span>
            <p className="text-sm font-bold text-charcoal-900">Added to Cart</p>
          </div>

          {/* Product row */}
          <div className="mt-4 flex gap-3 rounded-2xl border border-charcoal-100 bg-charcoal-50/60 p-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={popupItem.image || '/placeholder.svg'}
              alt={popupItem.name}
              className="h-16 w-16 flex-shrink-0 rounded-xl bg-white object-cover"
            />
            <div className="flex min-w-0 flex-1 flex-col">
              {popupItem.category && (
                <p className="truncate text-[10px] font-medium uppercase tracking-wider text-charcoal-400">
                  {popupItem.category}
                </p>
              )}
              <h4 className="truncate text-sm font-semibold text-charcoal-900">
                {popupItem.name}
              </h4>
              <p className="mt-0.5 text-xs text-charcoal-500">
                Qty {popupItem.quantity} &middot; {formatPrice(popupItem.unitPrice, 'USD')}
              </p>
              <p className="mt-auto pt-1 text-sm font-bold text-charcoal-900">
                {formatPrice(lineTotal, 'USD')}
              </p>
            </div>
          </div>

          {/* Cart summary */}
          <div className="mt-3 flex items-baseline justify-between text-sm">
            <span className="text-charcoal-500">
              Cart subtotal
              <span className="ml-1 text-xs text-charcoal-400">
                ({itemCount} {itemCount === 1 ? 'item' : 'items'})
              </span>
            </span>
            <span className="font-extrabold text-charcoal-900">
              {formatPrice(subtotal, 'USD')}
            </span>
          </div>

          {/* Actions */}
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={closePopup}
              className="btn-secondary flex-1 px-3 py-2.5 text-xs"
            >
              Continue Shopping
            </button>
            <Link
              href="/cart"
              onClick={closePopup}
              className="btn-primary flex-1 gap-1.5 px-3 py-2.5 text-xs"
            >
              Go to Cart
              <ArrowRight size={13} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
