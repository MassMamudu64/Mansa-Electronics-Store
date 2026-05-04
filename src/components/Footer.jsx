'use client';

import Link from 'next/link';
import Logo from './Logo';

const LINKS = {
  Shop: [
    { label: 'All Products', href: '/shop' },
    { label: 'Smartphones', href: '/shop?category=iPhone' },
    { label: 'Chargers', href: '/shop?category=Chargers' },
    { label: 'Audio', href: '/shop?category=Audio' },
    { label: 'Cases & Covers', href: '/shop?category=Cases' },
    { label: 'Power Banks', href: '/shop?category=PowerBanks' },
  ],
  Support: [
    { label: 'FAQ', href: '/#faq' },
    { label: 'Warranty', href: '/#warranty' },
    { label: 'Returns & Shipping', href: '/#returns' },
    { label: 'Contact Us', href: '/#contact' },
  ],
  Company: [
    { label: 'About Mansa', href: '/#about' },
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'Terms of Service', href: '/terms' },
  ],
};

export default function Footer() {
  return (
    <footer className="bg-charcoal-950 text-charcoal-300">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

        {/* Main grid */}
        <div className="grid gap-12 py-16 md:grid-cols-5 lg:gap-16">

          {/* Brand column */}
          <div className="md:col-span-2">
            <Logo variant="light" />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-charcoal-400">
              Premium mobile electronics and accessories. Every product curated for quality, performance, and value.
            </p>

            {/* Newsletter */}
            <form
              className="mt-6 flex max-w-xs gap-2"
              onSubmit={(e) => e.preventDefault()}
            >
              <input
                type="email"
                required
                placeholder="Your email"
                className="flex-1 rounded-full border border-charcoal-700 bg-charcoal-900 px-4 py-2.5 text-sm text-white placeholder-charcoal-500 focus:border-charcoal-400 focus:outline-none"
              />
              <button
                type="submit"
                className="rounded-full bg-white px-4 py-2.5 text-sm font-semibold text-charcoal-900 transition hover:bg-charcoal-100"
              >
                Join
              </button>
            </form>
            <p className="mt-2 text-xs text-charcoal-500">Get exclusive deals and new arrivals.</p>
          </div>

          {/* Link columns */}
          {Object.entries(LINKS).map(([title, items]) => (
            <div key={title}>
              <h4 className="mb-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-charcoal-500">{title}</h4>
              <ul className="space-y-2.5">
                {items.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="text-sm text-charcoal-400 transition hover:text-white"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="border-t border-charcoal-800 py-5">
          <div className="flex flex-col items-center justify-between gap-3 text-xs text-charcoal-600 md:flex-row">
            <span>© {new Date().getFullYear()} Mansa Electronics. All rights reserved.</span>
            <div className="flex items-center gap-4">
              <Link href="/terms" className="hover:text-charcoal-300 transition">Terms</Link>
              <Link href="/privacy" className="hover:text-charcoal-300 transition">Privacy</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
