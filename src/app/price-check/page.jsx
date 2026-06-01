import PriceCheckCard from '@/components/pricing/PriceCheckCard';

export const metadata = {
  title: 'Price Check — Mansa Electronics',
  description:
    'Estimate a device’s selling price based on current wholesale availability and pricing rules.',
};

export default function PriceCheckPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-charcoal-100 bg-gradient-to-b from-charcoal-50 via-white to-white">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-32 left-1/2 h-80 w-[36rem] -translate-x-1/2 rounded-full bg-charcoal-200/40 blur-3xl"
        />
        <div className="container-site relative py-12 sm:py-16">
          <div className="mx-auto max-w-2xl text-center">
            <p className="eyebrow">Pricing tool</p>
            <h1 className="mt-2 text-4xl font-black tracking-tight text-charcoal-900 sm:text-5xl">
              Price Check
            </h1>
            <p className="mx-auto mt-3 max-w-xl text-sm text-charcoal-500 sm:text-base">
              Estimate a device&apos;s selling price based on current wholesale
              availability and the pricing rules you&apos;ve configured.
            </p>
          </div>
        </div>
      </section>

      {/* Tool */}
      <section className="container-site py-10 sm:py-14">
        <div className="mx-auto max-w-4xl">
          <PriceCheckCard />

          {/* Explainer */}
          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            <Step
              n={1}
              title="Match"
              body="We look up the most recent wholesale listing for the model, storage, and condition you enter."
            />
            <Step
              n={2}
              title="Apply rules"
              body="Active pricing rules pick the right markup. The most specific rule (sku > brand > category > global) wins."
            />
            <Step
              n={3}
              title="Decide"
              body="See retail price, wholesale cost, margin, and a quick Buy / Skip recommendation."
            />
          </div>
        </div>
      </section>
    </div>
  );
}

function Step({ n, title, body }) {
  return (
    <div className="rounded-2xl border border-charcoal-100 bg-white p-5 shadow-card">
      <div className="flex items-center gap-3">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-charcoal-900 text-xs font-bold text-white">
          {n}
        </span>
        <h3 className="text-sm font-bold text-charcoal-900">{title}</h3>
      </div>
      <p className="mt-2 text-xs leading-relaxed text-charcoal-500">{body}</p>
    </div>
  );
}
