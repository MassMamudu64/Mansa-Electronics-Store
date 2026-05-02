export interface CartItem {
  productId: string;
  slug: string;
  name: string;
  image: string;
  unitPrice: number;
  quantity: number;
  maxQuantity?: number;
  bundleId?: string;

  // Display-only metadata (avoids re-fetching the product on the cart page).
  // Safe to extend; never used for pricing decisions.
  storage?: string;
  condition?: string;
  category?: string;
}

export interface Cart {
  items: CartItem[];
  updatedAt: string;
}

export interface CartTotals {
  subtotal: number;
  bundleDiscount: number;
  total: number;
  itemCount: number;
}
