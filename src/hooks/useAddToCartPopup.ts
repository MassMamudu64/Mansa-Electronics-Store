'use client';

import { useCallback } from 'react';
import { useCartStore } from '@/store/cartStore';
import { cartService } from '@/services/cartService';
import type { CartItem } from '@/types/cart';

// Loose product shape — matches what ProductCard / product detail / API pass around.
export interface PopupProductInput {
  id: string;
  slug?: string;
  name?: string;
  model?: string;
  price: number;
  image?: string;
  images?: { url: string }[];
  stock?: number;
  storage?: string;
  condition?: string;
  category?: string;
  currency?: string;
}

function toCartItem(p: PopupProductInput, quantity: number): CartItem {
  return {
    productId: p.id,
    slug: p.slug ?? p.id,
    name: p.name ?? p.model ?? 'Item',
    image: p.images?.[0]?.url ?? p.image ?? '/placeholder.svg',
    unitPrice: p.price,
    quantity,
    maxQuantity: p.stock,
    storage: p.storage,
    condition: p.condition,
    category: p.category,
  };
}

export function useAddToCartPopup() {
  const popupItem = useCartStore((s) => s.popupItem);
  const isOpen = useCartStore((s) => s.isPopupOpen);
  const openPopup = useCartStore((s) => s.openPopup);
  const closePopup = useCartStore((s) => s.closePopup);

  // Single entry point for callsites: delegates to existing cart logic, then opens the popup.
  const addAndShow = useCallback(
    (product: PopupProductInput, quantity = 1) => {
      cartService.addProductDirect(product, quantity);
      openPopup(toCartItem(product, quantity));
    },
    [openPopup],
  );

  return { popupItem, isOpen, openPopup, closePopup, addAndShow };
}
