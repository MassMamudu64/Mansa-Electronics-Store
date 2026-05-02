import type { StorageAdapter } from './adapter';

const ns = (key: string) => `mansa:${key}`;
const isBrowser = () => typeof window !== 'undefined';

export const localStorageAdapter: StorageAdapter = {
  async get<T>(key: string): Promise<T | null> {
    if (!isBrowser()) return null;
    const raw = window.localStorage.getItem(ns(key));
    return raw ? (JSON.parse(raw) as T) : null;
  },

  async set<T>(key: string, value: T): Promise<void> {
    if (!isBrowser()) return;
    window.localStorage.setItem(ns(key), JSON.stringify(value));
  },

  async remove(key: string): Promise<void> {
    if (!isBrowser()) return;
    window.localStorage.removeItem(ns(key));
  },

  async list<T>(key: string): Promise<T[]> {
    const value = await this.get<T[]>(key);
    return Array.isArray(value) ? value : [];
  },

  async upsert<T extends { id: string }>(key: string, item: T): Promise<T> {
    const items = await this.list<T>(key);
    const idx = items.findIndex((x) => x.id === item.id);
    if (idx >= 0) items[idx] = item;
    else items.push(item);
    await this.set(key, items);
    return item;
  },

  async removeFromList(key: string, id: string): Promise<void> {
    const items = await this.list<{ id: string }>(key);
    await this.set(key, items.filter((x) => x.id !== id));
  },
};
