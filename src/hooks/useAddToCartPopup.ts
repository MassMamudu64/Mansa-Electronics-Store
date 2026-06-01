'use client';

import { useCallback } from 'react';
import { useCartStore } from '@/store/cartStore';
import { toCartItem, type LooseProductInput } from '@/lib/cart';

export type PopupProductInput = LooseProductInput & { currency?: string };

export function useAddToCartPopup() {
  const popupItem = useCartStore((s) => s.popupItem);
  const isOpen = useCartStore((s) => s.isPopupOpen);
  const openPopup = useCartStore((s) => s.openPopup);
  const closePopup = useCartStore((s) => s.closePopup);
  const addItem = useCartStore((s) => s.addItem);

  // Single entry point for callsites: adds to cart, then opens the popup.
  const addAndShow = useCallback(
    (product: PopupProductInput, quantity = 1) => {
      const item = toCartItem(product, quantity);
      addItem(item);
      openPopup(item);
    },
    [addItem, openPopup],
  );

  return { popupItem, isOpen, openPopup, closePopup, addAndShow };
}
