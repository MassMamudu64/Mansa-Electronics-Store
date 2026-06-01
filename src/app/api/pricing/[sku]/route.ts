/**
 * GET /api/pricing/:sku — admin-only. Returns every listing matching the
 * exact upstream SKU across all sources (and history snapshots — listings
 * are time-stamped by scraped_at, so this is a chronological feed).
 */
import { NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth/guard';
import { getWholesaleListingsBySku } from '@/lib/db/wholesaleListings';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(
  _req: Request,
  { params }: { params: { sku: string } },
) {
  const auth = await requireSession();
  if (!auth.ok) return auth.res;

  const sku = (params.sku ?? '').trim().slice(0, 100);
  if (!sku) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  try {
    const items = await getWholesaleListingsBySku(sku);
    if (items.length === 0) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json({ sku, items, count: items.length });
  } catch (err) {
    console.error('[GET /api/pricing/:sku]', err);
    return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });
  }
}
