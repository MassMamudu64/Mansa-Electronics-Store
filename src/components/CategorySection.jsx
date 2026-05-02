import Link from 'next/link';
import { Smartphone, Zap, Headphones, Shield, Cable, BatteryCharging } from 'lucide-react';

const CATEGORIES = [
  { icon: Smartphone, label: 'Smartphones', href: '/shop?category=iPhone', desc: 'Latest models' },
  { icon: Zap,        label: 'Chargers',    href: '/shop?category=Chargers', desc: 'Fast charging' },
  { icon: Headphones, label: 'Audio',       href: '/shop?category=Audio', desc: 'Earbuds & headphones' },
  { icon: Shield,     label: 'Cases',       href: '/shop?category=Cases', desc: 'Protection & style' },
  { icon: Cable,      label: 'Cables',      href: '/shop?category=Cables', desc: 'USB-C, Lightning' },
  { icon: BatteryCharging, label: 'Power Banks', href: '/shop?category=PowerBanks', desc: 'Portable power' },
];

export default function CategorySection() {
  return (
    <section className="bg-charcoal-900 section">
      <div className="container-site">
        <div className="mb-10 text-center">
          <p className="eyebrow-light mb-3">Browse</p>
          <h2 className="text-3xl font-black tracking-tight text-white md:text-4xl">
            Shop by Category
          </h2>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {CATEGORIES.map(({ icon: Icon, label, href, desc }) => (
            <Link
              key={label}
              href={href}
              className="group flex flex-col items-center gap-3 rounded-2xl border border-charcoal-700 bg-charcoal-800 p-5 text-center transition-all duration-200 hover:border-charcoal-500 hover:bg-charcoal-700"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-charcoal-700 transition group-hover:bg-charcoal-600">
                <Icon size={22} className="text-charcoal-200" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">{label}</p>
                <p className="mt-0.5 text-[11px] text-charcoal-500">{desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
