import type { Metadata } from 'next';
import Link from 'next/link';
import { Truck, RotateCcw, Wallet, ShieldCheck, Globe2, PackageCheck } from 'lucide-react';
import PageHeader from '@/components/legal/PageHeader';

export const metadata: Metadata = {
  title: 'Returns & Shipping — Mansa Electronics',
  description:
    'Shipping times, return policy, refund process, and conditions for returning devices at Mansa Electronics.',
  alternates: { canonical: '/support/returns-shipping' },
};

const SHIPPING = [
  {
    icon: <Truck size={18} />,
    title: 'Domestic shipping',
    body: '2–5 business days via tracked carrier. Orders placed before 4pm ship the same business day.',
  },
  {
    icon: <Globe2 size={18} />,
    title: 'International shipping',
    body: '7–14 business days depending on destination. Duties and customs fees are calculated at checkout where possible.',
  },
  {
    icon: <ShieldCheck size={18} />,
    title: 'Insured & tracked',
    body: 'Every shipment is fully insured and tracked end-to-end. You’ll receive a tracking number as soon as the label is generated.',
  },
];

const RETURN_CONDITIONS = [
  'Device is returned within 30 days of delivery',
  'Original Mansa packaging and tamper-evident pouch are intact',
  'Device shows no signs of accidental or liquid damage',
  'All included accessories (cable, certificate) are returned',
];

const REFUND_TIMELINE = [
  { day: 'Day 0', body: 'You submit a return request — we email you a prepaid return label.' },
  { day: 'Day 1–7', body: 'You ship the device back to our warehouse.' },
  { day: 'Day 8–10', body: 'We inspect the returned device and confirm condition.' },
  { day: 'Day 11–14', body: 'Refund is issued to your original payment method.' },
];

export default function ReturnsShippingPage() {
  return (
    <div className="bg-white">
      <PageHeader
        eyebrow="Support"
        title="Returns & shipping"
        description="Clear, simple policies. 30 days to return, free returns on defective items, and tracked shipping worldwide."
        crumbs={[{ label: 'Support' }, { label: 'Returns & Shipping' }]}
      />

      <section className="mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8 space-y-14">
        {/* Shipping */}
        <div>
          <h2 className="flex items-center gap-2 text-xl font-bold text-charcoal-900 sm:text-2xl">
            <Truck size={20} className="text-charcoal-700" />
            Shipping
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-charcoal-600 sm:text-base">
            We ship from our warehouse same-day on orders placed before 4pm local time, Monday to
            Friday. Free standard shipping is included on every order above $99.
          </p>

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {SHIPPING.map((s) => (
              <div
                key={s.title}
                className="rounded-2xl border border-charcoal-100 bg-charcoal-50/40 p-5"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-charcoal-900 shadow-card">
                  {s.icon}
                </div>
                <h3 className="mt-3 text-sm font-semibold text-charcoal-900">{s.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-charcoal-600">{s.body}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Returns */}
        <div>
          <h2 className="flex items-center gap-2 text-xl font-bold text-charcoal-900 sm:text-2xl">
            <RotateCcw size={20} className="text-charcoal-700" />
            Return policy
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-charcoal-600 sm:text-base">
            You have <strong className="text-charcoal-900">30 days from delivery</strong> to return
            your device for any reason. If the device arrived defective, return shipping is free —
            we’ll email a prepaid label.
          </p>

          <div className="mt-6 rounded-2xl border border-charcoal-100 bg-white p-6">
            <h3 className="text-base font-semibold text-charcoal-900">Conditions for returns</h3>
            <ul className="mt-4 space-y-3">
              {RETURN_CONDITIONS.map((c) => (
                <li key={c} className="flex items-start gap-3 text-sm text-charcoal-700">
                  <PackageCheck size={18} className="mt-0.5 shrink-0 text-charcoal-900" />
                  <span>{c}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Refunds */}
        <div>
          <h2 className="flex items-center gap-2 text-xl font-bold text-charcoal-900 sm:text-2xl">
            <Wallet size={20} className="text-charcoal-700" />
            Refund process
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-charcoal-600 sm:text-base">
            Refunds are issued to your original payment method within 3–5 business days after we
            receive and inspect your return.
          </p>

          <ol className="mt-6 grid gap-3 sm:grid-cols-2">
            {REFUND_TIMELINE.map((step) => (
              <li
                key={step.day}
                className="rounded-2xl border border-charcoal-100 bg-white p-5"
              >
                <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-charcoal-500">
                  {step.day}
                </span>
                <p className="mt-2 text-sm leading-relaxed text-charcoal-700">{step.body}</p>
              </li>
            ))}
          </ol>
        </div>

        {/* CTA */}
        <div className="rounded-2xl bg-charcoal-50 p-8 text-center">
          <h3 className="text-lg font-semibold text-charcoal-900">Ready to start a return?</h3>
          <p className="mt-2 text-sm text-charcoal-600">
            Reach out with your order number and we’ll send you a return label right away.
          </p>
          <Link
            href="/support/contact"
            className="mt-4 inline-flex items-center rounded-full bg-charcoal-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-charcoal-700"
          >
            Request a return
          </Link>
        </div>
      </section>
    </div>
  );
}
