'use client';

import { motion } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';
import Button from '@/components/ui/Button';

const EASE = [0.22, 1, 0.36, 1];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.1 } },
};
const up = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE } },
};

const TRUST = ['Free Delivery', 'Easy Returns', 'Secure Payment', 'Genuine Products'];

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-espresso-fade">
      {/* Subtle grid texture */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            'linear-gradient(#EFCD80 1px, transparent 1px), linear-gradient(90deg, #EFCD80 1px, transparent 1px)',
          backgroundSize: '64px 64px',
        }}
      />

      {/* Floating gold glow orbs */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -left-32 top-10 h-[420px] w-[420px] rounded-full bg-gold-600/20 blur-3xl"
        animate={{ y: [0, 28, 0], x: [0, 16, 0], opacity: [0.5, 0.8, 0.5] }}
        transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -right-24 bottom-0 h-[480px] w-[480px] rounded-full bg-gold-400/15 blur-3xl"
        animate={{ y: [0, -34, 0], x: [0, -20, 0], opacity: [0.4, 0.7, 0.4] }}
        transition={{ duration: 13, repeat: Infinity, ease: 'easeInOut', delay: 1.5 }}
      />
      {/* Center radial sheen */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 h-[700px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold-200/[0.06] blur-3xl"
        animate={{ scale: [1, 1.12, 1] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Top gold hairline */}
      <div className="hairline-gold absolute inset-x-0 top-0 opacity-60" />

      <div className="container-site relative py-28 md:py-36 lg:py-44">
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="mx-auto max-w-3xl text-center"
        >
          {/* Eyebrow pill */}
          <motion.div variants={up} className="mb-6 flex justify-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-gold-600/30 bg-white/[0.04] px-4 py-1.5 text-xs font-semibold uppercase tracking-eyebrow text-gold-400 backdrop-blur-sm">
              <Sparkles size={13} className="text-gold-400" />
              Mansa Electronics
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            variants={up}
            className="font-serif text-6xl font-semibold leading-[1.02] tracking-tight text-white md:text-7xl lg:text-8xl"
          >
            Technology fit
            <br />
            <span className="relative inline-block">
              <span className="animate-shimmer-text bg-[linear-gradient(110deg,#EFCD80,#D0A24D,#B27D21,#EFCD80)] bg-[length:200%_auto] bg-clip-text text-transparent">
                for a king.
              </span>
            </span>
          </motion.h1>

          {/* Subtext */}
          <motion.p
            variants={up}
            className="mx-auto mt-7 max-w-xl text-lg leading-relaxed text-[#CDBBA6] md:text-xl"
          >
            Authentic devices, expert-picked, delivered with honour.
            <br className="hidden md:block" />
            Technology. Quality. Trust.
          </motion.p>

          {/* CTAs */}
          <motion.div
            variants={up}
            className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row"
          >
            <Button href="/shop" variant="gold" size="lg" className="shadow-gold">
              Shop Now
              <ArrowRight size={16} />
            </Button>
            <Button href="/shop?category=Accessories" variant="outline-white" size="lg">
              View Accessories
            </Button>
          </motion.div>

          {/* Trust micro-badges */}
          <motion.div
            variants={up}
            className="mt-14 flex flex-wrap items-center justify-center gap-x-7 gap-y-3 text-xs text-[#9C8A73]"
          >
            {TRUST.map((t, i) => (
              <motion.span
                key={t}
                className="flex items-center gap-1.5"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9 + i * 0.1, duration: 0.4 }}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-gold-500" />
                {t}
              </motion.span>
            ))}
          </motion.div>
        </motion.div>
      </div>

      {/* Scroll cue */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute bottom-6 left-1/2 -translate-x-1/2"
        animate={{ y: [0, 8, 0], opacity: [0.4, 1, 0.4] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      >
        <div className="flex h-9 w-5 items-start justify-center rounded-full border border-gold-500/40 p-1.5">
          <div className="h-1.5 w-1 rounded-full bg-gold-400" />
        </div>
      </motion.div>
    </section>
  );
}
