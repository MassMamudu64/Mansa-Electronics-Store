/**
 * Pure staleness helpers for pricing data. No I/O — these accept a timestamp
 * and return a freshness verdict. Callers decide what to do (render a banner,
 * page on-call, etc.).
 *
 * Two distinct staleness concepts are at play and they have different
 * thresholds:
 *
 *   1. Source-level — `wholesale_source.last_synced_at`. Tells us how recently
 *      the scraper ran AT ALL. Threshold is short (6h default) because cron
 *      should be firing every few hours.
 *
 *   2. Listing-level — `wholesale_listing.scraped_at`. Tells us how recently
 *      a SPECIFIC row was refreshed. Threshold is longer (24h default)
 *      because upstream listings that disappear stop being touched and we
 *      want to flag them eventually.
 *
 * Thresholds are exported as constants so the admin UI and the API can stay
 * in sync. Override at the call site if a single page needs a tighter check.
 */

export const SOURCE_AGING_HOURS = 3;
export const SOURCE_STALE_HOURS = 6;
export const LISTING_STALE_HOURS = 24;

export type StalenessLevel = 'fresh' | 'aging' | 'stale' | 'unknown';

export interface StalenessResult {
  /** True iff age exceeds the staleness threshold (or timestamp is missing). */
  isStale: boolean;
  /** Hours since the timestamp. `Infinity` if no timestamp was given. */
  ageHours: number;
  /** Threshold used for this check (hours). */
  thresholdHours: number;
  /** Bucket for UI coloring. */
  level: StalenessLevel;
}

function toMillis(t: Date | string | null | undefined): number | null {
  if (t == null) return null;
  if (t instanceof Date) {
    const ms = t.getTime();
    return Number.isFinite(ms) ? ms : null;
  }
  const ms = new Date(t).getTime();
  return Number.isFinite(ms) ? ms : null;
}

/**
 * Verdict on a single timestamp.
 *
 * `agingThresholdHours` is optional; defaults to half of the stale threshold
 * (or `SOURCE_AGING_HOURS` if that's smaller). Callers that don't want the
 * "aging" bucket can set it equal to `thresholdHours`.
 */
export function checkStaleness(
  timestamp: Date | string | null | undefined,
  thresholdHours: number = SOURCE_STALE_HOURS,
  agingThresholdHours?: number,
): StalenessResult {
  const ts = toMillis(timestamp);
  if (ts == null) {
    return {
      isStale: true,
      ageHours: Infinity,
      thresholdHours,
      level: 'unknown',
    };
  }

  const ageHours = Math.max(0, (Date.now() - ts) / (60 * 60 * 1000));
  const aging =
    agingThresholdHours ?? Math.min(SOURCE_AGING_HOURS, thresholdHours / 2);

  let level: StalenessLevel = 'fresh';
  if (ageHours >= thresholdHours) level = 'stale';
  else if (ageHours >= aging) level = 'aging';

  return {
    isStale: ageHours >= thresholdHours,
    ageHours,
    thresholdHours,
    level,
  };
}

/**
 * Human-readable age. No "ago" suffix — callers compose copy like
 * "Wholesale data is {formatAge(h)} old".
 */
export function formatAge(hours: number): string {
  if (!Number.isFinite(hours) || hours < 0) return 'unknown';
  if (hours < 1 / 60) return 'less than a minute';
  if (hours < 1) {
    const mins = Math.round(hours * 60);
    return `${mins} minute${mins === 1 ? '' : 's'}`;
  }
  if (hours < 48) {
    const hrs = Math.round(hours);
    return `${hrs} hour${hrs === 1 ? '' : 's'}`;
  }
  const days = Math.round(hours / 24);
  return `${days} day${days === 1 ? '' : 's'}`;
}

/** Compact relative-time variant ("3h ago"). Suitable for dense table cells. */
export function formatAgo(timestamp: Date | string | null | undefined): string {
  const ts = toMillis(timestamp);
  if (ts == null) return 'never';
  const ms = Date.now() - ts;
  if (ms < 60_000) return 'just now';
  const mins = Math.floor(ms / 60_000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 48) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
