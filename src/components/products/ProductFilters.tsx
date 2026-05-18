'use client';

import { useEffect, useState, type ChangeEvent } from 'react';
import { Search, SlidersHorizontal, X, ChevronDown, Check } from 'lucide-react';

export interface FilterState {
  q: string;
  category: string;
  storages: string[];
  conditions: string[];
  minPrice: string;
  maxPrice: string;
  inStockOnly: boolean;
  sort: string;
}

export const EMPTY_FILTERS: FilterState = {
  q: '',
  category: '',
  storages: [],
  conditions: [],
  minPrice: '',
  maxPrice: '',
  inStockOnly: false,
  sort: 'featured',
};

interface CategoryOption {
  label: string;
  value: string;
}

interface Props {
  categories: CategoryOption[];
  storages: string[];
  conditions: string[];
  sortOptions: { label: string; value: string }[];
  filters: FilterState;
  onChange: (next: FilterState) => void;
  onClear: () => void;
  resultCount: number;
  totalCount: number;
}

const CONDITION_LABEL: Record<string, string> = {
  A: 'Excellent (A)',
  B: 'Very Good (B)',
  C: 'Good (C)',
};

export default function ProductFilters({
  categories,
  storages,
  conditions,
  sortOptions,
  filters,
  onChange,
  onClear,
  resultCount,
  totalCount,
}: Props) {
  const [mobileOpen, setMobileOpen] = useState(false);

  // Lock body scroll while the mobile drawer is open
  useEffect(() => {
    if (!mobileOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileOpen]);

  function setField<K extends keyof FilterState>(key: K, value: FilterState[K]) {
    onChange({ ...filters, [key]: value });
  }

  function toggleInArray(key: 'storages' | 'conditions', value: string) {
    const cur = new Set(filters[key]);
    cur.has(value) ? cur.delete(value) : cur.add(value);
    onChange({ ...filters, [key]: Array.from(cur) });
  }

  const activeCount =
    (filters.category ? 1 : 0) +
    filters.storages.length +
    filters.conditions.length +
    (filters.minPrice ? 1 : 0) +
    (filters.maxPrice ? 1 : 0) +
    (filters.inStockOnly ? 1 : 0);

  return (
    <>
      {/* ─── Sticky desktop / mobile-trigger bar ─── */}
      <div className="sticky top-0 z-30 -mx-4 border-b border-charcoal-100 bg-white/80 px-4 backdrop-blur-xl sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <div className="flex items-center gap-3 py-3">
          {/* Search */}
          <div className="relative min-w-0 flex-1 sm:max-w-sm">
            <Search
              size={15}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-charcoal-400"
            />
            <input
              type="text"
              value={filters.q}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setField('q', e.target.value)}
              placeholder="Search products…"
              className="w-full rounded-full border border-charcoal-200 bg-white/70 py-2 pl-9 pr-9 text-sm text-charcoal-900 placeholder-charcoal-400 transition focus:border-charcoal-900 focus:outline-none focus:ring-2 focus:ring-charcoal-900/10"
            />
            {filters.q && (
              <button
                type="button"
                onClick={() => setField('q', '')}
                aria-label="Clear search"
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-charcoal-400 hover:bg-charcoal-100 hover:text-charcoal-900"
              >
                <X size={13} />
              </button>
            )}
          </div>

          {/* Inline category pills — desktop only */}
          <div className="hidden flex-1 items-center gap-1.5 overflow-x-auto lg:flex">
            <CategoryPill
              label="All"
              active={!filters.category}
              onClick={() => setField('category', '')}
            />
            {categories.map((c) => (
              <CategoryPill
                key={c.value}
                label={c.label}
                active={filters.category === c.value}
                onClick={() => setField('category', filters.category === c.value ? '' : c.value)}
              />
            ))}
          </div>

          {/* Sort dropdown */}
          <div className="relative">
            <select
              value={filters.sort}
              onChange={(e) => setField('sort', e.target.value)}
              className="appearance-none rounded-full border border-charcoal-200 bg-white py-2 pl-4 pr-9 text-sm font-medium text-charcoal-700 transition hover:border-charcoal-900 hover:text-charcoal-900 focus:border-charcoal-900 focus:outline-none"
              aria-label="Sort products"
            >
              {sortOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <ChevronDown
              size={14}
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-charcoal-500"
            />
          </div>

          {/* Filters trigger */}
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="relative inline-flex items-center gap-1.5 rounded-full border border-charcoal-200 bg-white px-3.5 py-2 text-sm font-medium text-charcoal-700 transition hover:border-charcoal-900 hover:text-charcoal-900"
          >
            <SlidersHorizontal size={14} />
            <span className="hidden sm:inline">Filters</span>
            {activeCount > 0 && (
              <span className="ml-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-charcoal-900 px-1 text-[10px] font-bold text-white">
                {activeCount}
              </span>
            )}
          </button>
        </div>

        {/* Active filter chips */}
        {activeCount > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 pb-3 pt-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-charcoal-400">
              {resultCount} of {totalCount}
            </span>
            {filters.category && (
              <ActiveChip
                label={categories.find((c) => c.value === filters.category)?.label ?? filters.category}
                onRemove={() => setField('category', '')}
              />
            )}
            {filters.storages.map((s) => (
              <ActiveChip key={`s-${s}`} label={s} onRemove={() => toggleInArray('storages', s)} />
            ))}
            {filters.conditions.map((c) => (
              <ActiveChip
                key={`c-${c}`}
                label={CONDITION_LABEL[c] ?? c}
                onRemove={() => toggleInArray('conditions', c)}
              />
            ))}
            {filters.minPrice && (
              <ActiveChip label={`Min $${filters.minPrice}`} onRemove={() => setField('minPrice', '')} />
            )}
            {filters.maxPrice && (
              <ActiveChip label={`Max $${filters.maxPrice}`} onRemove={() => setField('maxPrice', '')} />
            )}
            {filters.inStockOnly && (
              <ActiveChip label="In stock only" onRemove={() => setField('inStockOnly', false)} />
            )}
            <button
              type="button"
              onClick={onClear}
              className="ml-1 text-[11px] font-semibold text-charcoal-500 underline-offset-2 hover:text-charcoal-900 hover:underline"
            >
              Clear all
            </button>
          </div>
        )}
      </div>

      {/* ─── Drawer ─── */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50">
          {/* Backdrop */}
          <button
            type="button"
            aria-label="Close filters"
            onClick={() => setMobileOpen(false)}
            className="absolute inset-0 bg-charcoal-900/40 backdrop-blur-sm animate-fade-in"
          />
          {/* Panel — bottom sheet on mobile, side drawer on larger screens */}
          <div className="absolute inset-x-0 bottom-0 max-h-[85vh] overflow-hidden rounded-t-3xl bg-white shadow-2xl animate-slide-up sm:inset-y-0 sm:right-0 sm:left-auto sm:max-h-none sm:w-[420px] sm:rounded-l-3xl sm:rounded-tr-none">
            <div className="flex items-center justify-between border-b border-charcoal-100 px-6 py-4">
              <h3 className="text-base font-bold tracking-tight text-charcoal-900">Filters</h3>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                aria-label="Close"
                className="rounded-full p-1.5 text-charcoal-500 hover:bg-charcoal-100 hover:text-charcoal-900"
              >
                <X size={18} />
              </button>
            </div>

            <div className="max-h-[calc(85vh-8rem)] overflow-y-auto px-6 py-5 sm:max-h-[calc(100vh-8rem)]">
              <FilterGroup title="Category">
                <div className="flex flex-wrap gap-1.5">
                  <Pill
                    label="All"
                    active={!filters.category}
                    onClick={() => setField('category', '')}
                  />
                  {categories.map((c) => (
                    <Pill
                      key={c.value}
                      label={c.label}
                      active={filters.category === c.value}
                      onClick={() =>
                        setField('category', filters.category === c.value ? '' : c.value)
                      }
                    />
                  ))}
                </div>
              </FilterGroup>

              {storages.length > 0 && (
                <FilterGroup title="Storage">
                  <div className="flex flex-wrap gap-1.5">
                    {storages.map((s) => (
                      <Pill
                        key={s}
                        label={s}
                        active={filters.storages.includes(s)}
                        onClick={() => toggleInArray('storages', s)}
                      />
                    ))}
                  </div>
                </FilterGroup>
              )}

              {conditions.length > 0 && (
                <FilterGroup title="Condition">
                  <div className="space-y-1.5">
                    {conditions.map((c) => (
                      <CheckRow
                        key={c}
                        label={CONDITION_LABEL[c] ?? c}
                        checked={filters.conditions.includes(c)}
                        onChange={() => toggleInArray('conditions', c)}
                      />
                    ))}
                  </div>
                </FilterGroup>
              )}

              <FilterGroup title="Price (USD)">
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    inputMode="numeric"
                    min={0}
                    placeholder="Min"
                    value={filters.minPrice}
                    onChange={(e) => setField('minPrice', e.target.value)}
                    className="w-full rounded-xl border border-charcoal-200 bg-white px-3 py-2 text-sm text-charcoal-900 placeholder-charcoal-400 focus:border-charcoal-900 focus:outline-none"
                  />
                  <span className="text-charcoal-300">–</span>
                  <input
                    type="number"
                    inputMode="numeric"
                    min={0}
                    placeholder="Max"
                    value={filters.maxPrice}
                    onChange={(e) => setField('maxPrice', e.target.value)}
                    className="w-full rounded-xl border border-charcoal-200 bg-white px-3 py-2 text-sm text-charcoal-900 placeholder-charcoal-400 focus:border-charcoal-900 focus:outline-none"
                  />
                </div>
              </FilterGroup>

              <FilterGroup title="Availability">
                <CheckRow
                  label="In stock only"
                  checked={filters.inStockOnly}
                  onChange={() => setField('inStockOnly', !filters.inStockOnly)}
                />
              </FilterGroup>
            </div>

            <div className="flex items-center gap-3 border-t border-charcoal-100 bg-white px-6 py-4">
              <button
                type="button"
                onClick={onClear}
                className="flex-1 rounded-full border border-charcoal-200 py-2.5 text-sm font-semibold text-charcoal-700 transition hover:border-charcoal-900 hover:text-charcoal-900"
              >
                Clear all
              </button>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="flex-1 rounded-full bg-charcoal-900 py-2.5 text-sm font-semibold text-white transition hover:bg-charcoal-700"
              >
                Show {resultCount} result{resultCount !== 1 ? 's' : ''}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* ──────────────── Subcomponents ──────────────── */

function CategoryPill({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-all duration-150 ${
        active
          ? 'border-charcoal-900 bg-charcoal-900 text-white shadow-sm'
          : 'border-charcoal-200 bg-white text-charcoal-600 hover:border-charcoal-900 hover:text-charcoal-900'
      }`}
    >
      {label}
    </button>
  );
}

function Pill({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${
        active
          ? 'border-charcoal-900 bg-charcoal-900 text-white'
          : 'border-charcoal-200 bg-white text-charcoal-700 hover:border-charcoal-900'
      }`}
    >
      {label}
    </button>
  );
}

function ActiveChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-charcoal-900 py-1 pl-3 pr-1 text-[11px] font-medium text-white">
      {label}
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove ${label}`}
        className="flex h-4 w-4 items-center justify-center rounded-full hover:bg-white/20"
      >
        <X size={10} />
      </button>
    </span>
  );
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-charcoal-100 py-5 first:pt-0 last:border-b-0 last:pb-0">
      <h4 className="mb-3 text-[11px] font-bold uppercase tracking-[0.15em] text-charcoal-500">
        {title}
      </h4>
      {children}
    </div>
  );
}

function CheckRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between rounded-xl px-3 py-2 text-sm text-charcoal-800 transition hover:bg-charcoal-50">
      <span className="font-medium">{label}</span>
      <span
        className={`flex h-5 w-5 items-center justify-center rounded-md border transition ${
          checked
            ? 'border-charcoal-900 bg-charcoal-900 text-white'
            : 'border-charcoal-300 bg-white'
        }`}
      >
        {checked && <Check size={13} strokeWidth={3} />}
      </span>
      <input type="checkbox" checked={checked} onChange={onChange} className="sr-only" />
    </label>
  );
}
