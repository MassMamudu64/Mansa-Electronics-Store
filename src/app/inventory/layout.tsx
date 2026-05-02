'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Boxes, Clock, LayoutDashboard, ExternalLink, ShoppingBag } from 'lucide-react';

const NAV = [
  { label: 'Inventory',    href: '/inventory',         icon: Boxes },
  { label: 'History',      href: '/inventory/history', icon: Clock },
];

export default function InventoryLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen bg-charcoal-50">
      {/* Sidebar */}
      <aside className="hidden w-56 flex-shrink-0 border-r border-charcoal-800 bg-charcoal-900 md:flex md:flex-col">
        {/* Brand */}
        <div className="border-b border-charcoal-800 px-5 py-4">
          <Link href="/inventory" className="flex items-baseline gap-1.5">
            <span className="text-sm font-black tracking-[0.18em] text-white">MANSA</span>
            <span className="text-[9px] font-semibold uppercase tracking-[0.3em] text-charcoal-500">Inventory</span>
          </Link>
          <p className="mt-1 text-[10px] text-charcoal-600">Internal dashboard</p>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-0.5">
          {NAV.map(({ label, href, icon: Icon }) => {
            const active =
              href === '/inventory'
                ? pathname === '/inventory'
                : pathname?.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                  active
                    ? 'bg-charcoal-800 text-white'
                    : 'text-charcoal-400 hover:bg-charcoal-800 hover:text-white'
                }`}
              >
                <Icon size={16} />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Bottom links */}
        <div className="border-t border-charcoal-800 p-3 space-y-0.5">
          <Link
            href="/admin"
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-charcoal-500 transition hover:bg-charcoal-800 hover:text-charcoal-300"
          >
            <ShoppingBag size={16} />
            Commerce Admin
          </Link>
          <Link
            href="/"
            target="_blank"
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-charcoal-500 transition hover:bg-charcoal-800 hover:text-charcoal-300"
          >
            <ExternalLink size={16} />
            Storefront
          </Link>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="fixed inset-x-0 top-0 z-30 flex h-14 items-center justify-between border-b border-charcoal-800 bg-charcoal-900 px-4 md:hidden">
        <span className="text-sm font-black tracking-[0.18em] text-white">INVENTORY</span>
        <div className="flex gap-2">
          {NAV.map(({ href, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={`rounded-lg p-2 transition ${
                pathname?.startsWith(href) ? 'bg-charcoal-700 text-white' : 'text-charcoal-400'
              }`}
            >
              <Icon size={16} />
            </Link>
          ))}
        </div>
      </div>

      {/* Content */}
      <main className="flex-1 min-w-0 pt-14 md:pt-0">
        {children}
      </main>
    </div>
  );
}
