/**
 * Server-only JSON file store.
 * Used by API routes so they have persistence even without Supabase.
 * Import ONLY in server-side code (API routes, server components).
 */
import { promises as fs } from 'fs';
import path from 'path';
import { newId, shortCode } from '@/lib/id';

const DATA_DIR = path.join(process.cwd(), 'data');

async function readJson<T>(file: string): Promise<T[]> {
  try {
    const txt = await fs.readFile(path.join(DATA_DIR, file), 'utf-8');
    const parsed = JSON.parse(txt);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeJson<T>(file: string, data: T[]): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(path.join(DATA_DIR, file), JSON.stringify(data, null, 2), 'utf-8');
}

// ─── Products ────────────────────────────────────────────────────────────────

export interface ServerProduct {
  id: string;
  slug: string;
  name: string;
  category: string;
  brand?: string;
  sku?: string;
  description?: string;
  bullets?: string[];
  image_url?: string;
  images?: { url: string; alt: string }[];
  price: number;
  selling_price?: number;
  compare_at_price?: number;
  currency?: string;
  stock: number;
  lowStockThreshold?: number;
  isBestSeller?: boolean;
  is_best_seller?: boolean;
  is_active?: boolean;
  tags?: string[];
  compatibility?: string[];
  createdAt?: string;
  created_at?: string;
  updatedAt?: string;
  updated_at?: string;
  archivedAt?: string;
  [key: string]: unknown;
}

export async function listProducts(): Promise<ServerProduct[]> {
  const raw = await readJson<ServerProduct>('products.json');
  return raw.filter((p) => !p.archivedAt && p.is_active !== false);
}

export async function getProductById(id: string): Promise<ServerProduct | null> {
  const all = await readJson<ServerProduct>('products.json');
  return all.find((p) => p.id === id) ?? null;
}

export async function saveProduct(product: ServerProduct): Promise<ServerProduct> {
  const all = await readJson<ServerProduct>('products.json');
  const idx = all.findIndex((p) => p.id === product.id);
  if (idx >= 0) all[idx] = product;
  else all.push(product);
  await writeJson('products.json', all);
  return product;
}

export async function deductStock(
  items: { id: string; quantity: number }[],
): Promise<void> {
  const all = await readJson<ServerProduct>('products.json');
  for (const { id, quantity } of items) {
    const p = all.find((x) => x.id === id);
    if (!p) throw new Error(`Product ${id} not found`);
    if ((p.stock ?? 0) < quantity) throw new Error(`"${p.name}" has insufficient stock`);
    p.stock = (p.stock ?? 0) - quantity;
  }
  await writeJson('products.json', all);
}

// ─── Orders ──────────────────────────────────────────────────────────────────

export interface ServerOrder {
  id: string;
  shortCode: string;
  customer: {
    name: string;
    phone: string;
    email: string;
    address: string;
    notes?: string;
  };
  items: {
    id: string;
    name: string;
    sku?: string;
    price: number;
    quantity: number;
  }[];
  totals: {
    subtotal: number;
    bundleDiscount: number;
    delivery: number;
    total: number;
  };
  status: string;
  createdAt: string;
  updatedAt: string;
}

export async function listOrders(): Promise<ServerOrder[]> {
  const all = await readJson<ServerOrder>('orders.json');
  return all.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getOrderById(id: string): Promise<ServerOrder | null> {
  const all = await readJson<ServerOrder>('orders.json');
  return all.find((o) => o.id === id || o.shortCode === id) ?? null;
}

export async function createOrder(input: Omit<ServerOrder, 'id' | 'shortCode' | 'createdAt' | 'updatedAt'>): Promise<ServerOrder> {
  const now = new Date().toISOString();
  const order: ServerOrder = {
    ...input,
    id: newId('ord'),
    shortCode: shortCode(),
    createdAt: now,
    updatedAt: now,
  };
  const all = await readJson<ServerOrder>('orders.json');
  all.push(order);
  await writeJson('orders.json', all);
  return order;
}

export async function updateOrderStatus(id: string, status: string): Promise<ServerOrder | null> {
  const all = await readJson<ServerOrder>('orders.json');
  const idx = all.findIndex((o) => o.id === id);
  if (idx < 0) return null;
  all[idx] = { ...all[idx], status, updatedAt: new Date().toISOString() };
  await writeJson('orders.json', all);
  return all[idx];
}
