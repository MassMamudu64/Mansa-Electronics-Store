const items = [
  {
    title: 'Free shipping',
    blurb: 'On orders over $99, shipped worldwide.',
    icon: (
      <path d="M3 7h13v10H3zM16 10h4l2 3v4h-6zM6 20a2 2 0 100-4 2 2 0 000 4zm12 0a2 2 0 100-4 2 2 0 000 4z" />
    ),
  },
  {
    title: '12-month warranty',
    blurb: 'Every device is covered for a full year.',
    icon: <path d="M12 2l8 4v6c0 5-3.5 9-8 10-4.5-1-8-5-8-10V6z" />,
  },
  {
    title: '30-day returns',
    blurb: 'Not for you? Return it, no questions asked.',
    icon: <path d="M3 12a9 9 0 1018 0c0-3-1.5-6-4-7.5M3 12V6m0 6h6" />,
  },
  {
    title: 'Tested & certified',
    blurb: '30+ point inspection on every iPhone.',
    icon: <path d="M20 6L9 17l-5-5" />,
  },
];

export default function TrustRail() {
  return (
    <section className="border-y border-ink-100 bg-cream">
      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 md:grid-cols-4">
        {items.map((i) => (
          <div key={i.title} className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-gold-600 shadow-card ring-1 ring-ink-100">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                {i.icon}
              </svg>
            </div>
            <div>
              <div className="text-sm font-semibold text-ink-900">{i.title}</div>
              <div className="text-xs text-ink-500">{i.blurb}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
