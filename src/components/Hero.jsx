import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-charcoal-950">
      {/* Subtle grid texture */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
          backgroundSize: '64px 64px',
        }}
      />
      {/* Radial glow */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[700px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/[0.025] blur-3xl" />

      <div className="container-site relative py-28 md:py-36 lg:py-44">
        <div className="mx-auto max-w-3xl text-center animate-slide-up">
          <p className="eyebrow-light mb-5">Mansa Electronics</p>

          <h1 className="text-5xl font-black leading-[1.05] tracking-tight text-white md:text-6xl lg:text-7xl">
            Premium Tech.
            <br />
            <span className="text-charcoal-400">Built to Last.</span>
          </h1>

          <p className="mt-6 text-lg leading-relaxed text-charcoal-400 md:text-xl">
            Smartphones, chargers, audio accessories, and more.
            <br className="hidden md:block" />
            Handpicked for quality. Delivered to your door.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/shop" className="btn-white gap-2 px-8 py-4 text-base shadow-lg">
              Shop Now
              <ArrowRight size={16} />
            </Link>
            <Link href="/shop?category=Accessories" className="btn-outline-white px-8 py-4 text-base">
              View Accessories
            </Link>
          </div>

          {/* Trust micro-badges */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-xs text-charcoal-500">
            {['Free Delivery', 'Easy Returns', 'Secure Payment', 'Genuine Products'].map((t) => (
              <span key={t} className="flex items-center gap-1.5">
                <span className="h-1 w-1 rounded-full bg-emerald-500" />
                {t}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
