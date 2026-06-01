'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, Search, Menu, X, ChevronRight } from 'lucide-react';
import { useCartStore, selectItemCount, useCartHasHydrated } from '@/store/cartStore';
import Logo from './Logo';

const NAV = [
  { label: 'Shop All', href: '/shop' },
  { label: 'Smartphones', href: '/shop?category=iPhone' },
  { label: 'Accessories', href: '/shop?category=Accessories' },
  { label: 'Deals', href: '/shop?sort=price-asc' },
  { label: 'Price Check', href: '/price-check' },
];

export default function Navbar() {
  const count = useCartStore(selectItemCount);
  const hydrated = useCartHasHydrated();
  const router = useRouter();
  const [q, setQ] = useState('');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  function submitSearch(e) {
    e.preventDefault();
    const query = q.trim();
    router.push(query ? `/shop?q=${encodeURIComponent(query)}` : '/shop');
    setMobileOpen(false);
    setSearchOpen(false);
    setQ('');
  }

  return (
    <motion.header
      initial={{ y: -24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className={`sticky top-0 z-40 border-b transition-all duration-300 ease-mansa ${
        scrolled
          ? 'border-sand-300 bg-paper-warm/90 shadow-card backdrop-blur-xl'
          : 'border-transparent bg-paper-warm/70 backdrop-blur-md'
      }`}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className={`flex items-center justify-between gap-4 transition-all duration-300 ${scrolled ? 'h-[60px]' : 'h-[72px]'}`}>

          <button
            className="flex items-center justify-center rounded-lg p-2 text-brown-800 transition hover:bg-sand-100 md:hidden"
            onClick={() => setMobileOpen((o) => !o)}
            aria-label="Toggle menu"
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={mobileOpen ? 'x' : 'menu'}
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.18 }}
              >
                {mobileOpen ? <X size={20} /> : <Menu size={20} />}
              </motion.span>
            </AnimatePresence>
          </button>

          <motion.div whileHover={{ scale: 1.03 }} transition={{ type: 'spring', stiffness: 400, damping: 17 }}>
            <Logo />
          </motion.div>

          <nav className="hidden items-center gap-1 md:flex">
            {NAV.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className="group relative rounded-full px-4 py-2 text-sm font-medium text-ink-700 transition-colors hover:text-brown-800"
              >
                {n.label}
                <span className="pointer-events-none absolute inset-x-4 -bottom-0.5 h-0.5 origin-left scale-x-0 rounded-full bg-gold-gradient transition-transform duration-300 ease-mansa group-hover:scale-x-100" />
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-1">
            <motion.button
              whileTap={{ scale: 0.9 }}
              className="flex items-center justify-center rounded-full p-2.5 text-ink-700 transition hover:bg-sand-100 hover:text-brown-800"
              onClick={() => setSearchOpen((o) => !o)}
              aria-label="Search"
            >
              <Search size={18} />
            </motion.button>

            <motion.div whileHover={{ y: -1 }} whileTap={{ scale: 0.96 }}>
              <Link
                href="/cart"
                className="relative flex items-center gap-2 rounded-full bg-brown-800 px-4 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:bg-brown-700 hover:shadow-gold"
                aria-label="Cart"
              >
                <ShoppingBag size={16} />
                <span className="hidden sm:inline">Cart</span>
                <AnimatePresence>
                  {hydrated && count > 0 && (
                    <motion.span
                      key={count}
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 18 }}
                      className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-gold-gradient px-1.5 text-[11px] font-bold text-brown-900 ring-2 ring-paper-warm"
                    >
                      {count}
                    </motion.span>
                  )}
                </AnimatePresence>
              </Link>
            </motion.div>
          </div>
        </div>

        <AnimatePresence>
          {searchOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden border-t border-sand-300"
            >
              <form onSubmit={submitSearch} className="relative py-3">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-500" />
                <input
                  autoFocus
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  className="w-full rounded-xl border-[1.5px] border-sand-300 bg-white py-2.5 pl-10 pr-4 text-sm text-ink-700 placeholder-ink-500/60 focus:border-gold-600 focus:outline-none focus:ring-[3px] focus:ring-gold-600/20"
                  placeholder="Search smartphones, accessories, cables…"
                />
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden border-t border-sand-300 bg-paper-warm md:hidden"
          >
            <nav className="flex flex-col gap-0.5 px-4 py-3">
              {NAV.map((n, i) => (
                <motion.div
                  key={n.href}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.04 * i, duration: 0.25 }}
                >
                  <Link
                    href={n.href}
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center justify-between rounded-xl px-3 py-3 text-sm font-medium text-brown-800 transition hover:bg-sand-100"
                  >
                    {n.label}
                    <ChevronRight size={14} className="text-gold-600" />
                  </Link>
                </motion.div>
              ))}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
