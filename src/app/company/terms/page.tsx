import type { Metadata } from 'next';
import PageHeader from '@/components/legal/PageHeader';

export const metadata: Metadata = {
  title: 'Terms of Service — Mansa Electronics',
  description:
    'The terms and conditions that govern your use of Mansa Electronics, including store policies, payment terms, and liability.',
  alternates: { canonical: '/company/terms' },
};

const LAST_UPDATED = 'May 1, 2026';

const SECTIONS = [
  {
    heading: '1. Acceptance of terms',
    body: (
      <p>
        By accessing or using the Mansa Electronics website (the “Service”) you agree to be bound
        by these Terms of Service. If you do not agree, please do not use the Service.
      </p>
    ),
  },
  {
    heading: '2. Eligibility',
    body: (
      <p>
        You must be at least 18 years old, or the age of majority in your jurisdiction, to place
        an order. By using the Service, you represent that you meet this requirement.
      </p>
    ),
  },
  {
    heading: '3. Accounts',
    body: (
      <p>
        You are responsible for maintaining the confidentiality of your account credentials and
        for all activity under your account. Notify us promptly of any unauthorized use.
      </p>
    ),
  },
  {
    heading: '4. Products and pricing',
    body: (
      <>
        <p>
          We do our best to describe products accurately. Colors, finishes, and minor cosmetic
          details may vary slightly from photos. Prices are shown in the displayed currency and
          may change without notice. Taxes and shipping are calculated at checkout.
        </p>
        <p className="mt-3">
          We reserve the right to refuse or cancel an order — including after confirmation — if
          we suspect fraud, pricing errors, or stock issues. In that case, you will be fully
          refunded.
        </p>
      </>
    ),
  },
  {
    heading: '5. Payment terms',
    body: (
      <>
        <p>
          Payment is due at checkout. We accept the methods displayed on our payment page,
          including major credit cards, Apple Pay, Google Pay, and mobile money in supported
          regions. All payments are processed securely through our payment partners — we never
          store your full card details.
        </p>
        <p className="mt-3">
          If a payment is declined or reversed, the corresponding order may be cancelled and any
          related accessories or warranties voided until payment is settled.
        </p>
      </>
    ),
  },
  {
    heading: '6. Shipping, returns & warranty',
    body: (
      <p>
        Our shipping times, return policy, and warranty terms are described on our{' '}
        <a
          href="/support/returns-shipping"
          className="text-charcoal-900 underline underline-offset-4"
        >
          Returns & Shipping
        </a>{' '}
        and{' '}
        <a
          href="/support/warranty"
          className="text-charcoal-900 underline underline-offset-4"
        >
          Warranty
        </a>{' '}
        pages and are incorporated into these Terms by reference.
      </p>
    ),
  },
  {
    heading: '7. Acceptable use',
    body: (
      <>
        <p>You agree not to use the Service to:</p>
        <ul className="mt-3 list-disc space-y-1.5 pl-6">
          <li>Submit fraudulent orders or chargebacks</li>
          <li>Scrape, mirror, or resell content without permission</li>
          <li>Disrupt or attempt to compromise the Service or its security</li>
          <li>Violate applicable law or third-party rights</li>
        </ul>
      </>
    ),
  },
  {
    heading: '8. Intellectual property',
    body: (
      <p>
        All content on the Service — including text, images, logos, design, and software — is the
        property of Mansa Electronics or its licensors and is protected by copyright and trademark
        law. You may not reproduce or distribute it without our written consent.
      </p>
    ),
  },
  {
    heading: '9. Disclaimers',
    body: (
      <p>
        The Service is provided “as is” and “as available” without warranties of any kind, express
        or implied, except those that cannot be excluded under applicable law. We do not warrant
        that the Service will be uninterrupted, error-free, or free from malicious code.
      </p>
    ),
  },
  {
    heading: '10. Limitation of liability',
    body: (
      <p>
        To the maximum extent permitted by law, Mansa Electronics is not liable for indirect,
        incidental, special, consequential, or punitive damages, or any loss of profits, data, or
        goodwill arising from your use of the Service. Our total liability for any claim arising
        out of an order is limited to the amount you paid for that order.
      </p>
    ),
  },
  {
    heading: '11. Indemnification',
    body: (
      <p>
        You agree to indemnify and hold Mansa Electronics harmless from any claims, damages, or
        expenses arising from your breach of these Terms or your misuse of the Service.
      </p>
    ),
  },
  {
    heading: '12. Governing law',
    body: (
      <p>
        These Terms are governed by the laws of Senegal, without regard to its conflict of laws
        rules. Any dispute will be resolved in the competent courts of Dakar unless local
        consumer protection law provides otherwise.
      </p>
    ),
  },
  {
    heading: '13. Changes to these terms',
    body: (
      <p>
        We may update these Terms from time to time. Material changes will be communicated by
        email or a prominent notice on the website. Continued use of the Service after changes
        constitutes acceptance.
      </p>
    ),
  },
  {
    heading: '14. Contact',
    body: (
      <p>
        Questions about these Terms? Email{' '}
        <a
          href="mailto:legal@mansaelectronics.com"
          className="text-charcoal-900 underline underline-offset-4"
        >
          legal@mansaelectronics.com
        </a>
        .
      </p>
    ),
  },
];

export default function TermsPage() {
  return (
    <div className="bg-white">
      <PageHeader
        eyebrow="Company"
        title="Terms of Service"
        description={`Last updated: ${LAST_UPDATED}`}
        crumbs={[{ label: 'Company' }, { label: 'Terms of Service' }]}
      />

      <section className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <div className="space-y-10 text-sm leading-relaxed text-charcoal-600 sm:text-[15px]">
          {SECTIONS.map((s) => (
            <div key={s.heading}>
              <h2 className="text-lg font-semibold text-charcoal-900 sm:text-xl">{s.heading}</h2>
              <div className="mt-3 space-y-3">{s.body}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
