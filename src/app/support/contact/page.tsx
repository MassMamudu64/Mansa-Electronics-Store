import type { Metadata } from 'next';
import { Mail, MessageCircle, MapPin, Clock } from 'lucide-react';
import PageHeader from '@/components/legal/PageHeader';
import ContactForm from '@/components/support/ContactForm';

export const metadata: Metadata = {
  title: 'Contact Us — Mansa Electronics',
  description:
    'Get in touch with the Mansa Electronics team. Reach out by email, WhatsApp, or through our contact form.',
  alternates: { canonical: '/support/contact' },
};

const SUPPORT_EMAIL = 'support@mansaelectronics.com';

export default function ContactPage() {
  return (
    <div className="bg-white">
      <PageHeader
        eyebrow="Support"
        title="Contact us"
        description="Questions about an order, a product, or a return? Send us a message — we usually reply within a few hours during business days."
        crumbs={[{ label: 'Support' }, { label: 'Contact' }]}
      />

      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-5 lg:gap-12">
          {/* Form */}
          <div className="lg:col-span-3">
            <h2 className="text-xl font-bold text-charcoal-900 sm:text-2xl">
              Send us a message
            </h2>
            <p className="mt-2 text-sm text-charcoal-600">
              Fill out the form below — fields are required.
            </p>
            <div className="mt-6">
              <ContactForm />
            </div>
          </div>

          {/* Sidebar */}
          <aside className="lg:col-span-2 space-y-4">
            <h2 className="text-xl font-bold text-charcoal-900 sm:text-2xl">
              Other ways to reach us
            </h2>
            <ContactCard
              icon={<Mail size={18} />}
              title="Email"
              body={
                <a
                  href={`mailto:${SUPPORT_EMAIL}`}
                  className="text-charcoal-900 underline-offset-4 hover:underline"
                >
                  {SUPPORT_EMAIL}
                </a>
              }
              subtitle="Replies within a few hours on business days"
            />
            <ContactCard
              icon={<MessageCircle size={18} />}
              title="WhatsApp"
              body={
                <span className="text-charcoal-900 font-medium">+1 (555) 123-4567</span>
              }
              subtitle="Chat with us in real time during business hours"
            />
            <ContactCard
              icon={<Clock size={18} />}
              title="Business hours"
              body={<span className="text-charcoal-900 font-medium">Mon–Fri, 9am – 6pm</span>}
              subtitle="Closed on public holidays"
            />
            <ContactCard
              icon={<MapPin size={18} />}
              title="Based in"
              body={<span className="text-charcoal-900 font-medium">Dakar, Senegal</span>}
              subtitle="Shipping worldwide"
            />
          </aside>
        </div>
      </section>
    </div>
  );
}

function ContactCard({
  icon,
  title,
  body,
  subtitle,
}: {
  icon: React.ReactNode;
  title: string;
  body: React.ReactNode;
  subtitle?: string;
}) {
  return (
    <div className="flex gap-4 rounded-2xl border border-charcoal-100 bg-white p-5">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-charcoal-50 text-charcoal-900">
        {icon}
      </div>
      <div className="min-w-0">
        <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-charcoal-500">
          {title}
        </h3>
        <p className="mt-1 text-sm break-words">{body}</p>
        {subtitle && <p className="mt-1 text-xs text-charcoal-500">{subtitle}</p>}
      </div>
    </div>
  );
}
