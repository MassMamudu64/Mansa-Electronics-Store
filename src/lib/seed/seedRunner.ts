import { storage } from '@/lib/storage';
import type { Product } from '@/types/product';
import { seedProducts } from './products.seed';

const KEY = 'products';
const SEED_FLAG = 'products:seeded';
const SEED_VERSION = 1;

let seeding: Promise<void> | null = null;

// Idempotent. Safe to call from multiple service entry points; the in-flight
// promise dedupes concurrent first-load races.
export async function seedProductsIfEmpty(): Promise<void> {
  if (seeding) return seeding;

  seeding = (async () => {
    const existingFlag = await storage.get<number>(SEED_FLAG);
    const existing = await storage.list<Product>(KEY);

    if (existingFlag === SEED_VERSION && existing.length > 0) return;

    if (existing.length === 0) {
      await storage.set(KEY, seedProducts);
    }
    await storage.set(SEED_FLAG, SEED_VERSION);
  })();

  return seeding;
}

// Test/admin helper: wipe and re-seed. Not exposed in UI.
export async function resetProducts(): Promise<void> {
  await storage.set(KEY, seedProducts);
  await storage.set(SEED_FLAG, SEED_VERSION);
}
