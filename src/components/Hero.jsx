import Link from 'next/link';

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-cream">
      {/* Soft gold glow */}
      <div aria-hidden className="pointer-events-none absolute -top-40 right-[-10%] h-[520px] w-[520px] rounded-full bg-gold-200/40 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute bottom-[-200px] left-[-10%] h-[420px] w-[420px] rounded-full bg-gold-300/30 blur-3xl" />

      <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-16 md:grid-cols-2 md:py-24">
        <div>
          <span className="eyebrow">Mansa Electronics</span>
          <h1 className="mt-3 font-display text-4xl font-extrabold leading-[1.05] text-ink-900 md:text-6xl">
            Premium iPhones.<br />
            <span className="text-gold-600">Hand-graded.</span> Ready to ship.
          </h1>
          <p className="mt-5 max-w-xl text-base text-ink-500">
            Every device is tested across 30+ points, graded A, B, or C, and backed by a
            12-month limited warranty. No guesswork — just a clean phone at a fair price.
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <Link href="/shop" className="btn-primary">
              Shop iPhones
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M13 5l7 7-7 7"/></svg>
            </Link>
            <Link href="/shop?category=Accessories" className="btn-ghost">Browse accessories</Link>
          </div>

          {/* Inline trust row */}
          <dl className="mt-10 grid max-w-md grid-cols-3 gap-6">
            <Stat k="30+" v="Inspection points" />
            <Stat k="12 mo" v="Warranty" />
            <Stat k="30-day" v="Returns" />
          </dl>
        </div>

        {/* Hero visual */}
        <div className="relative">
          <div className="relative mx-auto aspect-[4/5] w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-card-lg ring-1 ring-ink-100">
            <div className="absolute inset-0 bg-gradient-to-br from-cream to-gold-50" />
            <svg viewBox="0 0 400 500" className="absolute inset-0 h-full w-full">
              <defs>
                <linearGradient id="phone" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#1A1E27"/>
                  <stop offset="100%" stopColor="#0A0E17"/>
                </linearGradient>
              </defs>
              <rect x="100" y="60" width="200" height="380" rx="38" fill="url(#phone)"/>
              <rect x="112" y="72" width="176" height="356" rx="28" fill="#0A0E17"/>
              <rect x="175" y="78" width="50" height="12" rx="6" fill="#12151C"/>
              <rect x="120" y="120" width="160" height="260" rx="6" fill="#111826"/>
              <text x="200" y="420" textAnchor="middle" fill="#C9A227" fontFamily="Inter, sans-serif" fontSize="14" fontWeight="800" letterSpacing="4">MANSA</text>
            </svg>
          </div>

          {/* Floating badge */}
          <div className="absolute -left-4 bottom-6 hidden rounded-xl bg-white p-3 shadow-card-lg ring-1 ring-ink-100 md:block">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6L9 17l-5-5"/></svg>
              </div>
              <div>
                <div className="text-xs font-semibold text-ink-900">Certified tested</div>
                <div className="text-[11px] text-ink-400">30+ checkpoints</div>
              </div>
            </div>
          </div>

          <div className="absolute -right-2 top-10 hidden rounded-xl bg-ink-900 p-3 text-white shadow-card-lg md:block">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gold-500 text-ink-900">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>
              </div>
              <div>
                <div className="text-xs font-semibold">Fast shipping</div>
                <div className="text-[11px] text-ink-300">Ships same day</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Stat({ k, v }) {
  return (
    <div>
      <dt className="text-2xl font-extrabold text-ink-900">{k}</dt>
      <dd className="mt-1 text-xs font-medium uppercase tracking-widest text-ink-400">{v}</dd>
    </div>
  );
}
