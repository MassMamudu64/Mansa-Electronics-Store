'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useCartStore, selectItemCount, useCartHasHydrated } from '@/store/cartStore';
import Logo from './Logo';

const NAV = [
  { label: 'Shop all', href: '/shop' },
  { label: 'iPhone', href: '/shop?category=iPhone' },
  { label: 'Accessories', href: '/shop?category=Accessories' },
  { label: 'Deals', href: '/shop?deals=1' },
];

export default function Navbar() {
  const count = useCartStore(selectItemCount);
  const hydrated = useCartHasHydrated();
  const router = useRouter();
  const [q, setQ] = useState('');
  const [mobileOpen, setMobileOpen] = useState(false);

  function submitSearch(e) {
    e.preventDefault();
    const query = q.trim();
    router.push(query ? `/shop?q=${encodeURIComponent(query)}` : '/shop');
    setMobileOpen(false);
  }

  return (
    <header className="sticky top-0 z-30 border-b border-ink-100 bg-white/95 backdrop-blur">
      <div className="mx-auto max-w-7xl px-4">
        {/* Top row */}
        <div className="flex h-16 items-center gap-4">
          <button
            aria-label="Open menu"
            className="md:hidden rounded-lg border border-ink-100 p-2 text-ink-700"
            onClick={() => setMobileOpen((o) => !o)}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
          </button>

          <Logo />

          {/* Search — prominent, desktop */}
          <form onSubmit={submitSearch} className="mx-4 hidden flex-1 md:block">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-300" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>
              </svg>
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="input pl-10"
                placeholder="Search iPhones, storage, accessories…"
                aria-label="Search products"
              />
            </div>
          </form>

          <div className="ml-auto flex items-center gap-2">
            <Link href="/admin" className="hidden md:inline-flex btn-ghost">Admin</Link>
            <Link
              href="/cart"
              className="relative inline-flex items-center gap-2 rounded-full border border-ink-100 bg-white px-4 py-2.5 text-sm font-semibold text-ink-900 hover:border-ink-900"
              aria-label="Cart"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                <path d="M1 1h4l2.7 13.4a2 2 0 002 1.6h9.7a2 2 0 002-1.6L23 6H6"/>
              </svg>
              <span className="hidden sm:inline">Cart</span>
              {hydrated && count > 0 && (
                <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-gold-500 px-1.5 text-[11px] font-bold text-ink-900 ring-2 ring-white">
                  {count}
                </span>
              )}
            </Link>
          </div>
        </div>

        {/* Nav row — desktop */}
        <nav className="hidden md:flex h-11 items-center gap-6 text-sm text-ink-600">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className="hover:text-ink-900 transition">{n.label}</Link>
          ))}
          <span className="ml-auto flex items-center gap-2 text-xs text-ink-400">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-12a8 8 0 10-16 0c0 8 8 12 8 12z"/><circle cx="12" cy="10" r="3"/></svg>
            Ships worldwide
          </span>
        </nav>

        {/* Mobile drawer */}
        {mobileOpen && (
          <div className="md:hidden border-t border-ink-100 py-3">
            <form onSubmit={submitSearch} className="mb-3">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="input"
                placeholder="Search products…"
              />
            </form>
            <nav className="flex flex-col">
              {NAV.map((n) => (
                <Link
                  key={n.href}
                  href={n.href}
                  onClick={() => setMobileOpen(false)}
                  className="py-2 text-sm text-ink-700"
                >{n.label}</Link>
              ))}
              <Link
                href="/admin"
                onClick={() => setMobileOpen(false)}
                className="py-2 text-sm text-ink-700"
              >Admin</Link>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
