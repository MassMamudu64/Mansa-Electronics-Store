/**
 * Server-only wrapper around the FastAPI pricing engine (`pricing-engine/`).
 * The FastAPI service only owns one endpoint right now — POST /sync — so
 * this client exposes a single function. Wholesale-listing reads and quote
 * computation happen against Prisma directly (faster, in-process, no extra
 * hop) — see src/lib/db/wholesaleListings.ts and src/lib/pricing/quote.ts.
 *
 * Secrets (PRICING_API_URL, PRICING_API_KEY) are server-side env only —
 * `import 'server-only'` is the bundler guard against accidental client imports.
 */
import 'server-only';

const SYNC_TIMEOUT_MS = 120_000; // scrape can take a while; allow 2 min

export class PricingClientError extends Error {
  constructor(
    public readonly code:
      | 'NOT_CONFIGURED'
      | 'UPSTREAM_HTTP'
      | 'UPSTREAM_NETWORK'
      | 'UPSTREAM_TIMEOUT'
      | 'UPSTREAM_INVALID_JSON',
    public readonly publicMessage: string,
    public readonly status?: number,
  ) {
    super(publicMessage);
  }
}

export interface SyncSummary {
  source: string;
  listings_seen: number;
  listings_written: number;
  started_at: string;
  finished_at: string;
  duration_ms: number;
  status: string;
}

interface ClientConfig {
  baseUrl: string;
  apiKey: string;
}

function readConfig(): ClientConfig {
  const baseUrl = (process.env.PRICING_API_URL ?? '').replace(/\/+$/, '');
  const apiKey = process.env.PRICING_API_KEY ?? '';
  if (!baseUrl || !apiKey) {
    throw new PricingClientError(
      'NOT_CONFIGURED',
      'Pricing service not configured (PRICING_API_URL / PRICING_API_KEY missing).',
    );
  }
  return { baseUrl, apiKey };
}

async function postJson<T>(path: string, timeoutMs: number): Promise<T> {
  const { baseUrl, apiKey } = readConfig();

  const ctrl = new AbortController();
  const timeout = setTimeout(() => ctrl.abort(), timeoutMs);

  let resp: Response;
  try {
    resp = await fetch(`${baseUrl}${path}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: 'application/json',
      },
      signal: ctrl.signal,
      cache: 'no-store',
    });
  } catch (err) {
    clearTimeout(timeout);
    if ((err as { name?: string })?.name === 'AbortError') {
      throw new PricingClientError(
        'UPSTREAM_TIMEOUT',
        `Pricing service timed out after ${timeoutMs}ms`,
      );
    }
    throw new PricingClientError(
      'UPSTREAM_NETWORK',
      `Could not reach pricing service: ${(err as Error).message}`,
    );
  }
  clearTimeout(timeout);

  if (!resp.ok) {
    const body = await resp.text().catch(() => '');
    throw new PricingClientError(
      'UPSTREAM_HTTP',
      `Pricing service responded ${resp.status}: ${body.slice(0, 500)}`,
      resp.status,
    );
  }

  try {
    return (await resp.json()) as T;
  } catch (err) {
    throw new PricingClientError(
      'UPSTREAM_INVALID_JSON',
      `Pricing service returned invalid JSON: ${(err as Error).message}`,
    );
  }
}

/**
 * Trigger one scrape + upsert pass on the FastAPI service. Idempotent.
 * The route handler in /api/pricing/sync is the only intended caller.
 */
export async function syncWholesaleListings(): Promise<SyncSummary> {
  return postJson<SyncSummary>('/sync', SYNC_TIMEOUT_MS);
}

/**
 * Lightweight liveness probe — used by the admin UI's "engine status" widget
 * (Phase 3). Does NOT require auth on the upstream side.
 */
export async function pingPricingEngine(): Promise<{ ok: boolean; ts: string }> {
  const { baseUrl } = readConfig();
  const ctrl = new AbortController();
  const timeout = setTimeout(() => ctrl.abort(), 5_000);
  try {
    const resp = await fetch(`${baseUrl}/health`, {
      method: 'GET',
      signal: ctrl.signal,
      cache: 'no-store',
    });
    if (!resp.ok) {
      throw new PricingClientError(
        'UPSTREAM_HTTP',
        `health check returned ${resp.status}`,
        resp.status,
      );
    }
    return (await resp.json()) as { ok: boolean; ts: string };
  } catch (err) {
    if (err instanceof PricingClientError) throw err;
    if ((err as { name?: string })?.name === 'AbortError') {
      throw new PricingClientError('UPSTREAM_TIMEOUT', 'health check timed out');
    }
    throw new PricingClientError(
      'UPSTREAM_NETWORK',
      `health check failed: ${(err as Error).message}`,
    );
  } finally {
    clearTimeout(timeout);
  }
}
