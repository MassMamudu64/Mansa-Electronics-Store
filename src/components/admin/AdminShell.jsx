'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import {
  LayoutDashboard,
  Package,
  TrendingUp,
  ShoppingCart,
  Users,
  Image,
  ExternalLink,
  Warehouse,
  LogOut,
} from 'lucide-react';

const NAV = [
  { label: 'Dashboard',  href: '/admin',           icon: LayoutDashboard },
  { label: 'Products',   href: '/admin/products',   icon: Package },
  { label: 'Pricing',    href: '/admin/pricing',    icon: TrendingUp },
  { label: 'Orders',     href: '/admin/orders',     icon: ShoppingCart },
  { label: 'Customers',  href: '/admin/customers',  icon: Users },
  { label: 'Banners',    href: '/admin/banners',    icon: Image },
];

export default function AdminShell({ children }) {
  const pathname = usePathname();
  const [signingOut, setSigningOut] = useState(false);

  async function handleLogout() {
    if (signingOut) return;
    setSigningOut(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' });
    } catch {
      // Cookie may persist client-side if request failed; force navigation anyway.
    }
    window.location.href = '/';
  }

  return (
    <div className="flex min-h-screen bg-charcoal-50">
      <aside className="hidden w-60 flex-shrink-0 border-r border-charcoal-200 bg-white shadow-admin-sidebar md:flex md:flex-col">
        <div className="border-b border-charcoal-100 px-5 py-4">
          <Link href="/admin" className="flex items-baseline gap-1.5">
            <span className="text-base font-black tracking-[0.18em] text-charcoal-900">MANSA</span>
            <span className="text-[9px] font-semibold uppercase tracking-[0.25em] text-charcoal-400">Admin</span>
          </Link>
        </div>

        <nav className="flex-1 p-3 space-y-0.5">
          {NAV.map(({ label, href, icon: Icon }) => {
            const active =
              href === '/admin'
                ? pathname === '/admin'
                : pathname?.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`nav-item ${active ? 'nav-item-active' : ''}`}
              >
                <Icon size={16} />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-charcoal-100 p-3 space-y-0.5">
          <Link href="/inventory" className="nav-item text-charcoal-500">
            <Warehouse size={16} />
            Inventory Dashboard
          </Link>
          <Link href="/" target="_blank" className="nav-item text-charcoal-500">
            <ExternalLink size={16} />
            View Storefront
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            disabled={signingOut}
            className="nav-item w-full text-red-600 hover:bg-red-50 disabled:opacity-60"
          >
            <LogOut size={16} />
            {signingOut ? 'Signing out…' : 'Sign out'}
          </button>
        </div>
      </aside>

      <div className="fixed inset-x-0 top-0 z-30 flex h-14 items-center justify-between border-b border-charcoal-200 bg-white px-4 md:hidden">
        <Link href="/admin" className="text-sm font-black tracking-[0.18em] text-charcoal-900">
          MANSA ADMIN
        </Link>
        <div className="flex gap-2">
          {NAV.slice(0, 4).map(({ href, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={`rounded-lg p-2 transition ${pathname?.startsWith(href) ? 'bg-charcoal-900 text-white' : 'text-charcoal-600 hover:bg-charcoal-50'}`}
            >
              <Icon size={16} />
            </Link>
          ))}
          <button
            type="button"
            onClick={handleLogout}
            disabled={signingOut}
            className="rounded-lg p-2 text-red-600 hover:bg-red-50 disabled:opacity-60"
            aria-label="Sign out"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>

      <main className="flex-1 min-w-0 pt-14 md:pt-0">{children}</main>
    </div>
  );
}
