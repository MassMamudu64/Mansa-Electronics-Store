'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Image,
  ExternalLink,
  Warehouse,
} from 'lucide-react';

const NAV = [
  { label: 'Dashboard',  href: '/admin',           icon: LayoutDashboard },
  { label: 'Products',   href: '/admin/products',   icon: Package },
  { label: 'Orders',     href: '/admin/orders',     icon: ShoppingCart },
  { label: 'Customers',  href: '/admin/customers',  icon: Users },
  { label: 'Banners',    href: '/admin/banners',    icon: Image },
];

export default function AdminLayout({ children }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen bg-charcoal-50">
      {/* Sidebar */}
      <aside className="hidden w-60 flex-shrink-0 border-r border-charcoal-200 bg-white shadow-admin-sidebar md:flex md:flex-col">
        {/* Brand */}
        <div className="border-b border-charcoal-100 px-5 py-4">
          <Link href="/admin" className="flex items-baseline gap-1.5">
            <span className="text-base font-black tracking-[0.18em] text-charcoal-900">MANSA</span>
            <span className="text-[9px] font-semibold uppercase tracking-[0.25em] text-charcoal-400">Admin</span>
          </Link>
        </div>

        {/* Nav */}
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

        {/* Bottom links */}
        <div className="border-t border-charcoal-100 p-3 space-y-0.5">
          <Link
            href="/inventory"
            className="nav-item text-charcoal-500"
          >
            <Warehouse size={16} />
            Inventory Dashboard
          </Link>
          <Link
            href="/"
            target="_blank"
            className="nav-item text-charcoal-500"
          >
            <ExternalLink size={16} />
            View Storefront
          </Link>
        </div>
      </aside>

      {/* Mobile top bar */}
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
        </div>
      </div>

      {/* Main content */}
      <main className="flex-1 min-w-0 pt-14 md:pt-0">
        {children}
      </main>
    </div>
  );
}
