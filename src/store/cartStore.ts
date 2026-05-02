'use client';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { useEffect, useState } from 'react';
import type { CartItem } from '@/types/cart';

interface CartState {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  removeItem: (productId: string) => void;
  clear: () => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],

      addItem: (item) =>
        set((state) => {
          const existing = state.items.find((i) => i.productId === item.productId);
          if (existing) {
            const cap = item.maxQuantity ?? existing.maxQuantity ?? Number.POSITIVE_INFINITY;
            const nextQty = Math.min(existing.quantity + item.quantity, cap);
            return {
              items: state.items.map((i) =>
                i.productId === item.productId ? { ...i, quantity: nextQty } : i,
              ),
            };
          }
          const cap = item.maxQuantity ?? Number.POSITIVE_INFINITY;
          return {
            items: [...state.items, { ...item, quantity: Math.min(item.quantity, cap) }],
          };
        }),

      updateQuantity: (productId, quantity) =>
        set((state) => ({
          items: state.items
            .map((i) => {
              if (i.productId !== productId) return i;
              const cap = i.maxQuantity ?? Number.POSITIVE_INFINITY;
              return { ...i, quantity: Math.max(0, Math.min(quantity, cap)) };
            })
            .filter((i) => i.quantity > 0),
        })),

      removeItem: (productId) =>
        set((state) => ({ items: state.items.filter((i) => i.productId !== productId) })),

      clear: () => set({ items: [] }),
    }),
    {
      name: 'mansa:cart',
      storage: createJSONStorage(() => localStorage),
      version: 1,
    },
  ),
);

// Selectors — components subscribe to these slices to avoid wide re-renders.
export const selectItems = (s: CartState) => s.items;
export const selectItemCount = (s: CartState) =>
  s.items.reduce((n, i) => n + i.quantity, 0);
export const selectSubtotal = (s: CartState) =>
  s.items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);

// Persist hydration helper. Avoids SSR/CSR mismatch flashes.
export function useCartHasHydrated(): boolean {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    const unsub = useCartStore.persist.onFinishHydration(() => setHydrated(true));
    setHydrated(useCartStore.persist.hasHydrated());
    return unsub;
  }, []);
  return hydrated;
}
