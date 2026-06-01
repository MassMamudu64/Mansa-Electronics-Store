/**
 * GET /api/pricing/history — admin-only. Recent price-change audit rows
 * (joined with product name + rule name). Powers the overview table.
 *
 * Query params:
 *   - limit: 1..500, default 50
 *   - sinceDays: optional, restrict to last N days
 */
import { NextResponse, type NextRequest } from 'next/server';
import { requireSession } from '@/lib/auth/guard';
import { listPriceHistoryWithDetails } from '@/lib/db/priceHistory';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const auth = await requireSession();
  if (!auth.ok) return auth.res;

  const { searchParams } = new URL(req.url);
  const limit = Number(searchParams.get('limit') ?? '') || undefined;
  const sinceDays = Number(searchParams.get('sinceDays') ?? '') || undefined;

  try {
    const changes = await listPriceHistoryWithDetails({ limit, sinceDays });
    return NextResponse.json({ changes, count: changes.length });
  } catch (err) {
    console.error('[GET /api/pricing/history]', err);
    return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });
  }
}
