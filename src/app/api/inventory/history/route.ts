import { NextResponse } from 'next/server';
import { listInventoryHistory } from '@/lib/db/inventory';
import { requireSession } from '@/lib/auth/guard';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  const auth = await requireSession();
  if (!auth.ok) return auth.res;

  try {
    const changes = await listInventoryHistory(500);
    return NextResponse.json({ changes });
  } catch (err) {
    console.error('[GET /api/inventory/history]', err);
    return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });
  }
}
