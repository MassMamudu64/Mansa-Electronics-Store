import type { Metadata } from 'next';
import Link from 'next/link';
import { MessageCircle } from 'lucide-react';
import PageHeader from '@/components/legal/PageHeader';
import Accordion, { AccordionItem } from '@/components/support/Accordion';

export const metadata: Metadata = {
  title: 'FAQ — Mansa Electronics',
  description:
    'Answers to common questions about ordering, shipping, warranty, returns, and product inspection at Mansa Electronics.',
  alternates: { canonical: '/support/faq' },
  openGraph: {
    title: 'Frequently Asked Questions | Mansa Electronics',
    description: 'Common questions about ordering, shipping, warranty, and returns.',
    type: 'website',
  },
};

const FAQS: AccordionItem[] = [
  {
    q: 'How long does shipping take?',
    a: 'Orders placed before 4pm ship the same business day. Domestic delivery typically arrives in 2–5 business days; international orders take 7–14 business days depending on destination.',
  },
  {
    q: 'Do you ship internationally?',
    a: 'Yes. We ship to most countries worldwide via tracked carriers. Shipping rates and customs duties are calculated at checkout.',
  },
  {
    q: 'How is my order packaged?',
    a: 'Every device is sealed in a tamper-evident pouch, padded inside a recyclable mailer, and ships with a Mansa certificate of inspection.',
  },
  {
    q: 'How do you test each device?',
    a: 'Every iPhone passes a 30+ point inspection — screen, battery health, camera system, Face ID / Touch ID, speakers, microphones, ports, cellular, Wi-Fi, and Bluetooth. We document the result before grading.',
  },
  {
    q: 'What payment methods do you accept?',
    a: 'We accept Visa, Mastercard, American Express, Apple Pay, Google Pay, and mobile money in supported regions. All payments are processed securely with end-to-end encryption.',
  },
  {
    q: 'Can I cancel or change my order?',
    a: 'Yes, as long as your order hasn’t shipped. Contact us within 2 hours of placing your order and we’ll do our best to update or cancel it before the label is generated.',
  },
  {
    q: 'Does my device come unlocked?',
    a: 'Yes — every smartphone we sell is fully unlocked and compatible with all major carriers worldwide unless explicitly stated otherwise on the product page.',
  },
  {
    q: 'What does the 12-month warranty cover?',
    a: 'Hardware defects and battery performance drops below 80% are covered. Accidental damage and water damage are not covered, but we can help arrange affordable repairs.',
  },
  {
    q: 'Can I return my order?',
    a: 'Yes — 30 days from delivery, no questions asked, as long as the device is in the condition you received it. We’ll email a prepaid return label.',
  },
  {
    q: 'How do I track my order?',
    a: 'You’ll receive a tracking number by email as soon as your label is generated. You can also view tracking from your account on the order detail page.',
  },
];

export default function FAQPage() {
  return (
    <div className="bg-white">
      <PageHeader
        eyebrow="Support"
        title="Frequently asked questions"
        description="Answers to the questions our customers ask most. Can’t find what you need? Reach out — we’re happy to help."
        crumbs={[{ label: 'Support' }, { label: 'FAQ' }]}
      />

      <section className="mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <Accordion items={FAQS} defaultOpen={0} />

        <div className="mt-12 rounded-2xl bg-charcoal-50 p-6 text-center sm:p-8">
          <MessageCircle className="mx-auto text-charcoal-900" size={24} />
          <h3 className="mt-3 text-lg font-semibold text-charcoal-900">
            Still have questions?
          </h3>
          <p className="mt-2 text-sm text-charcoal-600">
            Our team usually replies within a few hours during business days.
          </p>
          <Link
            href="/support/contact"
            className="mt-4 inline-flex items-center rounded-full bg-charcoal-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-charcoal-700"
          >
            Contact us
          </Link>
        </div>
      </section>
    </div>
  );
}
