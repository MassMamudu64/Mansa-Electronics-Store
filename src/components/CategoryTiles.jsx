import Link from 'next/link';

const TILES = [
  {
    href: '/shop?category=iPhone&q=Pro%20Max',
    title: 'iPhone Pro Max',
    blurb: 'Flagship performance',
    accent: 'from-ink-900 to-ink-700',
  },
  {
    href: '/shop?category=iPhone&q=Pro',
    title: 'iPhone Pro',
    blurb: 'Power in a compact body',
    accent: 'from-gold-600 to-gold-400',
  },
  {
    href: '/shop?category=iPhone',
    title: 'All iPhones',
    blurb: 'From budget to flagship',
    accent: 'from-ink-700 to-ink-500',
  },
  {
    href: '/shop?category=Accessories',
    title: 'Accessories',
    blurb: 'Chargers, cables, audio',
    accent: 'from-emerald-700 to-emerald-500',
  },
];

export default function CategoryTiles() {
  return (
    <section className="section">
      <div className="mx-auto max-w-7xl px-4">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <span className="eyebrow">Shop by category</span>
            <h2 className="mt-2 text-2xl font-extrabold md:text-3xl">Find your next device</h2>
          </div>
          <Link href="/shop" className="btn-link">View all →</Link>
        </div>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {TILES.map((t) => (
            <Link
              key={t.href}
              href={t.href}
              className="group relative flex aspect-[4/5] flex-col justify-between overflow-hidden rounded-2xl p-5 ring-1 ring-ink-100 transition hover:shadow-card-hover"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${t.accent}`} />
              <div className="absolute inset-0 bg-black/10 transition group-hover:bg-black/0" />
              <div className="relative">
                <span className="inline-flex items-center rounded-full bg-white/90 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-ink-900">
                  {t.blurb}
                </span>
              </div>
              <div className="relative">
                <h3 className="text-xl font-bold text-white drop-shadow-sm md:text-2xl">{t.title}</h3>
                <span className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-white">
                  Shop now
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M13 5l7 7-7 7"/></svg>
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
