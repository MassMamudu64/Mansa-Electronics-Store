'use client';

// Cart state lives entirely on the client and is mirrored to localStorage so
// it survives refreshes. The server re-validates prices and stock at checkout.
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const STORAGE_KEY = 'mansa_cart_v1';
const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {}
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, hydrated]);

  const add = useCallback((product, qty = 1) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.id === product.id);
      const cap = product.quantity; // don't let the cart exceed stock we've seen
      if (existing) {
        const nextQty = Math.min(existing.quantity + qty, cap);
        return prev.map((i) => (i.id === product.id ? { ...i, quantity: nextQty } : i));
      }
      return [...prev, {
        id: product.id,
        model: product.model,
        storage: product.storage,
        condition: product.condition,
        price: product.price,
        image: product.image,
        quantity: Math.min(qty, cap),
        maxQuantity: cap,
      }];
    });
  }, []);

  const remove = useCallback((id) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const setQty = useCallback((id, qty) => {
    setItems((prev) => prev
      .map((i) => (i.id === id ? { ...i, quantity: Math.max(1, Math.min(qty, i.maxQuantity || qty)) } : i))
      .filter((i) => i.quantity > 0));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const subtotal = useMemo(() => items.reduce((s, i) => s + i.price * i.quantity, 0), [items]);
  const count = useMemo(() => items.reduce((s, i) => s + i.quantity, 0), [items]);

  const value = { items, add, remove, setQty, clear, subtotal, count, hydrated };
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within <CartProvider>');
  return ctx;
}
