import { localStorageAdapter } from './localStorageAdapter';
// import { supabaseAdapter } from './supabaseAdapter';

// Swap target — flip these two lines to migrate the storefront from
// localStorage to Supabase. No service or component changes required.
//
// Before flipping:
//   1. Provision a Supabase project and apply migrations in supabase/migrations
//   2. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local
//   3. Generate types: npx supabase gen types typescript --linked > src/lib/supabase/types.ts
//   4. Replace orderService.createFromCart body with the RPC call (already wired
//      conditionally — see services/orderService.ts)
//
// To flip:
//   - Comment out the localStorageAdapter line below
//   - Uncomment the supabaseAdapter line and the import above
export const storage = localStorageAdapter;
// export const storage = supabaseAdapter;

export type { StorageAdapter } from './adapter';
