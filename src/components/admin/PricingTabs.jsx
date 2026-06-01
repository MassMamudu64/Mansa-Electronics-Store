'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const TABS = [
  { label: 'Overview', href: '/admin/pricing' },
  { label: 'Rules',    href: '/admin/pricing/rules' },
  { label: 'Listings', href: '/admin/pricing/listings' },
  { label: 'Apply',    href: '/admin/pricing/apply' },
];

function isActive(pathname, href) {
  if (href === '/admin/pricing') return pathname === '/admin/pricing';
  return pathname?.startsWith(href);
}

export default function PricingTabs() {
  const pathname = usePathname();

  return (
    <div className="mb-6 flex flex-wrap gap-1.5 border-b border-charcoal-100 pb-px">
      {TABS.map((t) => {
        const active = isActive(pathname, t.href);
        return (
          <Link
            key={t.href}
            href={t.href}
            className={`relative px-4 py-2.5 text-sm font-semibold transition ${
              active
                ? 'text-charcoal-900'
                : 'text-charcoal-500 hover:text-charcoal-900'
            }`}
          >
            {t.label}
            {active && (
              <span
                aria-hidden
                className="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-charcoal-900"
              />
            )}
          </Link>
        );
      })}
    </div>
  );
}
