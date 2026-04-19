'use client';

import { useState } from 'react';

const faqs = [
  {
    q: 'How is my order delivered?',
    a: 'Once your order is placed, we package it the same day and ship via tracked carriers. You\'ll get a confirmation email with your invoice, and tracking details as soon as the label is generated.',
  },
  {
    q: 'How do you test each device?',
    a: 'Every iPhone passes a 30+ point inspection: screen, battery health, camera system, Face ID / Touch ID, speakers, microphones, ports, cellular, Wi-Fi, and Bluetooth. We document the result before grading.',
  },
  {
    q: 'What\'s included with my iPhone?',
    a: 'Every device ships with a braided USB-C cable and a Mansa certificate of inspection. Original box and EarPods are not included — that\'s how we keep prices down.',
  },
  {
    q: 'What does the 12-month warranty cover?',
    a: 'Hardware defects and battery performance drop below 80%. Accidental damage and water damage are not covered, but we can help you with affordable repairs either way.',
  },
  {
    q: 'Can I return my order?',
    a: 'Yes — 30 days from delivery, no questions asked, as long as the device is in the condition you received it. We\'ll email a return label.',
  },
];

export default function FAQSection() {
  const [open, setOpen] = useState(0);
  return (
    <section id="faq" className="section bg-cream">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 md:grid-cols-3">
        <div>
          <span className="eyebrow">FAQ</span>
          <h2 className="mt-2 text-2xl font-extrabold md:text-3xl">Questions? We've got answers.</h2>
          <p className="mt-3 text-ink-500">
            Still unsure? Reach out — we're a small team and we'll get back to you quickly.
          </p>
        </div>

        <div className="md:col-span-2">
          <div className="divide-y divide-ink-100 rounded-xl border border-ink-100 bg-white">
            {faqs.map((f, i) => (
              <button
                key={f.q}
                type="button"
                className="w-full text-left"
                onClick={() => setOpen(open === i ? -1 : i)}
                aria-expanded={open === i}
              >
                <div className="flex items-center justify-between px-5 py-4">
                  <span className="text-sm font-semibold text-ink-900">{f.q}</span>
                  <svg
                    className={`transition ${open === i ? 'rotate-180 text-gold-600' : 'text-ink-400'}`}
                    width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M6 9l6 6 6-6"/>
                  </svg>
                </div>
                {open === i && (
                  <div className="px-5 pb-5 text-sm text-ink-600">{f.a}</div>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
