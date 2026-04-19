import Link from 'next/link';

export default function WhyMansa() {
  return (
    <section id="about" className="section">
      <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 md:grid-cols-2">
        <div className="order-2 md:order-1">
          <span className="eyebrow">Why Mansa</span>
          <h2 className="mt-2 text-2xl font-extrabold md:text-3xl">
            Premium, without the premium price.
          </h2>
          <p className="mt-3 text-ink-500">
            We buy lightly used iPhones, test them exhaustively, and grade them
            honestly — so you get a device that looks and feels new for a fraction
            of the retail price. No middlemen, no surprises.
          </p>
          <ul className="mt-6 space-y-3 text-sm text-ink-700">
            {[
              'Save up to 40% vs new retail',
              'Reduce e-waste — every device reused is one less thrown away',
              'Real humans test every phone. No automated re-sellers.',
              'Same-day shipping from our warehouse',
            ].map((p) => (
              <li key={p} className="flex items-start gap-2">
                <svg className="mt-0.5 shrink-0 text-gold-600" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6L9 17l-5-5"/></svg>
                <span>{p}</span>
              </li>
            ))}
          </ul>
          <div className="mt-7">
            <Link href="/shop" className="btn-primary">Start shopping</Link>
          </div>
        </div>

        <div className="order-1 md:order-2">
          <div className="relative">
            <div className="rounded-2xl bg-gradient-to-br from-gold-100 via-cream to-white p-8 ring-1 ring-ink-100">
              <div className="grid grid-cols-2 gap-4">
                <StatCard big="40%" small="Average savings" />
                <StatCard big="30+" small="Inspection points" />
                <StatCard big="12mo" small="Warranty" />
                <StatCard big="4.8★" small="Customer rating" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function StatCard({ big, small }) {
  return (
    <div className="rounded-xl bg-white p-5 shadow-card ring-1 ring-ink-100">
      <div className="text-3xl font-extrabold text-ink-900">{big}</div>
      <div className="mt-1 text-xs font-medium uppercase tracking-widest text-ink-400">{small}</div>
    </div>
  );
}
