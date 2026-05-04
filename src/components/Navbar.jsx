'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ShoppingBag, Search, Menu, X, ChevronRight } from 'lucide-react';
import { useCartStore, selectItemCount, useCartHasHydrated } from '@/store/cartStore';
import Logo from './Logo';

const NAV = [
  { label: 'Shop All', href: '/shop' },
  { label: 'Smartphones', href: '/shop?category=iPhone' },
  { label: 'Accessories', href: '/shop?category=Accessories' },
  { label: 'Deals', href: '/shop?sort=price-asc' },
];

export default function Navbar() {
  const count = useCartStore(selectItemCount);
  const hydrated = useCartHasHydrated();
  const router = useRouter();
  const [q, setQ] = useState('');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  function submitSearch(e) {
    e.preventDefault();
    const query = q.trim();
    router.push(query ? `/shop?q=${encodeURIComponent(query)}` : '/shop');
    setMobileOpen(false);
    setSearchOpen(false);
    setQ('');
  }

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-charcoal-100 bg-white/96 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-[60px] items-center justify-between gap-4">

            {/* Mobile: hamburger */}
            <button
              className="md:hidden flex items-center justify-center rounded-lg p-2 text-charcoal-700 hover:bg-charcoal-50"
              onClick={() => setMobileOpen((o) => !o)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>

            <Logo />

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-1">
              {NAV.map((n) => (
                <Link
                  key={n.href}
                  href={n.href}
                  className="rounded-full px-4 py-2 text-sm font-medium text-charcoal-600 transition hover:bg-charcoal-50 hover:text-charcoal-900"
                >
                  {n.label}
                </Link>
              ))}
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-1">
              {/* Search toggle */}
              <button
                className="flex items-center justify-center rounded-full p-2.5 text-charcoal-600 transition hover:bg-charcoal-50 hover:text-charcoal-900"
                onClick={() => setSearchOpen((o) => !o)}
                aria-label="Search"
              >
                <Search size={18} />
              </button>

              {/* Cart */}
              <Link
                href="/cart"
                className="relative flex items-center gap-2 rounded-full bg-charcoal-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-charcoal-700"
                aria-label="Cart"
              >
                <ShoppingBag size={16} />
                <span className="hidden sm:inline">Cart</span>
                {hydrated && count > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-white px-1.5 text-[11px] font-bold text-charcoal-900 ring-2 ring-charcoal-900">
                    {count}
                  </span>
                )}
              </Link>
            </div>
          </div>

          {/* Search bar — expands on demand */}
          {searchOpen && (
            <div className="border-t border-charcoal-100 py-3">
              <form onSubmit={submitSearch} className="relative">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-charcoal-400" />
                <input
                  autoFocus
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  className="w-full rounded-xl border border-charcoal-200 bg-charcoal-50 py-2.5 pl-10 pr-4 text-sm text-charcoal-900 placeholder-charcoal-400 focus:border-charcoal-900 focus:bg-white focus:outline-none"
                  placeholder="Search smartphones, accessories, cables…"
                />
              </form>
            </div>
          )}
        </div>

        {/* Mobile drawer */}
        {mobileOpen && (
          <div className="border-t border-charcoal-100 bg-white md:hidden animate-fade-in">
            <nav className="flex flex-col px-4 py-3 gap-0.5">
              {NAV.map((n) => (
                <Link
                  key={n.href}
                  href={n.href}
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center justify-between rounded-xl px-3 py-3 text-sm font-medium text-charcoal-800 hover:bg-charcoal-50"
                >
                  {n.label}
                  <ChevronRight size={14} className="text-charcoal-400" />
                </Link>
              ))}
            </nav>
          </div>
        )}
      </header>
    </>
  );
}
