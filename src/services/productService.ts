import { storage } from '@/lib/storage';
import { newId } from '@/lib/id';
import { seedProductsIfEmpty } from '@/lib/seed/seedRunner';
import type { Product, Category, DeviceType } from '@/types/product';
import { productInvariants as inv } from '@/types/product';

const KEY = 'products';

export interface ProductFilters {
  category?: Category;
  deviceType?: DeviceType;
  compatibility?: string;
  condition?: string[];
  priceMin?: number;
  priceMax?: number;
  inStockOnly?: boolean;
  search?: string;
}

export type ProductSort =
  | 'best-sellers'
  | 'newest'
  | 'price-asc'
  | 'price-desc';

export const productService = {
  async getAll(): Promise<Product[]> {
    await seedProductsIfEmpty();
    const list = await storage.list<Product>(KEY);
    return list.filter((p) => !p.archivedAt);
  },

  async getById(id: string): Promise<Product | null> {
    const all = await this.getAll();
    return all.find((p) => p.id === id) ?? null;
  },

  async getBySlug(slug: string): Promise<Product | null> {
    const all = await this.getAll();
    return all.find((p) => p.slug === slug) ?? null;
  },

  async query(filters: ProductFilters = {}, sort: ProductSort = 'best-sellers'): Promise<Product[]> {
    let list = await this.getAll();

    if (filters.category) list = list.filter((p) => p.category === filters.category);
    if (filters.deviceType) list = list.filter((p) => p.deviceType === filters.deviceType);
    if (filters.compatibility) {
      const c = filters.compatibility;
      list = list.filter((p) => p.compatibility.includes(c));
    }
    if (filters.condition?.length) {
      const cs = filters.condition;
      list = list.filter((p) => p.condition !== undefined && cs.includes(p.condition));
    }
    if (filters.priceMin != null) list = list.filter((p) => p.price >= filters.priceMin!);
    if (filters.priceMax != null) list = list.filter((p) => p.price <= filters.priceMax!);
    if (filters.inStockOnly) list = list.filter((p) => p.stock > 0);
    if (filters.search) {
      const q = filters.search.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.tags.some((t) => t.toLowerCase().includes(q)),
      );
    }

    return sortProducts(list, sort);
  },

  async getBestSellers(limit = 8): Promise<Product[]> {
    const list = await this.getAll();
    return list
      .filter((p) => p.stock > 0)
      .sort((a, b) => {
        if (a.isBestSeller !== b.isBestSeller) return a.isBestSeller ? -1 : 1;
        return b.salesCount - a.salesCount;
      })
      .slice(0, limit);
  },

  async getBundleSuggestions(productId: string, limit = 3): Promise<Product[]> {
    const product = await this.getById(productId);
    if (!product) return [];
    const all = await this.getAll();
    return all
      .filter(
        (p) =>
          p.id !== productId &&
          p.stock > 0 &&
          p.category !== product.category &&
          (p.compatibility.length === 0 ||
            p.compatibility.some((c) => product.compatibility.includes(c) || c === product.name)),
      )
      .sort((a, b) => b.salesCount - a.salesCount)
      .slice(0, limit);
  },

  async create(
    input: Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'salesCount' | 'views7d'>,
  ): Promise<Product> {
    assertValid(input);
    const now = new Date().toISOString();
    const product: Product = {
      ...input,
      id: newId('p'),
      salesCount: 0,
      views7d: 0,
      createdAt: now,
      updatedAt: now,
    };
    return storage.upsert(KEY, product);
  },

  async update(id: string, patch: Partial<Product>): Promise<Product> {
    const existing = await this.getById(id);
    if (!existing) throw new Error(`Product ${id} not found`);
    const merged: Product = { ...existing, ...patch, updatedAt: new Date().toISOString() };
    assertValid(merged);
    return storage.upsert(KEY, merged);
  },

  async archive(id: string): Promise<void> {
    await this.update(id, { archivedAt: new Date().toISOString() });
  },

  async hardDelete(id: string): Promise<void> {
    await storage.removeFromList(KEY, id);
  },

  async decrementStock(id: string, qty: number): Promise<void> {
    const p = await this.getById(id);
    if (!p) throw new Error(`Product ${id} not found`);
    if (p.stock < qty) throw new Error(`Insufficient stock for ${p.name}`);
    await this.update(id, { stock: p.stock - qty, salesCount: p.salesCount + qty });
  },
};

function assertValid(
  p: Pick<Product, 'name' | 'price' | 'stock' | 'images' | 'slug'>,
) {
  if (p.name.length < inv.nameMinLength) throw new Error('Name too short');
  if (!inv.pricePositive(p.price)) throw new Error('Price must be ≥ 0');
  if (!inv.stockPositive(p.stock)) throw new Error('Stock must be a non-negative integer');
  if (!inv.imagesRequired(p.images)) throw new Error('At least one image required');
  if (!inv.slugFormat.test(p.slug)) throw new Error('Invalid slug format');
}

function sortProducts(list: Product[], sort: ProductSort): Product[] {
  const arr = [...list];
  switch (sort) {
    case 'best-sellers':
      return arr.sort(
        (a, b) => Number(b.isBestSeller) - Number(a.isBestSeller) || b.salesCount - a.salesCount,
      );
    case 'newest':
      return arr.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    case 'price-asc':
      return arr.sort((a, b) => a.price - b.price);
    case 'price-desc':
      return arr.sort((a, b) => b.price - a.price);
    default:
      return arr;
  }
}
