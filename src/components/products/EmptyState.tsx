import { PackageSearch } from 'lucide-react';

interface Props {
  title?: string;
  description?: string;
  onClear?: () => void;
}

export default function EmptyState({
  title = 'No products match your filters',
  description = 'Try removing a filter, broadening your search, or browsing all products.',
  onClear,
}: Props) {
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-charcoal-200 bg-charcoal-50/50 px-6 py-20 text-center animate-fade-in">
      <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-card">
        <PackageSearch className="text-charcoal-400" size={28} strokeWidth={1.5} />
      </div>
      <h3 className="text-xl font-bold tracking-tight text-charcoal-900">{title}</h3>
      <p className="mt-2 max-w-sm text-sm text-charcoal-500">{description}</p>
      {onClear && (
        <button
          type="button"
          onClick={onClear}
          className="mt-6 rounded-full bg-charcoal-900 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-charcoal-700"
        >
          Clear filters
        </button>
      )}
    </div>
  );
}
