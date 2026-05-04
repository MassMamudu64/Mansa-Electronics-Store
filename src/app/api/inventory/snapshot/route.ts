import { NextResponse, type NextRequest } from 'next/server';
import { inventorySnapshot } from '@/lib/db/inventory';
import { getSession } from '@/lib/auth/guard';
import { timingSafeEqual } from '@/lib/auth/csrf';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

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

export async function GET(req: NextRequest) {
  if (!(await authorize(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const snapshot = await inventorySnapshot();
    return NextResponse.json({
      snapshot,
      count: snapshot.length,
      generated_at: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[GET /api/inventory/snapshot]', err);
    return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });
  }
}
