import type { Metadata } from 'next';
import Link from 'next/link';
import { Sparkles, ShieldCheck, Heart, Users, Globe2 } from 'lucide-react';
import PageHeader from '@/components/legal/PageHeader';

export const metadata: Metadata = {
  title: 'About Mansa — Mansa Electronics',
  description:
    'The story behind Mansa Electronics — our mission, our values, and what makes us a different kind of mobile electronics retailer.',
  alternates: { canonical: '/company/about' },
};

const VALUES = [
  {
    icon: <ShieldCheck size={20} />,
    title: 'Quality first',
    body: 'Every device passes a rigorous 30+ point inspection before it ships. If it doesn’t meet our bar, it doesn’t leave the warehouse.',
  },
  {
    icon: <Heart size={20} />,
    title: 'Honest pricing',
    body: 'No hidden fees. No gimmicks. We price devices based on real condition and real value, with full transparency on what you’re getting.',
  },
  {
    icon: <Users size={20} />,
    title: 'Real human support',
    body: 'A small, experienced team answers every message personally. No call centers, no chatbots, no scripts.',
  },
  {
    icon: <Globe2 size={20} />,
    title: 'Built for everywhere',
    body: 'We ship worldwide because great tech shouldn’t be limited by zip code. Unlocked devices, global warranty, tracked shipping.',
  },
];

export default function AboutPage() {
  return (
    <div className="bg-white">
      <PageHeader
        eyebrow="Company"
        title="About Mansa Electronics"
        description="We started Mansa to bring premium mobile electronics within reach — without the markup, the marketing fluff, or the guesswork."
        crumbs={[{ label: 'Company' }, { label: 'About' }]}
      />

      <section className="mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8 space-y-16">
       {/* Brand story */}
<div>
  <span className="inline-flex items-center gap-2 rounded-full bg-charcoal-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-charcoal-700">
    <Sparkles size={12} /> Our story
  </span>

  <h2 className="mt-4 text-2xl font-bold tracking-tight text-charcoal-900 sm:text-3xl">
    Premium tech, without the markup.
  </h2>

  <div className="mt-6 space-y-4 text-base leading-relaxed text-charcoal-600 sm:text-[17px]">
    <p>
      Mansa Electronics began with a simple truth: people across Africa deserve access to the same
      premium American devices — without inflated prices, unclear conditions, or confusing return
      policies.
    </p>

    <p>
      So we built a better path. From the USA, we source carefully, inspect every device, and
      document exactly what you're getting — battery health, cosmetic grade, accessories, everything.
      Every order is backed by a real warranty and real human support.
    </p>

    <p>
      We're a small U.S.-based team serving customers across Africa and beyond. We focus on the
      details others skip, because we'd rather deliver fewer devices perfectly than many devices
      carelessly.
    </p>
  </div>
</div>


        {/* Mission */}
        <div className="rounded-3xl bg-charcoal-900 p-8 text-white sm:p-10">
          <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-charcoal-400">
            Our mission
          </span>
          <h2 className="mt-3 text-2xl font-bold sm:text-3xl">
            Make premium mobile electronics accessible, transparent, and trustworthy — everywhere.
          </h2>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-charcoal-300 sm:text-base">
            Every decision we make — sourcing, inspection, pricing, packaging, support — comes back
            to that promise.
          </p>
        </div>

        {/* Values */}
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-charcoal-900 sm:text-3xl">
            What we believe
          </h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {VALUES.map((v) => (
              <div
                key={v.title}
                className="rounded-2xl border border-charcoal-100 bg-white p-6"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-charcoal-50 text-charcoal-900">
                  {v.icon}
                </div>
                <h3 className="mt-4 text-base font-semibold text-charcoal-900">{v.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-charcoal-600">{v.body}</p>
              </div>
            ))}
          </div>
        </div>

        {/* What makes us unique */}
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-charcoal-900 sm:text-3xl">
            Why Mansa is different
          </h2>
          <ul className="mt-6 space-y-4">
            <UniqueRow
              title="Documented inspection on every device"
              body="You receive a signed certificate of inspection — not a vague grade."
            />
            <UniqueRow
              title="12-month warranty including battery"
              body="Most resellers cover hardware only. We cover battery degradation below 80% too."
            />
            <UniqueRow
              title="Real returns, no friction"
              body="30 days, no questions, prepaid return label for defective devices."
            />
            <UniqueRow
              title="Curated, not endless"
              body="We sell what we’d buy ourselves. That’s why our catalog is focused, not bloated."
            />
          </ul>
        </div>

        {/* CTA */}
        <div className="rounded-2xl border border-charcoal-100 bg-charcoal-50/50 p-8 text-center">
          <h3 className="text-lg font-semibold text-charcoal-900">Browse the collection</h3>
          <p className="mt-2 text-sm text-charcoal-600">
            See what we’ve put through the inspection process this month.
          </p>
          <Link
            href="/shop"
            className="mt-4 inline-flex items-center rounded-full bg-charcoal-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-charcoal-700"
          >
            Shop now
          </Link>
        </div>
      </section>
    </div>
  );
}

function UniqueRow({ title, body }: { title: string; body: string }) {
  return (
    <li className="flex gap-4 rounded-2xl border border-charcoal-100 bg-white p-5">
      <div className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-charcoal-900" />
      <div>
        <h3 className="font-semibold text-charcoal-900">{title}</h3>
        <p className="mt-1 text-sm leading-relaxed text-charcoal-600">{body}</p>
      </div>
    </li>
  );
}
