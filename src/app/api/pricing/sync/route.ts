/**
 * POST /api/pricing/sync — trigger a wholesale-listing sync.
 *
 * Dual-auth (mirrors /api/inventory/snapshot pattern):
 *   - Admin session cookie, OR
 *   - x-api-key / Authorization: Bearer header matching WESELL_INGEST_KEY.
 *
 * Forwards to the FastAPI service via src/lib/pricing/client.ts. The FastAPI
 * service has its own bearer auth (PRICING_API_KEY) which the client wraps.
 *
 * Note on CSRF: middleware enforces same-origin on POST. External cron
 * callers must either set Origin to match the deployment host, OR the
 * sync can be triggered from inside the admin UI (which is same-origin).
 * This is documented in pricing-engine/README.md.
 */
import { NextResponse, type NextRequest } from 'next/server';
import { getSession } from '@/lib/auth/guard';
import { timingSafeEqual } from '@/lib/auth/csrf';
import { logAdminActivity } from '@/lib/db/adminActivity';
import {
  PricingClientError,
  syncWholesaleListings,
} from '@/lib/pricing/client';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

async function authorize(req: NextRequest): Promise<
  { ok: true; via: 'session' | 'api_key'; sub: string } | { ok: false }
> {
  const key = process.env.WESELL_INGEST_KEY;
  if (key && key.length >= 16) {
    const headerKey = req.headers.get('x-api-key');
    if (headerKey && timingSafeEqual(headerKey, key)) {
      return { ok: true, via: 'api_key', sub: 'cron:wesell-ingest' };
    }
    const auth = req.headers.get('authorization');
    if (auth && timingSafeEqual(auth, `Bearer ${key}`)) {
      return { ok: true, via: 'api_key', sub: 'cron:wesell-ingest' };
    }
  }
  const session = await getSession();
  if (session) return { ok: true, via: 'session', sub: session.sub };
  return { ok: false };
}

export async function POST(req: NextRequest) {
  const authz = await authorize(req);
  if (!authz.ok) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const summary = await syncWholesaleListings();

    await logAdminActivity({
      adminSub: authz.sub,
      action: 'pricing.sync',
      resource: 'wholesale_source',
      resourceId: summary.source,
      metadata: {
        via: authz.via,
        listings_seen: summary.listings_seen,
        listings_written: summary.listings_written,
        duration_ms: summary.duration_ms,
      },
      req,
    });

    return NextResponse.json(summary);
  } catch (err) {
    if (err instanceof PricingClientError) {
      const status =
        err.code === 'NOT_CONFIGURED'
          ? 503
          : err.code === 'UPSTREAM_TIMEOUT'
          ? 504
          : 502;
      return NextResponse.json(
        { error: err.publicMessage, code: err.code },
        { status },
      );
    }
    console.error('[POST /api/pricing/sync]', err);
    return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });
  }
}
