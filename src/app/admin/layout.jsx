import Link from 'next/link';

// Auth gate is enforced by middleware.ts when Supabase is configured.
// In local-mode dev (no Supabase env), this layout still renders — the
// existing "Unsecured MVP" warning on the page conveys the risk.
export default function AdminLayout({ children }) {
  const supabaseConfigured = !!process.env.NEXT_PUBLIC_SUPABASE_URL;

  return (
    <div>
      <div className="border-b border-ink-100 bg-cream">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-2">
          <nav className="flex gap-4 text-xs font-semibold uppercase tracking-widest text-ink-500">
            <Link href="/admin" className="hover:text-ink-900">Inventory</Link>
            <Link href="/admin/orders" className="hover:text-ink-900">Orders</Link>
            <Link href="/admin/analytics" className="hover:text-ink-900">Analytics</Link>
          </nav>
          <div className="text-[10px] text-ink-400">
            {supabaseConfigured ? 'Supabase mode' : 'Local mode (no DB)'}
          </div>
        </div>
      </div>
      {children}
    </div>
  );
}
