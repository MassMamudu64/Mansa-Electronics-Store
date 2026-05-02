import { useCartStore } from '@/store/cartStore';
import { productService } from './productService';
import type { CartItem, CartTotals } from '@/types/cart';

const BUNDLE_DISCOUNT_RATE = 0.1; // 10% off when 3+ distinct items in cart

export const cartService = {
  async addProduct(productId: string, quantity = 1, bundleId?: string): Promise<void> {
    const product = await productService.getById(productId);
    if (!product) throw new Error('Product not found');
    if (product.stock < quantity) throw new Error(`Only ${product.stock} in stock`);

    const item: CartItem = {
      productId: product.id,
      slug: product.slug,
      name: product.name,
      image: product.images[0]?.url ?? '/placeholder.svg',
      unitPrice: product.price,
      quantity,
      maxQuantity: product.stock,
      bundleId,
      storage: product.storage,
      condition: product.condition,
      category: product.category,
    };
    useCartStore.getState().addItem(item);
  },

  // Variant for callers that already hold a product-shaped object (legacy code).
  // Avoids a second async lookup.
  addProductDirect(
    p: {
      id: string;
      slug?: string;
      model?: string;
      name?: string;
      price: number;
      image?: string;
      images?: { url: string }[];
      quantity?: number;
      stock?: number;
      storage?: string;
      condition?: string;
      category?: string;
    },
    quantity = 1,
    bundleId?: string,
  ): void {
    const cap = p.stock ?? p.quantity;
    const item: CartItem = {
      productId: p.id,
      slug: p.slug ?? p.id,
      name: p.name ?? p.model ?? 'Item',
      image: p.images?.[0]?.url ?? p.image ?? '/placeholder.svg',
      unitPrice: p.price,
      quantity,
      maxQuantity: cap,
      bundleId,
      storage: p.storage,
      condition: p.condition,
      category: p.category,
    };
    useCartStore.getState().addItem(item);
  },

  async addBundle(productIds: string[]): Promise<void> {
    const bundleId = `b_${Date.now()}`;
    for (const id of productIds) {
      await this.addProduct(id, 1, bundleId);
    }
  },

  updateQuantity(productId: string, quantity: number): void {
    if (quantity <= 0) {
      useCartStore.getState().removeItem(productId);
      return;
    }
    useCartStore.getState().updateQuantity(productId, quantity);
  },

  remove(productId: string): void {
    useCartStore.getState().removeItem(productId);
  },

  clear(): void {
    useCartStore.getState().clear();
  },

  getTotals(): CartTotals {
    return computeTotals(useCartStore.getState().items);
  },
};

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
