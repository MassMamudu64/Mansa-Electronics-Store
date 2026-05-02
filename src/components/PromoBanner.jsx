import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export default function PromoBanner() {
  return (
    <section className="bg-charcoal-950 py-20">
      <div className="container-site">
        <div className="relative overflow-hidden rounded-3xl border border-charcoal-800 bg-charcoal-900 px-8 py-16 text-center md:px-16">
          {/* Background accent */}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="h-[400px] w-[600px] rounded-full bg-white/[0.02] blur-3xl" />
          </div>

          <div className="relative">
            <p className="eyebrow-light mb-4">New Arrivals</p>
            <h2 className="text-3xl font-black tracking-tight text-white md:text-5xl">
              The Latest Gear
              <br />
              <span className="text-charcoal-400">Is Here.</span>
            </h2>
            <p className="mt-4 text-base text-charcoal-400 md:text-lg">
              Just arrived: flagship smartphones, fast chargers, and premium audio.
            </p>
            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Link href="/shop?sort=newest" className="btn-white gap-2 px-8 py-3.5 text-sm">
                See New Arrivals
                <ArrowRight size={15} />
              </Link>
              <Link href="/shop" className="btn-outline-white px-8 py-3.5 text-sm">
                Browse All
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
