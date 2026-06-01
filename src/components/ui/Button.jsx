'use client';

import Link from 'next/link';
import { forwardRef } from 'react';
import { motion } from 'framer-motion';

const BASE =
  'group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-full font-semibold tracking-[0.01em] ' +
  'transition-colors duration-200 disabled:opacity-40 disabled:cursor-not-allowed ' +
  'focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-gold-600/40';

const VARIANTS = {
  primary: 'bg-brown-800 text-white hover:bg-brown-700 hover:shadow-gold',
  gold: 'bg-gold-gradient text-brown-900 font-bold hover:shadow-gold',
  secondary: 'border-[1.5px] border-brown-800 bg-transparent text-brown-800 hover:bg-brown-800 hover:text-white',
  ghost: 'text-ink-700 hover:bg-sand-100 hover:text-brown-800',
  white: 'bg-white text-brown-800 hover:bg-sand-100',
  'outline-white': 'border-[1.5px] border-white/40 text-white hover:border-white hover:bg-white/10',
};

const SIZES = {
  sm: 'px-4 py-2 text-xs',
  md: 'px-6 py-3 text-sm',
  lg: 'px-8 py-4 text-base',
};

const MotionLink = motion.create(Link);

const Button = forwardRef(function Button(
  { variant = 'primary', size = 'md', href, className = '', children, shimmer = true, ...props },
  ref
) {
  const cls = `${BASE} ${VARIANTS[variant] ?? VARIANTS.primary} ${SIZES[size] ?? SIZES.md} ${className}`;

  const inner = (
    <>
      <span className="relative z-10 inline-flex items-center gap-2">{children}</span>
      {shimmer && (
        <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gold-sheen transition-transform duration-700 ease-mansa group-hover:translate-x-full" />
      )}
    </>
  );

  const motionProps = {
    whileHover: { y: -2, scale: 1.02 },
    whileTap: { scale: 0.97 },
    transition: { type: 'spring', stiffness: 400, damping: 17 },
  };

  if (href) {
    return (
      <MotionLink ref={ref} href={href} className={cls} {...motionProps} {...props}>
        {inner}
      </MotionLink>
    );
  }
  return (
    <motion.button ref={ref} className={cls} {...motionProps} {...props}>
      {inner}
    </motion.button>
  );
});

export default Button;
