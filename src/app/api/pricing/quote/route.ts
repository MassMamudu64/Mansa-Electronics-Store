/**
 * POST /api/pricing/quote — operator-facing pricing tool.
 *
 * Returns the FULL quote shape including wholesalePrice, margin, marginPct,
 * and the applied rule. This is consumed by:
 *   - the /price-check page (operator view) — Phase 4
 *   - any future embeddable <PriceCheckCard publicView /> on the storefront,
 *     which should hide the cost-basis fields client-side.
 *
 * SECURITY NOTE: cost-basis (wholesalePrice + margin) leaves the server in
 * this response. The route is reachable without an admin session — only
 * same-origin CSRF protects it. If /price-check is exposed to the open
 * internet, scraping the JSON reveals margins. Before production, gate
 * either this endpoint or the page behind a soft auth (admin session, a
 * shared token, or an internal-only subdomain).
 *
 * CSRF is enforced by middleware's same-origin check. Rate-limit hook is
 * in place — wire to Upstash/Redis when the storefront goes live. The in-
 * memory limiter in src/lib/auth/rateLimit.ts is single-instance only and
 * intentionally not used here.
 */
import { NextResponse, type NextRequest } from 'next/server';
import { requireSameOrigin } from '@/lib/auth/guard';
import { QuoteRequestSchema } from '@/lib/validation/schemas';
import { generateQuote, QuoteError } from '@/lib/pricing/quote';
import { clientIp } from '@/lib/auth/rateLimit';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const csrf = requireSameOrigin(req);
  if (csrf) return csrf;

  // TODO(phase 5 hardening): per-IP rate limit on quotes. Use a Redis-backed
  // counter; the existing in-memory limiter is sized for login failures and
  // would not survive multi-instance deploys.

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const parsed = QuoteRequestSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  try {
    const quote = await generateQuote(parsed.data, {
      ipAddress: clientIp(req),
      userAgent: req.headers.get('user-agent'),
    });
    // Full operator-facing payload. See SECURITY NOTE at the top of this file.
    return NextResponse.json(quote);
  } catch (err) {
    if (err instanceof QuoteError) {
      const status = err.code === 'NO_MATCH' ? 404 : 400;
      return NextResponse.json({ error: err.publicMessage }, { status });
    }
    console.error('[POST /api/pricing/quote]', err);
    return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });
  }
}
