// Pure cart helpers. No I/O, no storage adapters — totals are computed from
// whatever items the caller passes in. Cart mutations live on the Zustand
// store in `src/store/cartStore.ts`; this file is for math + shape coercion
// so the storefront and the popup hook can stay free of imports from the
// (now-removed) services/ layer.

import type { CartItem, CartTotals } from '@/types/cart';

const BUNDLE_DISCOUNT_RATE = 0.1; // 10% off when 3+ distinct products in cart

export function computeTotals(items: CartItem[]): CartTotals {
  const subtotal = items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
  const itemCount = items.reduce((s, i) => s + i.quantity, 0);

  const distinctProducts = new Set(items.map((i) => i.productId)).size;
  const bundleDiscount =
    distinctProducts >= 3 ? Math.round(subtotal * BUNDLE_DISCOUNT_RATE * 100) / 100 : 0;

  return {
    subtotal,
    bundleDiscount,
    total: subtotal - bundleDiscount,
    itemCount,
  };
}

// Loose product shape accepted by ProductCard / product detail / API responses.
// Kept permissive on purpose so the cart entry points don't need to know
// whether the source is a Prisma row, a /api/products response, or a card.
export interface LooseProductInput {
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
}

export function toCartItem(p: LooseProductInput, quantity = 1): CartItem {
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
