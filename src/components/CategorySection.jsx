'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Smartphone, Zap, Headphones, Shield, Cable, BatteryCharging } from 'lucide-react';

const EASE = [0.22, 1, 0.36, 1];

const CATEGORIES = [
  { icon: Smartphone, label: 'Smartphones', href: '/shop?category=iPhone', desc: 'Latest models' },
  { icon: Zap,        label: 'Chargers',    href: '/shop?category=Chargers', desc: 'Fast charging' },
  { icon: Headphones, label: 'Audio',       href: '/shop?category=Audio', desc: 'Earbuds & headphones' },
  { icon: Shield,     label: 'Cases',       href: '/shop?category=Cases', desc: 'Protection & style' },
  { icon: Cable,      label: 'Cables',      href: '/shop?category=Cables', desc: 'USB-C, Lightning' },
  { icon: BatteryCharging, label: 'Power Banks', href: '/shop?category=PowerBanks', desc: 'Portable power' },
];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
};
const item = {
  hidden: { opacity: 0, y: 22 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } },
};

export default function CategorySection() {
  return (
    <section className="relative section bg-espresso-fade">
      <div className="hairline-gold absolute inset-x-0 top-0 opacity-50" />
      <div className="container-site">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6, ease: EASE }}
          className="mb-12 text-center"
        >
          <p className="eyebrow-light mb-3">Browse</p>
          <h2 className="font-serif text-4xl font-semibold tracking-tight text-white md:text-5xl">
            Shop by Category
          </h2>
        </motion.div>

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-60px' }}
          className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6"
        >
          {CATEGORIES.map(({ icon: Icon, label, href, desc }) => (
            <motion.div key={label} variants={item} whileHover={{ y: -6 }}>
              <Link
                href={href}
                className="group flex h-full flex-col items-center gap-3 rounded-2xl border border-brown-700 bg-white/[0.03] p-5 text-center backdrop-blur-sm transition-all duration-300 ease-mansa hover:border-gold-500/50 hover:bg-white/[0.06] hover:shadow-gold"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brown-700 transition-all duration-300 group-hover:bg-gold-gradient">
                  <Icon size={22} className="text-gold-400 transition-colors duration-300 group-hover:text-brown-900" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white transition-colors group-hover:text-gold-200">{label}</p>
                  <p className="mt-0.5 text-[11px] text-[#9C8A73]">{desc}</p>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
