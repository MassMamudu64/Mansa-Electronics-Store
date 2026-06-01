'use client';

/**
 * <PriceCheckCard /> — embeddable quote widget.
 *
 * Talks to POST /api/pricing/quote. Renders a form on the left, results on
 * the right (stacked on mobile). The endpoint returns the full operator
 * payload including wholesale + margin + appliedRule; pass `publicView` to
 * hide those client-side. NOTE: `publicView` is cosmetic — the data still
 * arrives over the wire. For a true public version we'll add a stripped
 * /api/pricing/quote/public endpoint in a later phase.
 */

import { useState, type FormEvent } from 'react';
import { useMutation } from '@tanstack/react-query';
import {
  AlertCircle,
  Loader2,
  Search,
  Sparkles,
  ThumbsDown,
  ThumbsUp,
  TrendingUp,
} from 'lucide-react';
import { formatPrice } from '@/lib/money';

// ─── Public API ──────────────────────────────────────────────────────────────

export interface PriceCheckCardProps {
  className?: string;
  initialModel?: string;
  initialStorage?: string;
  initialCondition?: string;
  /** Hide wholesale price, margin, and applied-rule details. Default: false. */
  publicView?: boolean;
}

// Mirrors the JSON returned by POST /api/pricing/quote — see
// src/app/api/pricing/quote/route.ts and src/lib/pricing/quote.ts.
export interface QuoteResponse {
  sku: string;
  name: string;
  brand: string | null;
  model: string | null;
  condition: string | null;
  storage: string | null;
  quantity: number;
  wholesalePrice: number;
  retailPrice: number;
  margin: number;
  marginPct: number;
  lineSubtotal: number;
  inStock: boolean;
  appliedRule: {
    id: string;
    name: string;
    scope: 'global' | 'category' | 'brand' | 'sku';
    scopeValue: string | null;
    markupPct: number;
    floorPrice: number | null;
    ceilingPrice: number | null;
  } | null;
  currency: string;
  generatedAt: string;
}

// ─── Form options ────────────────────────────────────────────────────────────

const STORAGE_OPTIONS = ['', '64GB', '128GB', '256GB', '512GB', '1TB', '2TB'] as const;

const CONDITION_OPTIONS = [
  { value: '',    label: 'Any' },
  { value: 'New', label: 'New' },
  { value: 'A',   label: 'Grade A — Excellent' },
  { value: 'B',   label: 'Grade B — Good' },
  { value: 'C',   label: 'Grade C — Fair' },
];

const COMMON_MODELS = [
  'iPhone 11', 'iPhone 11 Pro', 'iPhone 11 Pro Max',
  'iPhone 12', 'iPhone 12 mini', 'iPhone 12 Pro', 'iPhone 12 Pro Max',
  'iPhone 13', 'iPhone 13 mini', 'iPhone 13 Pro', 'iPhone 13 Pro Max',
  'iPhone 14', 'iPhone 14 Plus', 'iPhone 14 Pro', 'iPhone 14 Pro Max',
  'iPhone 15', 'iPhone 15 Plus', 'iPhone 15 Pro', 'iPhone 15 Pro Max',
  'iPhone 16', 'iPhone 16 Plus', 'iPhone 16 Pro', 'iPhone 16 Pro Max',
];

// ─── Decision thresholds (operator view only) ────────────────────────────────

interface Decision {
  label: string;
  tone: 'green' | 'amber' | 'red';
  icon: typeof ThumbsUp;
  hint: string;
}

function decide(marginPct: number): Decision {
  if (marginPct >= 25) {
    return {
      label: 'Strong buy',
      tone: 'green',
      icon: ThumbsUp,
      hint: 'Margin is well above target.',
    };
  }
  if (marginPct >= 15) {
    return {
      label: 'Buy',
      tone: 'green',
      icon: ThumbsUp,
      hint: 'Healthy margin.',
    };
  }
  if (marginPct >= 5) {
    return {
      label: 'Marginal',
      tone: 'amber',
      icon: AlertCircle,
      hint: 'Thin margin — consider negotiating cost or skipping.',
    };
  }
  return {
    label: 'Skip',
    tone: 'red',
    icon: ThumbsDown,
    hint: 'Below margin floor — not worth taking on.',
  };
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function PriceCheckCard({
  className = '',
  initialModel = '',
  initialStorage = '',
  initialCondition = '',
  publicView = false,
}: PriceCheckCardProps) {
  const [model, setModel] = useState(initialModel);
  const [storage, setStorage] = useState(initialStorage);
  const [condition, setCondition] = useState(initialCondition);
  const [quantity, setQuantity] = useState('1');
  const [validationError, setValidationError] = useState<string | null>(null);

  const quoteMutation = useMutation<QuoteResponse, Error, void>({
    mutationFn: async () => {
      const res = await fetch('/api/pricing/quote', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: model.trim(),
          storage: storage || undefined,
          condition: condition || undefined,
          quantity: Math.max(1, Math.min(99, Number(quantity) || 1)),
        }),
      });
      const body = (await res.json()) as QuoteResponse | { error: string };
      if (!res.ok) {
        if (res.status === 404) {
          throw new Error(
            'No matching listing yet for that device. Try a different model or storage.',
          );
        }
        throw new Error((body as { error?: string }).error ?? 'Quote failed');
      }
      return body as QuoteResponse;
    },
  });

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setValidationError(null);
    if (!model.trim()) {
      setValidationError('Enter a model name (e.g. "iPhone 14 Pro").');
      return;
    }
    quoteMutation.mutate();
  }

  const result = quoteMutation.data;
  const isLoading = quoteMutation.isPending;
  const error = validationError ?? (quoteMutation.error?.message ?? null);

  return (
    <div
      className={`overflow-hidden rounded-3xl border border-charcoal-100 bg-white shadow-card ${className}`}
    >
      <div className="grid md:grid-cols-2">
        {/* ─── Form ──────────────────────────────────────────────────── */}
        <form onSubmit={onSubmit} className="space-y-4 p-6 md:p-8" noValidate>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-charcoal-400">
              Look up
            </p>
            <h2 className="mt-1 text-xl font-extrabold tracking-tight text-charcoal-900">
              Get a price
            </h2>
          </div>

          <div>
            <label htmlFor="pc-model" className="label">
              Model <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Search
                size={14}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-charcoal-400"
              />
              <input
                id="pc-model"
                list="pc-model-suggest"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="input pl-9"
                placeholder="e.g. iPhone 14 Pro"
                autoComplete="off"
                maxLength={200}
              />
              <datalist id="pc-model-suggest">
                {COMMON_MODELS.map((m) => (
                  <option key={m} value={m} />
                ))}
              </datalist>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="pc-storage" className="label">
                Storage
              </label>
              <select
                id="pc-storage"
                value={storage}
                onChange={(e) => setStorage(e.target.value)}
                className="input"
              >
                {STORAGE_OPTIONS.map((s) => (
                  <option key={s || 'any'} value={s}>
                    {s || 'Any'}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="pc-condition" className="label">
                Condition
              </label>
              <select
                id="pc-condition"
                value={condition}
                onChange={(e) => setCondition(e.target.value)}
                className="input"
              >
                {CONDITION_OPTIONS.map((c) => (
                  <option key={c.value || 'any'} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="pc-qty" className="label">
              Quantity
            </label>
            <input
              id="pc-qty"
              type="number"
              min="1"
              max="99"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="input w-28"
            />
          </div>

          {error && (
            <div
              role="alert"
              className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700"
            >
              <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="btn-primary w-full gap-2 py-3"
          >
            {isLoading ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Checking…
              </>
            ) : (
              <>
                <Sparkles size={14} />
                Get quote
              </>
            )}
          </button>

          <p className="text-[11px] leading-relaxed text-charcoal-400">
            Quotes reflect current wholesale availability and active pricing
            rules. Prices update each time the catalog syncs.
          </p>
        </form>

        {/* ─── Result panel ─────────────────────────────────────────── */}
        <div className="border-t border-charcoal-100 bg-charcoal-50/60 p-6 md:border-l md:border-t-0 md:p-8">
          {!result && !isLoading && (
            <EmptyState />
          )}

          {isLoading && <LoadingState />}

          {result && !isLoading && (
            <ResultBody result={result} publicView={publicView} />
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Result subcomponents ────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex h-full flex-col items-center justify-center py-10 text-center">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white text-charcoal-400 shadow-card">
        <TrendingUp size={20} />
      </div>
      <p className="text-sm font-semibold text-charcoal-700">
        Enter a device to see a price
      </p>
      <p className="mt-1 max-w-xs text-xs text-charcoal-400">
        We&apos;ll match it to the most recent wholesale listing and apply your
        active pricing rules.
      </p>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex h-full flex-col items-center justify-center py-10 text-center">
      <Loader2 size={20} className="mb-3 animate-spin text-charcoal-400" />
      <p className="text-sm text-charcoal-500">Finding the best match…</p>
    </div>
  );
}

function ResultBody({
  result,
  publicView,
}: {
  result: QuoteResponse;
  publicView: boolean;
}) {
  const showCostBasis = !publicView;
  const decision = showCostBasis ? decide(result.marginPct) : null;
  const DecisionIcon = decision?.icon;
  const decisionTone =
    decision?.tone === 'green'
      ? 'bg-emerald-100 text-emerald-800'
      : decision?.tone === 'amber'
      ? 'bg-amber-100 text-amber-800'
      : 'bg-red-100 text-red-700';

  return (
    <div className="space-y-5">
      {/* Header — matched item */}
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-charcoal-400">
          {result.brand ?? 'Match'}
        </p>
        <h3 className="mt-1 text-lg font-extrabold tracking-tight text-charcoal-900">
          {result.name}
        </h3>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-charcoal-500">
          {result.storage && <span>{result.storage}</span>}
          {result.condition && <span>· {result.condition}</span>}
          <span>· SKU {result.sku}</span>
          {!result.inStock && (
            <span className="badge badge-amber">Out of stock</span>
          )}
        </div>
      </div>

      {/* Retail price */}
      <div className="rounded-2xl bg-white p-4 shadow-card">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-charcoal-400">
          Retail price
        </p>
        <p className="mt-1 text-3xl font-black tracking-tight text-charcoal-900">
          {formatPrice(result.retailPrice, result.currency)}
        </p>
        {result.quantity > 1 && (
          <p className="mt-1 text-xs text-charcoal-500">
            × {result.quantity} = {formatPrice(result.lineSubtotal, result.currency)}
          </p>
        )}
      </div>

      {/* Cost basis + decision (operator view only) */}
      {showCostBasis && (
        <>
          <div className="grid grid-cols-2 gap-3">
            <Stat
              label="Wholesale"
              value={formatPrice(result.wholesalePrice, result.currency)}
            />
            <Stat
              label={`Margin (${result.marginPct.toFixed(1)}%)`}
              value={formatPrice(result.margin, result.currency)}
              tone={
                result.margin > 0
                  ? 'positive'
                  : result.margin < 0
                  ? 'negative'
                  : 'neutral'
              }
            />
          </div>

          {result.appliedRule && (
            <div className="rounded-2xl border border-charcoal-100 bg-white p-3 text-xs">
              <p className="font-semibold uppercase tracking-[0.18em] text-charcoal-400">
                Applied rule
              </p>
              <p className="mt-1 font-semibold text-charcoal-800">
                {result.appliedRule.name}
              </p>
              <p className="mt-0.5 text-[11px] text-charcoal-500">
                {result.appliedRule.scope}
                {result.appliedRule.scopeValue
                  ? ` · ${result.appliedRule.scopeValue}`
                  : ''}{' '}
                · markup {result.appliedRule.markupPct}%
              </p>
            </div>
          )}

          {decision && DecisionIcon && (
            <div
              className={`flex items-start gap-3 rounded-2xl px-4 py-3 ${decisionTone}`}
            >
              <DecisionIcon size={18} className="mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-bold">{decision.label}</p>
                <p className="text-[11px] opacity-80">{decision.hint}</p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: 'positive' | 'negative' | 'neutral';
}) {
  const color =
    tone === 'positive'
      ? 'text-emerald-700'
      : tone === 'negative'
      ? 'text-red-600'
      : 'text-charcoal-900';
  return (
    <div className="rounded-2xl bg-white p-3 shadow-card">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-charcoal-400">
        {label}
      </p>
      <p className={`mt-1 text-base font-extrabold ${color}`}>{value}</p>
    </div>
  );
}
