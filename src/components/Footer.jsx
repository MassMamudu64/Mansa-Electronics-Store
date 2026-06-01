'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
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
    { label: 'FAQ', href: '/support/faq' },
    { label: 'Warranty', href: '/support/warranty' },
    { label: 'Returns & Shipping', href: '/support/returns-shipping' },
    { label: 'Contact Us', href: '/support/contact' },
  ],
  Company: [
    { label: 'About Mansa', href: '/company/about' },
    { label: 'Privacy Policy', href: '/company/privacy-policy' },
    { label: 'Terms of Service', href: '/company/terms' },
  ],
};

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};
const item = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
};

export default function Footer() {
  return (
    <footer className="relative bg-espresso-fade text-[#CDBBA6]">
      <div className="hairline-gold absolute inset-x-0 top-0" />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-80px' }}
          className="grid gap-12 py-16 md:grid-cols-5 lg:gap-16"
        >
          <motion.div variants={item} className="md:col-span-2">
            <Logo variant="light" />
            <p className="mt-5 max-w-xs text-sm leading-relaxed text-[#BBA68E]">
              Named for a king. Bringing the finest authentic technology to Africa and beyond —
              chosen with care, delivered with honour. Technology. Quality. Trust.
            </p>

            <form className="mt-6 flex max-w-xs gap-2" onSubmit={(e) => e.preventDefault()}>
              <input
                type="email"
                required
                placeholder="Your email"
                className="flex-1 rounded-full border border-brown-600 bg-brown-800 px-4 py-2.5 text-sm text-white placeholder-[#9C8A73] transition focus:border-gold-500 focus:outline-none focus:ring-[3px] focus:ring-gold-600/20"
              />
              <motion.button
                type="submit"
                whileHover={{ y: -2, scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                className="rounded-full bg-gold-gradient px-5 py-2.5 text-sm font-bold text-brown-900 hover:brightness-105"
              >
                Join
              </motion.button>
            </form>
            <p className="mt-2 text-xs text-[#9C8A73]">Join the court — first access to drops & deals.</p>
          </motion.div>

          {Object.entries(LINKS).map(([title, items]) => (
            <motion.div key={title} variants={item}>
              <h4 className="mb-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-white">{title}</h4>
              <ul className="space-y-2.5">
                {items.map((it) => (
                  <li key={it.href}>
                    <Link
                      href={it.href}
                      className="group inline-flex items-center text-sm text-[#CDBBA6] transition-colors hover:text-gold-400"
                    >
                      <span className="mr-0 h-px w-0 bg-gold-400 transition-all duration-300 ease-mansa group-hover:mr-2 group-hover:w-3" />
                      {it.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </motion.div>

        <div className="border-t border-brown-700 py-5">
          <div className="flex flex-col items-center justify-between gap-3 text-xs text-[#9C8A73] md:flex-row">
            <span>
              <b className="font-semibold text-gold-400">Technology · Quality · Trust</b>
              {' '}— © {new Date().getFullYear()} Mansa Electronics. All rights reserved.
            </span>
            <div className="flex items-center gap-4">
              <Link href="/company/terms" className="transition hover:text-gold-400">Terms</Link>
              <Link href="/company/privacy-policy" className="transition hover:text-gold-400">Privacy</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
