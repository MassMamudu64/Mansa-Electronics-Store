// The single seam between the app and persistence.
// localStorageAdapter today; supabaseAdapter tomorrow. Service code does not change.
export interface StorageAdapter {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T): Promise<void>;
  remove(key: string): Promise<void>;
  list<T>(key: string): Promise<T[]>;
  upsert<T extends { id: string }>(key: string, item: T): Promise<T>;
  removeFromList(key: string, id: string): Promise<void>;
}
