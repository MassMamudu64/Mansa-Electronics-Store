'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Database,
  Loader2,
  RefreshCw,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { formatPrice } from '@/lib/money';
import PricingTabs from '@/components/admin/PricingTabs';
import {
  SOURCE_STALE_HOURS,
  checkStaleness,
  formatAge,
  formatAgo,
} from '@/lib/pricing/staleness';

const STATUS_CONFIG = {
  ok:      { label: 'OK',      badge: 'badge-green', icon: CheckCircle2 },
  syncing: { label: 'Syncing', badge: 'badge-blue',  icon: Loader2 },
  error:   { label: 'Error',   badge: 'badge-red',   icon: AlertCircle },
  idle:    { label: 'Idle',    badge: 'badge-gray',  icon: Database },
};

const SOURCE_TONE = {
  manual:         'badge-gray',
  rule_apply:     'badge-blue',
  bulk_import:    'badge-amber',
  wholesale_sync: 'badge-green',
};

export default function PricingOverviewPage() {
  const qc = useQueryClient();

  const statusQuery = useQuery({
    queryKey: ['admin', 'pricing', 'status'],
    queryFn: () => fetch('/api/pricing/status').then((r) => r.json()),
    refetchInterval: 60_000,
  });

  const historyQuery = useQuery({
    queryKey: ['admin', 'pricing', 'history'],
    queryFn: () =>
      fetch('/api/pricing/history?limit=20').then((r) => r.json()),
  });

  const syncMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/pricing/sync', {
        method: 'POST',
        credentials: 'same-origin',
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? 'Sync failed');
      return body;
    },
    onSuccess: (summary) => {
      toast.success(
        `Synced ${summary.listings_written ?? 0} listings in ${
          summary.duration_ms ? `${Math.round(summary.duration_ms / 100) / 10}s` : '–'
        }`,
      );
      qc.invalidateQueries({ queryKey: ['admin', 'pricing'] });
    },
    onError: (err) => toast.error(err.message),
  });

  const status = statusQuery.data ?? {};
  const sources = status.sources ?? [];
  const counts = status.counts ?? {};
  const staleHours = status.staleThresholdHours ?? 24;
  const changes = historyQuery.data?.changes ?? [];

  const primarySource = sources[0]; // typically one row: WeSellCellular
  const primaryStatus = STATUS_CONFIG[primarySource?.status] ?? STATUS_CONFIG.idle;
  const StatusIcon = primaryStatus.icon;

  // Source-level freshness. The /sync cron is expected to fire every ~6h;
  // anything older is surfaced as a banner.
  const sourceStaleness = checkStaleness(
    primarySource?.lastSyncedAt,
    SOURCE_STALE_HOURS,
  );
  const showStaleBanner =
    !statusQuery.isLoading &&
    primarySource !== undefined &&
    primarySource.status !== 'syncing' &&
    (sourceStaleness.level === 'aging' || sourceStaleness.level === 'stale' ||
      sourceStaleness.level === 'unknown');

  return (
    <div className="p-6 md:p-8">
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-charcoal-900">Pricing</h1>
          <p className="mt-0.5 text-sm text-charcoal-500">
            Wholesale-driven pricing for the catalog
          </p>
        </div>
        <button
          type="button"
          onClick={() => syncMutation.mutate()}
          disabled={syncMutation.isPending}
          className="btn-primary gap-2"
        >
          {syncMutation.isPending ? (
            <>
              <Loader2 size={14} className="animate-spin" /> Syncing…
            </>
          ) : (
            <>
              <RefreshCw size={14} /> Trigger sync
            </>
          )}
        </button>
      </div>

      <PricingTabs />

      {/* Source-level stale banner */}
      {showStaleBanner && (
        <StaleBanner
          source={primarySource}
          staleness={sourceStaleness}
          onSync={() => syncMutation.mutate()}
          syncing={syncMutation.isPending}
        />
      )}

      {/* KPI cards */}
      <div className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard
          label="Last sync"
          value={formatAgo(primarySource?.lastSyncedAt)}
          sub={primarySource?.name ?? 'No sources yet'}
          alert={
            sourceStaleness.level === 'stale' ||
            sourceStaleness.level === 'unknown'
          }
          accent={
            <span className={`badge ${primaryStatus.badge} gap-1`}>
              <StatusIcon
                size={11}
                className={primarySource?.status === 'syncing' ? 'animate-spin' : ''}
              />
              {primaryStatus.label}
            </span>
          }
        />
        <KpiCard
          label="Listings"
          value={counts.total ?? 0}
          sub={`${counts.inStock ?? 0} in stock`}
        />
        <KpiCard
          label={`Stale (>${staleHours}h)`}
          value={counts.stale ?? 0}
          sub="Older than threshold"
          alert={(counts.stale ?? 0) > 0}
        />
        <KpiCard
          label="Price changes"
          value={counts.recentChanges7d ?? 0}
          sub="Last 7 days"
        />
      </div>

      {/* Source-level detail */}
      {primarySource?.lastError && (
        <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4">
          <AlertCircle size={16} className="mt-0.5 text-red-600" />
          <div>
            <p className="text-sm font-bold text-red-800">
              Last sync failed for {primarySource.name}
            </p>
            <p className="mt-0.5 break-all text-xs text-red-700">
              {primarySource.lastError}
            </p>
          </div>
        </div>
      )}

      {/* Recent price changes */}
      <div className="rounded-2xl border border-charcoal-100 bg-white shadow-card">
        <div className="flex items-center justify-between border-b border-charcoal-100 px-6 py-4">
          <h2 className="text-sm font-bold text-charcoal-900">
            Recent price changes
          </h2>
          <span className="text-xs text-charcoal-400">
            {changes.length} most recent
          </span>
        </div>
        {historyQuery.isLoading ? (
          <p className="py-12 text-center text-sm text-charcoal-400">Loading…</p>
        ) : changes.length === 0 ? (
          <p className="py-12 text-center text-sm text-charcoal-400">
            No price changes yet. Apply a pricing rule to see history here.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px]">
              <thead>
                <tr className="border-b border-charcoal-100 bg-charcoal-50">
                  <th className="table-header px-6 py-3">Product</th>
                  <th className="table-header px-6 py-3">Old</th>
                  <th className="table-header px-6 py-3">New</th>
                  <th className="table-header px-6 py-3">Δ</th>
                  <th className="table-header px-6 py-3">Source</th>
                  <th className="table-header px-6 py-3">Rule</th>
                  <th className="table-header px-6 py-3">By</th>
                  <th className="table-header px-6 py-3">When</th>
                </tr>
              </thead>
              <tbody>
                {changes.map((c) => {
                  const delta = c.newPrice - c.oldPrice;
                  const up = delta > 0;
                  const DeltaIcon = up ? TrendingUp : TrendingDown;
                  return (
                    <tr key={c.id} className="table-row">
                      <td className="table-cell px-6">
                        <p className="font-semibold text-charcoal-900">
                          {c.productName}
                        </p>
                        {c.productSku && (
                          <p className="font-mono text-[11px] text-charcoal-400">
                            {c.productSku}
                          </p>
                        )}
                      </td>
                      <td className="table-cell px-6 text-charcoal-500">
                        {formatPrice(c.oldPrice, 'USD')}
                      </td>
                      <td className="table-cell px-6 font-semibold">
                        {formatPrice(c.newPrice, 'USD')}
                      </td>
                      <td
                        className={`table-cell px-6 font-semibold ${
                          delta === 0
                            ? 'text-charcoal-400'
                            : up
                            ? 'text-emerald-700'
                            : 'text-red-600'
                        }`}
                      >
                        <span className="inline-flex items-center gap-1">
                          {delta !== 0 && <DeltaIcon size={12} />}
                          {delta > 0 ? '+' : ''}
                          {formatPrice(delta, 'USD')}
                        </span>
                      </td>
                      <td className="table-cell px-6">
                        <span
                          className={`badge ${
                            SOURCE_TONE[c.source] ?? 'badge-gray'
                          }`}
                        >
                          {c.source.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="table-cell px-6 text-charcoal-600">
                        {c.ruleName ?? '—'}
                      </td>
                      <td className="table-cell px-6 font-mono text-[11px] text-charcoal-500">
                        {c.changedBy ?? '—'}
                      </td>
                      <td className="table-cell px-6 text-xs text-charcoal-400">
                        {formatAgo(c.createdAt)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function KpiCard({ label, value, sub, accent, alert }) {
  return (
    <div className="rounded-2xl border border-charcoal-100 bg-white p-5 shadow-card">
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-medium uppercase tracking-wider text-charcoal-400">
          {label}
        </p>
        {accent}
      </div>
      <p
        className={`mt-1.5 text-2xl font-extrabold ${
          alert ? 'text-amber-600' : 'text-charcoal-900'
        }`}
      >
        {String(value)}
      </p>
      {sub && <p className="mt-0.5 text-xs text-charcoal-400">{sub}</p>}
    </div>
  );
}

/**
 * Source-level stale banner. Three visual treatments:
 *   - aging   (>3h, <6h) — amber. Soft nudge.
 *   - stale   (>6h)      — red. Pricing is provably out of date.
 *   - unknown (never)    — gray. First-run state before any sync ran.
 */
function StaleBanner({ source, staleness, onSync, syncing }) {
  const tones = {
    aging: {
      wrap:   'border-amber-200 bg-amber-50',
      icon:   'text-amber-700',
      title:  'text-amber-900',
      body:   'text-amber-800',
      btn:    'btn-primary-sm',
    },
    stale: {
      wrap:   'border-red-200 bg-red-50',
      icon:   'text-red-600',
      title:  'text-red-900',
      body:   'text-red-800',
      btn:    'btn-primary-sm',
    },
    unknown: {
      wrap:   'border-charcoal-200 bg-charcoal-50',
      icon:   'text-charcoal-600',
      title:  'text-charcoal-900',
      body:   'text-charcoal-600',
      btn:    'btn-primary-sm',
    },
  };
  const tone = tones[staleness.level] ?? tones.aging;

  const title =
    staleness.level === 'unknown'
      ? `${source?.name ?? 'Wholesale source'} has never been synced`
      : `Wholesale data is ${formatAge(staleness.ageHours)} old`;

  const body =
    staleness.level === 'unknown'
      ? 'Trigger your first sync to populate pricing data. Quotes will return 404 until then.'
      : `Threshold for staleness is ${staleness.thresholdHours} hours. Trigger a sync to refresh wholesale listings.`;

  return (
    <div className={`mb-6 flex flex-wrap items-start gap-4 rounded-2xl border p-4 ${tone.wrap}`}>
      <Clock size={18} className={`mt-0.5 flex-shrink-0 ${tone.icon}`} />
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-bold ${tone.title}`}>{title}</p>
        <p className={`mt-0.5 text-xs ${tone.body}`}>{body}</p>
      </div>
      <button
        type="button"
        onClick={onSync}
        disabled={syncing}
        className={`${tone.btn} gap-1.5 flex-shrink-0`}
      >
        {syncing ? (
          <Loader2 size={12} className="animate-spin" />
        ) : (
          <RefreshCw size={12} />
        )}
        Sync now
      </button>
    </div>
  );
}
