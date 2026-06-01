'use client';

import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Minus,
  Play,
  Send,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { formatPrice } from '@/lib/money';
import PricingTabs from '@/components/admin/PricingTabs';

export default function PricingApplyPage() {
  const qc = useQueryClient();
  const [ruleId, setRuleId] = useState('');
  const [note, setNote] = useState('');
  const [preview, setPreview] = useState(null); // ApplyResult | null
  const [confirmOpen, setConfirmOpen] = useState(false);

  const rulesQuery = useQuery({
    queryKey: ['admin', 'pricing', 'rules'],
    queryFn: () => fetch('/api/pricing/rules').then((r) => r.json()),
  });

  const activeRules = (rulesQuery.data?.rules ?? []).filter((r) => r.active);

  const previewMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/pricing/apply', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dryRun: true,
          ruleId: ruleId || undefined,
          note: note.trim() || undefined,
        }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? 'Preview failed');
      return body;
    },
    onSuccess: (result) => {
      setPreview(result);
      if (result.productsChanged === 0) {
        toast.message('No changes would be applied with the current settings.');
      } else {
        toast.success(
          `Preview: ${result.productsChanged} product${
            result.productsChanged === 1 ? '' : 's'
          } would change.`,
        );
      }
    },
    onError: (err) => toast.error(err.message),
  });

  const commitMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/pricing/apply', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dryRun: false,
          ruleId: ruleId || undefined,
          note: note.trim() || undefined,
        }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? 'Apply failed');
      return body;
    },
    onSuccess: (result) => {
      toast.success(
        `Applied — ${result.productsChanged} product${
          result.productsChanged === 1 ? '' : 's'
        } updated.`,
      );
      setPreview(result);
      setConfirmOpen(false);
      qc.invalidateQueries({ queryKey: ['admin', 'pricing'] });
      qc.invalidateQueries({ queryKey: ['admin', 'products'] });
    },
    onError: (err) => {
      toast.error(err.message);
      setConfirmOpen(false);
    },
  });

  const changes = useMemo(
    () => (preview?.candidates ?? []).filter((c) => c.willChange),
    [preview],
  );
  const skipped = useMemo(
    () => (preview?.candidates ?? []).filter((c) => !c.willChange),
    [preview],
  );

  const isBusy = previewMutation.isPending || commitMutation.isPending;

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-charcoal-900">Pricing</h1>
        <p className="mt-0.5 text-sm text-charcoal-500">
          Preview and apply pricing rules to the catalog
        </p>
      </div>

      <PricingTabs />

      {/* Controls */}
      <div className="mb-6 rounded-2xl border border-charcoal-100 bg-white p-5 shadow-card">
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label className="label">Rule filter</label>
            <select
              value={ruleId}
              onChange={(e) => setRuleId(e.target.value)}
              className="input"
              disabled={rulesQuery.isLoading}
            >
              <option value="">All active rules</option>
              {activeRules.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} ({r.scope}
                  {r.scopeValue ? ` · ${r.scopeValue}` : ''})
                </option>
              ))}
            </select>
            <p className="mt-1 text-[11px] text-charcoal-400">
              Restrict the evaluation to a single rule to preview its impact in isolation.
            </p>
          </div>

          <div className="md:col-span-2">
            <label className="label">Audit note (optional)</label>
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="input"
              placeholder="Reason for this bulk update — stored on every price_history row."
              maxLength={500}
            />
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => previewMutation.mutate()}
            disabled={isBusy}
            className="btn-primary gap-2"
          >
            {previewMutation.isPending ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Play size={14} />
            )}
            Preview changes
          </button>

          <button
            type="button"
            onClick={() => setConfirmOpen(true)}
            disabled={
              isBusy ||
              !preview ||
              preview.dryRun === false || // already applied — clear and re-preview to commit again
              changes.length === 0
            }
            className="btn-secondary gap-2"
          >
            <Send size={14} />
            Apply {changes.length || ''} change{changes.length === 1 ? '' : 's'}
          </button>

          {preview && !preview.dryRun && (
            <span className="ml-1 inline-flex items-center gap-1.5 self-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
              <CheckCircle2 size={12} /> Applied
            </span>
          )}
        </div>
      </div>

      {/* Summary */}
      {preview && (
        <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <SummaryCard label="Considered" value={preview.productsConsidered} />
          <SummaryCard
            label="Would change"
            value={preview.productsChanged}
            tone="green"
          />
          <SummaryCard
            label="Skipped"
            value={preview.productsSkipped}
            tone="muted"
          />
          <SummaryCard
            label="Mode"
            value={preview.dryRun ? 'Preview' : 'Applied'}
            tone={preview.dryRun ? 'blue' : 'green'}
          />
        </div>
      )}

      {/* Candidates */}
      {preview && (
        <div className="overflow-hidden rounded-2xl border border-charcoal-100 bg-white shadow-card">
          <div className="flex items-center justify-between border-b border-charcoal-100 px-6 py-4">
            <h2 className="text-sm font-bold text-charcoal-900">
              Candidates
            </h2>
            <span className="text-xs text-charcoal-400">
              {changes.length} change{changes.length === 1 ? '' : 's'} · {skipped.length} skipped
            </span>
          </div>
          {preview.candidates.length === 0 ? (
            <p className="py-12 text-center text-sm text-charcoal-400">
              No products eligible. Make sure products have <code className="rounded bg-charcoal-50 px-1 py-0.5">cost_price</code> set.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[820px]">
                <thead>
                  <tr className="border-b border-charcoal-100 bg-charcoal-50">
                    <th className="table-header px-5 py-3">Product</th>
                    <th className="table-header px-5 py-3">Cost</th>
                    <th className="table-header px-5 py-3">Old</th>
                    <th className="table-header px-5 py-3">New</th>
                    <th className="table-header px-5 py-3">Δ</th>
                    <th className="table-header px-5 py-3">Rule</th>
                    <th className="table-header px-5 py-3">Change?</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.candidates.map((c) => {
                    const Tone = c.delta > 0 ? TrendingUp : c.delta < 0 ? TrendingDown : Minus;
                    const toneColor =
                      c.delta === 0
                        ? 'text-charcoal-400'
                        : c.delta > 0
                        ? 'text-emerald-700'
                        : 'text-red-600';
                    return (
                      <tr
                        key={c.productId}
                        className={`table-row ${c.willChange ? '' : 'opacity-50'}`}
                      >
                        <td className="table-cell px-5">
                          <p className="font-semibold text-charcoal-900">
                            {c.name}
                          </p>
                          {c.sku && (
                            <p className="font-mono text-[11px] text-charcoal-400">
                              {c.sku}
                            </p>
                          )}
                        </td>
                        <td className="table-cell px-5 text-charcoal-500">
                          {formatPrice(c.costPrice, 'USD')}
                        </td>
                        <td className="table-cell px-5">
                          {formatPrice(c.oldPrice, 'USD')}
                        </td>
                        <td className="table-cell px-5 font-semibold">
                          {formatPrice(c.newPrice, 'USD')}
                        </td>
                        <td className={`table-cell px-5 font-semibold ${toneColor}`}>
                          <span className="inline-flex items-center gap-1">
                            <Tone size={12} />
                            {c.delta > 0 ? '+' : ''}
                            {formatPrice(c.delta, 'USD')}
                          </span>
                        </td>
                        <td className="table-cell px-5">
                          {c.appliedRule ? (
                            <div>
                              <p className="font-medium text-charcoal-700">
                                {c.appliedRule.name}
                              </p>
                              <p className="text-[11px] text-charcoal-400">
                                {c.appliedRule.scope}
                                {c.appliedRule.scopeValue
                                  ? ` · ${c.appliedRule.scopeValue}`
                                  : ''}{' '}
                                · {c.appliedRule.markupPct}%
                              </p>
                            </div>
                          ) : (
                            <span className="text-xs text-charcoal-400">none</span>
                          )}
                        </td>
                        <td className="table-cell px-5">
                          {c.willChange ? (
                            <span className="badge badge-green">Yes</span>
                          ) : (
                            <span className="badge badge-gray">No</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {!preview && (
        <div className="rounded-2xl border-2 border-dashed border-charcoal-200 p-12 text-center">
          <p className="text-sm text-charcoal-500">
            Click <span className="font-semibold">Preview changes</span> to see how
            current rules would reprice the catalog. Nothing is written until you
            click <span className="font-semibold">Apply</span>.
          </p>
        </div>
      )}

      {/* Confirm dialog */}
      {confirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-charcoal-950/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-charcoal-100 bg-white p-6 shadow-card-lg animate-fade-in">
            <div className="mb-4 flex items-start gap-3">
              <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-amber-50 text-amber-700">
                <AlertTriangle size={18} />
              </span>
              <div>
                <h2 className="text-base font-bold text-charcoal-900">
                  Apply {changes.length} price change
                  {changes.length === 1 ? '' : 's'}?
                </h2>
                <p className="mt-1 text-sm text-charcoal-500">
                  Every affected product will be updated and a row appended to
                  the price history. This cannot be undone in bulk.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setConfirmOpen(false)}
                disabled={commitMutation.isPending}
                className="btn-secondary-sm"
              >
                Cancel
              </button>
              <button
                onClick={() => commitMutation.mutate()}
                disabled={commitMutation.isPending}
                className="btn-primary gap-2"
              >
                {commitMutation.isPending ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Send size={14} />
                )}
                Apply changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryCard({ label, value, tone }) {
  const colors =
    tone === 'green'
      ? 'text-emerald-700'
      : tone === 'blue'
      ? 'text-charcoal-700'
      : tone === 'muted'
      ? 'text-charcoal-400'
      : 'text-charcoal-900';
  return (
    <div className="rounded-2xl border border-charcoal-100 bg-white p-5 shadow-card">
      <p className="text-xs font-medium uppercase tracking-wider text-charcoal-400">
        {label}
      </p>
      <p className={`mt-1.5 text-2xl font-extrabold ${colors}`}>{String(value)}</p>
    </div>
  );
}
