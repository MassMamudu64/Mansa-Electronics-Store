'use client';

import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="mt-24 border-t border-ink-100 bg-ink-900 text-ink-100">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 md:grid-cols-5">
        <div className="md:col-span-2">
          <div className="flex items-baseline gap-2">
            <span className="text-[22px] font-black tracking-[0.22em] text-white">MANSA</span>
            <span className="text-[10px] font-semibold tracking-[0.3em] text-gold-400 uppercase">Electronics</span>
          </div>
          <p className="mt-4 max-w-sm text-sm text-ink-300">
            Premium iPhones and accessories — every device hand-tested, graded, and
            backed by a 12-month limited warranty.
          </p>
          <form
            className="mt-6 flex max-w-sm items-center gap-2"
            onSubmit={(e) => e.preventDefault()}
          >
            <input
              type="email"
              required
              placeholder="Your email"
              className="w-full rounded-full border border-ink-700 bg-ink-800 px-4 py-2.5 text-sm text-white placeholder-ink-400 focus:border-gold-400 focus:outline-none"
            />
            <button className="btn-gold whitespace-nowrap" type="submit">Subscribe</button>
          </form>
          <p className="mt-2 text-xs text-ink-400">Get early access to new drops and deals.</p>
        </div>

        <FooterCol title="Shop">
          <FooterLink href="/shop">All products</FooterLink>
          <FooterLink href="/shop?category=iPhone">iPhones</FooterLink>
          <FooterLink href="/shop?category=Accessories">Accessories</FooterLink>
          <FooterLink href="/shop?deals=1">Deals</FooterLink>
        </FooterCol>

        <FooterCol title="Support">
          <FooterLink href="/#conditions">Condition guide</FooterLink>
          <FooterLink href="/#faq">FAQ</FooterLink>
          <FooterLink href="/#warranty">Warranty</FooterLink>
          <FooterLink href="/#returns">Returns & shipping</FooterLink>
        </FooterCol>

        <FooterCol title="Company">
          <FooterLink href="/#about">About Mansa</FooterLink>
          <FooterLink href="/#contact">Contact</FooterLink>
          <FooterLink href="/admin">Store admin</FooterLink>
        </FooterCol>
      </div>

      <div className="border-t border-ink-700">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 py-5 text-xs text-ink-400 md:flex-row">
          <span>© {new Date().getFullYear()} Mansa Electronics. All rights reserved.</span>
          <div className="flex items-center gap-4">
            <span>Terms</span>
            <span>Privacy</span>
            <span>Cookies</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, children }) {
  return (
    <div>
      <h4 className="mb-3 text-xs font-semibold uppercase tracking-widest text-gold-400">{title}</h4>
      <ul className="space-y-2 text-sm text-ink-200">{children}</ul>
    </div>
  );
}
function FooterLink({ href, children }) {
  return <li><Link href={href} className="hover:text-white transition">{children}</Link></li>;
}
