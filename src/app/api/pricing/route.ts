/**
 * GET /api/pricing — admin-only list of wholesale listings.
 *
 * Exposes the cost basis of the catalog → must NOT be public.
 * Filters via URL search params: sku, brand, model, condition, storage,
 * inStock, limit, offset.
 */
import { NextResponse, type NextRequest } from 'next/server';
import { requireSession } from '@/lib/auth/guard';
import { listWholesaleListings } from '@/lib/db/wholesaleListings';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const auth = await requireSession();
  if (!auth.ok) return auth.res;

  const { searchParams } = new URL(req.url);
  const limit = Number(searchParams.get('limit') ?? '') || undefined;
  const offset = Number(searchParams.get('offset') ?? '') || undefined;

  try {
    const items = await listWholesaleListings({
      sku: searchParams.get('sku')?.slice(0, 100) || undefined,
      brand: searchParams.get('brand')?.slice(0, 100) || undefined,
      model: searchParams.get('model')?.slice(0, 200) || undefined,
      condition: searchParams.get('condition')?.slice(0, 50) || undefined,
      storage: searchParams.get('storage')?.slice(0, 50) || undefined,
      inStockOnly: searchParams.get('inStock') === 'true',
      limit,
      offset,
    });
    return NextResponse.json({ items, count: items.length });
  } catch (err) {
    console.error('[GET /api/pricing]', err);
    return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });
  }
}
