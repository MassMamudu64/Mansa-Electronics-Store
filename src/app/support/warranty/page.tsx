import type { Metadata } from 'next';
import Link from 'next/link';
import { ShieldCheck, Clock, CheckCircle2, XCircle, ClipboardList } from 'lucide-react';
import PageHeader from '@/components/legal/PageHeader';

export const metadata: Metadata = {
  title: 'Warranty — Mansa Electronics',
  description:
    'Mansa Electronics 12-month limited warranty: coverage, duration, what is included, what is excluded, and how to file a claim.',
  alternates: { canonical: '/support/warranty' },
};

const INCLUDED = [
  'Hardware defects in materials or workmanship',
  'Battery performance below 80% within the warranty period',
  'Screen, camera, speaker, or port failures unrelated to damage',
  'Connectivity issues (Wi-Fi, Bluetooth, cellular) on factory components',
];

const EXCLUDED = [
  'Accidental damage (drops, cracks, dents)',
  'Liquid or water damage',
  'Unauthorized repairs or modifications',
  'Cosmetic wear from normal use',
  'Loss or theft',
];

const STEPS = [
  {
    title: 'Submit a claim',
    body: 'Email support@mansaelectronics.com with your order number, a description of the issue, and a short video or photos.',
  },
  {
    title: 'We diagnose',
    body: 'Our team responds within 1–2 business days with a diagnosis and next steps. Most issues are resolved without sending the device in.',
  },
  {
    title: 'Repair or replace',
    body: 'If the issue is covered, we’ll either repair the device or replace it. We cover return shipping in both directions.',
  },
];

export default function WarrantyPage() {
  return (
    <div className="bg-white">
      <PageHeader
        eyebrow="Support"
        title="Mansa 12-month limited warranty"
        description="Every device we sell is backed by a 12-month limited warranty against hardware defects, with battery coverage included."
        crumbs={[{ label: 'Support' }, { label: 'Warranty' }]}
      />

      <section className="mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8 space-y-12">
        {/* Highlights */}
        <div className="grid gap-4 sm:grid-cols-2">
          <HighlightCard
            icon={<ShieldCheck size={20} />}
            title="Comprehensive coverage"
            body="Hardware defects, battery degradation, and component failures are all covered."
          />
          <HighlightCard
            icon={<Clock size={20} />}
            title="12 months from delivery"
            body="Warranty starts the day your order is delivered, not the day it ships."
          />
        </div>

        {/* What's covered / not covered */}
        <div className="grid gap-6 md:grid-cols-2">
          <CoverageList
            tone="positive"
            title="What's covered"
            icon={<CheckCircle2 size={18} />}
            items={INCLUDED}
          />
          <CoverageList
            tone="negative"
            title="What's not covered"
            icon={<XCircle size={18} />}
            items={EXCLUDED}
          />
        </div>

        {/* Claim process */}
        <div>
          <h2 className="flex items-center gap-2 text-xl font-bold text-charcoal-900 sm:text-2xl">
            <ClipboardList size={20} className="text-charcoal-700" />
            How to file a claim
          </h2>
          <ol className="mt-6 space-y-4">
            {STEPS.map((s, i) => (
              <li
                key={s.title}
                className="flex gap-4 rounded-2xl border border-charcoal-100 bg-white p-5"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-charcoal-900 text-sm font-semibold text-white">
                  {i + 1}
                </span>
                <div>
                  <h3 className="font-semibold text-charcoal-900">{s.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-charcoal-600">{s.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        {/* CTA */}
        <div className="rounded-2xl bg-charcoal-900 p-8 text-center text-white">
          <h3 className="text-lg font-semibold">Need to file a warranty claim?</h3>
          <p className="mt-2 text-sm text-charcoal-300">
            Reach out and we’ll get you sorted as quickly as possible.
          </p>
          <Link
            href="/support/contact"
            className="mt-4 inline-flex items-center rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-charcoal-900 transition hover:bg-charcoal-100"
          >
            Contact support
          </Link>
        </div>
      </section>
    </div>
  );
}

function HighlightCard({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-2xl border border-charcoal-100 bg-charcoal-50/40 p-5">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-charcoal-900 shadow-card">
        {icon}
      </div>
      <h3 className="mt-3 font-semibold text-charcoal-900">{title}</h3>
      <p className="mt-1 text-sm leading-relaxed text-charcoal-600">{body}</p>
    </div>
  );
}

function CoverageList({
  tone,
  title,
  icon,
  items,
}: {
  tone: 'positive' | 'negative';
  title: string;
  icon: React.ReactNode;
  items: string[];
}) {
  const iconColor = tone === 'positive' ? 'text-emerald-600' : 'text-red-500';
  return (
    <div className="rounded-2xl border border-charcoal-100 bg-white p-6">
      <h3 className="text-base font-semibold text-charcoal-900">{title}</h3>
      <ul className="mt-4 space-y-3">
        {items.map((item) => (
          <li key={item} className="flex items-start gap-3 text-sm text-charcoal-700">
            <span className={`mt-0.5 shrink-0 ${iconColor}`}>{icon}</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
