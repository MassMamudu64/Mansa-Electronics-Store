import { Truck, RotateCcw, ShieldCheck, Headphones } from 'lucide-react';

const PILLARS = [
  {
    icon: Truck,
    title: 'Free Delivery',
    desc: 'On all orders above $50. Fast, tracked shipping to your door.',
  },
  {
    icon: RotateCcw,
    title: 'Easy Returns',
    desc: '30-day hassle-free returns. No questions asked.',
  },
  {
    icon: ShieldCheck,
    title: 'Secure Checkout',
    desc: 'Your data is protected. Shop with confidence.',
  },
  {
    icon: Headphones,
    title: '24/7 Support',
    desc: 'Our team is ready to help before and after your purchase.',
  },
];

export default function TrustSection() {
  return (
    <section className="section bg-charcoal-50">
      <div className="container-site">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {PILLARS.map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="flex flex-col items-center gap-3 rounded-2xl border border-charcoal-100 bg-white p-6 text-center shadow-card"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-charcoal-900">
                <Icon size={22} className="text-white" />
              </div>
              <h3 className="text-sm font-bold text-charcoal-900">{title}</h3>
              <p className="text-sm leading-relaxed text-charcoal-500">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
