import { NextResponse, type NextRequest } from 'next/server';
import { getInventoryBySku } from '@/lib/db/inventory';
import { getSession } from '@/lib/auth/guard';
import { timingSafeEqual } from '@/lib/auth/csrf';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Public read API. Authorized via EITHER:
 *   - x-api-key / Authorization: Bearer header matching INVENTORY_API_KEY, OR
 *   - a valid admin session cookie.
 * Fail-closed: if no API key is configured, only session-bearing requests pass.
 */
async function authorize(req: NextRequest): Promise<boolean> {
  const apiKey = process.env.INVENTORY_API_KEY;
  if (apiKey && apiKey.length >= 16) {
    const headerKey = req.headers.get('x-api-key');
    if (headerKey && timingSafeEqual(headerKey, apiKey)) return true;
    const auth = req.headers.get('authorization');
    if (auth && timingSafeEqual(auth, `Bearer ${apiKey}`)) return true;
  }
  const session = await getSession();
  return Boolean(session);
}

export async function GET(
  req: NextRequest,
  { params }: { params: { sku: string } },
) {
  if (!(await authorize(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const sku = (params.sku ?? '').slice(0, 64);
  if (!sku) return NextResponse.json({ error: 'Invalid request' }, { status: 400 });

  try {
    const item = await getInventoryBySku(sku);
    if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(item);
  } catch (err) {
    console.error('[GET /api/inventory/:sku]', err);
    return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });
  }
}
