import type { Metadata } from 'next';
import PageHeader from '@/components/legal/PageHeader';

export const metadata: Metadata = {
  title: 'Privacy Policy — Mansa Electronics',
  description:
    'How Mansa Electronics collects, uses, stores, and protects your personal data — and the rights you have over it.',
  alternates: { canonical: '/company/privacy-policy' },
};

const LAST_UPDATED = 'May 1, 2026';

const SECTIONS = [
  {
    heading: '1. Introduction',
    body: (
      <p>
        This Privacy Policy describes how Mansa Electronics (“we”, “us”, or “our”) collects, uses,
        and shares your personal data when you visit our website, place an order, or interact with
        our customer support. By using our services, you agree to the practices described here.
      </p>
    ),
  },
  {
    heading: '2. Information we collect',
    body: (
      <>
        <p>We collect information in three main ways:</p>
        <ul className="mt-3 list-disc space-y-1.5 pl-6">
          <li>
            <strong>Information you give us</strong> — name, email, shipping address, phone number,
            and payment details when you place an order or contact support.
          </li>
          <li>
            <strong>Information collected automatically</strong> — device type, browser,
            IP address, pages viewed, and referral source.
          </li>
          <li>
            <strong>Information from third parties</strong> — fraud-prevention data and payment
            confirmation from our payment processors.
          </li>
        </ul>
      </>
    ),
  },
  {
    heading: '3. How we use your information',
    body: (
      <ul className="list-disc space-y-1.5 pl-6">
        <li>To process and fulfill your orders</li>
        <li>To send order confirmations, shipping notifications, and warranty information</li>
        <li>To respond to support inquiries</li>
        <li>To prevent fraud and abuse</li>
        <li>To improve our website, products, and services</li>
        <li>
          To send marketing emails when you’ve opted in — you can unsubscribe at any time
        </li>
      </ul>
    ),
  },
  {
    heading: '4. Cookies and tracking',
    body: (
      <>
        <p>
          We use cookies and similar technologies to keep your cart working, remember your
          preferences, measure traffic, and (with your consent) personalize marketing.
        </p>
        <p className="mt-3">
          You can disable cookies in your browser settings. Strictly necessary cookies cannot be
          disabled, as they are required for the site to function.
        </p>
      </>
    ),
  },
  {
    heading: '5. Sharing your information',
    body: (
      <>
        <p>We never sell your personal data. We share it only with:</p>
        <ul className="mt-3 list-disc space-y-1.5 pl-6">
          <li>Payment processors to charge your card securely</li>
          <li>Shipping carriers to deliver your order</li>
          <li>Service providers (hosting, analytics, email) bound by confidentiality</li>
          <li>Authorities when legally required</li>
        </ul>
      </>
    ),
  },
  {
    heading: '6. Data retention',
    body: (
      <p>
        We retain order records for as long as required by applicable tax and accounting law
        (typically 6–10 years). Account data is retained until you ask us to delete it. Marketing
        preferences are stored until you opt out.
      </p>
    ),
  },
  {
    heading: '7. Your rights',
    body: (
      <>
        <p>You have the right to:</p>
        <ul className="mt-3 list-disc space-y-1.5 pl-6">
          <li>Access the personal data we hold about you</li>
          <li>Correct inaccurate or incomplete data</li>
          <li>Request deletion of your data (subject to legal retention requirements)</li>
          <li>Object to or restrict certain types of processing</li>
          <li>Export your data in a portable format</li>
          <li>Lodge a complaint with your local data protection authority</li>
        </ul>
        <p className="mt-3">
          To exercise any of these rights, email{' '}
          <a
            href="mailto:privacy@mansaelectronics.com"
            className="text-charcoal-900 underline underline-offset-4"
          >
            privacy@mansaelectronics.com
          </a>
          .
        </p>
      </>
    ),
  },
  {
    heading: '8. Data security',
    body: (
      <p>
        We use industry-standard safeguards — encryption in transit (TLS), encrypted storage,
        scoped access controls, and regular security reviews. No system is perfectly secure, but
        we take protecting your data seriously.
      </p>
    ),
  },
  {
    heading: '9. Children’s privacy',
    body: (
      <p>
        Our services are not directed at children under 16. We do not knowingly collect personal
        data from anyone under 16. If you believe a child has provided us with personal data,
        contact us and we will delete it.
      </p>
    ),
  },
  {
    heading: '10. Changes to this policy',
    body: (
      <p>
        We may update this Privacy Policy from time to time. Material changes will be communicated
        by email or a prominent notice on the website. The “last updated” date at the top of this
        page reflects the most recent revision.
      </p>
    ),
  },
  {
    heading: '11. Contact us',
    body: (
      <p>
        Questions about this policy? Email{' '}
        <a
          href="mailto:privacy@mansaelectronics.com"
          className="text-charcoal-900 underline underline-offset-4"
        >
          privacy@mansaelectronics.com
        </a>{' '}
        or write to us at our registered address in Dakar, Senegal.
      </p>
    ),
  },
];

export default function PrivacyPolicyPage() {
  return (
    <div className="bg-white">
      <PageHeader
        eyebrow="Company"
        title="Privacy Policy"
        description={`Last updated: ${LAST_UPDATED}`}
        crumbs={[{ label: 'Company' }, { label: 'Privacy Policy' }]}
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
