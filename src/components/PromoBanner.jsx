'use client';

import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import Button from '@/components/ui/Button';

const EASE = [0.22, 1, 0.36, 1];

export default function PromoBanner() {
  return (
    <section className="bg-paper-warm py-20">
      <div className="container-site">
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.7, ease: EASE }}
          className="relative overflow-hidden rounded-3xl border border-brown-700 bg-espresso-fade px-8 py-16 text-center md:px-16"
        >
          {/* Floating gold accents */}
          <motion.div
            aria-hidden
            className="pointer-events-none absolute -left-20 top-0 h-72 w-72 rounded-full bg-gold-600/20 blur-3xl"
            animate={{ y: [0, 22, 0], opacity: [0.5, 0.85, 0.5] }}
            transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            aria-hidden
            className="pointer-events-none absolute -right-16 bottom-0 h-80 w-80 rounded-full bg-gold-400/15 blur-3xl"
            animate={{ y: [0, -26, 0], opacity: [0.4, 0.7, 0.4] }}
            transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut', delay: 1.2 }}
          />
          {/* Gold hairline frame top */}
          <div className="hairline-gold absolute inset-x-0 top-0 opacity-60" />

          <div className="relative">
            <p className="eyebrow-light mb-4">New Arrivals</p>
            <h2 className="font-serif text-4xl font-semibold tracking-tight text-white md:text-6xl">
              The Latest Gear
              <br />
              <span className="animate-shimmer-text bg-[linear-gradient(110deg,#EFCD80,#D0A24D,#B27D21,#EFCD80)] bg-[length:200%_auto] bg-clip-text text-transparent">
                Is Here.
              </span>
            </h2>
            <p className="mx-auto mt-5 max-w-lg text-base text-[#CDBBA6] md:text-lg">
              Just arrived: flagship smartphones, fast chargers, and premium audio.
            </p>
            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Button href="/shop?sort=newest" variant="gold" size="md" className="shadow-gold">
                See New Arrivals
                <ArrowRight size={15} />
              </Button>
              <Button href="/shop" variant="outline-white" size="md">
                Browse All
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
