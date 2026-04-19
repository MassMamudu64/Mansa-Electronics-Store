import Link from 'next/link';

export default function Breadcrumbs({ items }) {
  return (
    <nav aria-label="Breadcrumb" className="text-xs text-ink-400">
      <ol className="flex flex-wrap items-center gap-1.5">
        {items.map((it, i) => (
          <li key={i} className="flex items-center gap-1.5">
            {it.href ? (
              <Link href={it.href} className="hover:text-ink-900">{it.label}</Link>
            ) : (
              <span className="text-ink-700">{it.label}</span>
            )}
            {i < items.length - 1 && <span className="text-ink-300">/</span>}
          </li>
        ))}
      </ol>
    </nav>
  );
}
