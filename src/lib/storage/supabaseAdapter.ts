import { createClient } from '@/lib/supabase/client';
import type { StorageAdapter } from './adapter';

// Maps the StorageAdapter's "key" string to a real Postgres table.
// Cart stays in localStorage (Zustand persist) — this adapter is for products,
// orders, and customers. Order creation specifically uses the create_order RPC,
// not generic upsert; this adapter handles read paths.
const TABLES: Record<string, string> = {
  products: 'products',
  orders: 'orders',
  customers: 'customers',
};

function table(key: string): string {
  const t = TABLES[key];
  if (!t) throw new Error(`No Supabase table mapped for key: ${key}`);
  return t;
}

export const supabaseAdapter: StorageAdapter = {
  async list<T>(key: string): Promise<T[]> {
    const supabase = createClient();
    const { data, error } = await supabase.from(table(key)).select('*');
    if (error) throw new Error(error.message);
    return (data as T[]) ?? [];
  },

  async upsert<T extends { id: string }>(key: string, item: T): Promise<T> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from(table(key))
      .upsert(item as never)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data as T;
  },

  async removeFromList(key: string, id: string): Promise<void> {
    const supabase = createClient();
    const { error } = await supabase.from(table(key)).delete().eq('id', id);
    if (error) throw new Error(error.message);
  },

  // The flag-style helpers (get/set/remove) are not used by the product/order
  // services. Throw loudly if anyone reaches for them.
  async get<T>(_key: string): Promise<T | null> {
    throw new Error('supabaseAdapter.get is not supported — use list/upsert');
  },
  async set<T>(_key: string, _value: T): Promise<void> {
    throw new Error('supabaseAdapter.set is not supported — use upsert');
  },
  async remove(_key: string): Promise<void> {
    throw new Error('supabaseAdapter.remove is not supported — use removeFromList');
  },
};
