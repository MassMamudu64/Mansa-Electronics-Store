'use client';

import { motion } from 'framer-motion';
import { Truck, RotateCcw, ShieldCheck, Headphones } from 'lucide-react';

const EASE = [0.22, 1, 0.36, 1];

const PILLARS = [
  {
    icon: Truck,
    title: 'Free Delivery',
    desc: 'On all orders above $450. Fast, tracked shipping to your door.',
  },
  {
    icon: RotateCcw,
    title: 'Easy Returns',
    desc: '30-day hassle-free returns. No questions asked.',
  },
  {
    icon: ShieldCheck,
    title: 'Secure Checkout',
    desc: 'Your data is protected. Shop with confidence.',
  },
  {
    icon: Headphones,
    title: '24/7 Support',
    desc: 'Our team is ready to help before and after your purchase.',
  },
];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1, delayChildren: 0.05 } },
};
const item = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: EASE } },
};

export default function TrustSection() {
  return (
    <section className="section bg-paper-warm">
      <div className="container-site">
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-80px' }}
          className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4"
        >
          {PILLARS.map(({ icon: Icon, title, desc }) => (
            <motion.div
              key={title}
              variants={item}
              whileHover={{ y: -6 }}
              className="group flex flex-col items-center gap-3 rounded-2xl border border-sand-300 bg-white p-6 text-center shadow-card transition-all duration-300 ease-mansa hover:border-gold-500/40 hover:shadow-card-lg"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-brown-800 transition-all duration-300 group-hover:bg-gold-gradient group-hover:shadow-gold">
                <Icon size={22} className="text-gold-400 transition-colors duration-300 group-hover:text-brown-900" />
              </div>
              <h3 className="text-sm font-bold text-brown-800">{title}</h3>
              <p className="text-sm leading-relaxed text-ink-500">{desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
