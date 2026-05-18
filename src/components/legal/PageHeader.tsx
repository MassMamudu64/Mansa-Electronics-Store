import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

type Crumb = { label: string; href?: string };

interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  crumbs?: Crumb[];
}

export default function PageHeader({ eyebrow, title, description, crumbs }: PageHeaderProps) {
  return (
    <section className="border-b border-charcoal-100 bg-charcoal-50/50">
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
        {crumbs && crumbs.length > 0 && (
          <nav
            aria-label="Breadcrumb"
            className="mb-6 flex flex-wrap items-center gap-1.5 text-xs text-charcoal-500"
          >
            <Link href="/" className="hover:text-charcoal-900 transition">
              Home
            </Link>
            {crumbs.map((c, i) => (
              <span key={i} className="flex items-center gap-1.5">
                <ChevronRight size={12} className="text-charcoal-300" />
                {c.href ? (
                  <Link href={c.href} className="hover:text-charcoal-900 transition">
                    {c.label}
                  </Link>
                ) : (
                  <span className="text-charcoal-700">{c.label}</span>
                )}
              </span>
            ))}
          </nav>
        )}

        {eyebrow && (
          <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-charcoal-500">
            {eyebrow}
          </span>
        )}
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-charcoal-900 sm:text-4xl lg:text-5xl">
          {title}
        </h1>
        {description && (
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-charcoal-600 sm:text-lg">
            {description}
          </p>
        )}
      </div>
    </section>
  );
}
