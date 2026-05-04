import { NextResponse, type NextRequest } from 'next/server';
import {
  listInventory,
  setInventory,
  InventoryNotFoundError,
} from '@/lib/db/inventory';
import { requireSession, requireSameOrigin } from '@/lib/auth/guard';
import { UpdateInventorySchema } from '@/lib/validation/schemas';
import { logAdminActivity } from '@/lib/db/adminActivity';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// GET /api/inventory — admin only.
export async function GET() {
  const auth = await requireSession();
  if (!auth.ok) return auth.res;

  try {
    const items = await listInventory();
    return NextResponse.json({ items });
  } catch (err) {
    console.error('[GET /api/inventory]', err);
    return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });
  }
}

// PATCH /api/inventory — admin only. Atomic stock + audit log update.
export async function PATCH(req: NextRequest) {
  const csrf = requireSameOrigin(req);
  if (csrf) return csrf;

  const auth = await requireSession();
  if (!auth.ok) return auth.res;

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const parsed = UpdateInventorySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  try {
    const result = await setInventory({
      productId: parsed.data.productId,
      newQuantity: parsed.data.newQuantity,
      changeType: parsed.data.changeType,
      note: parsed.data.note ?? null,
      changedBy: auth.session.sub,
    });

    await logAdminActivity({
      adminSub: auth.session.sub,
      action: 'inventory.update',
      resource: 'product',
      resourceId: parsed.data.productId,
      metadata: {
        before: result.before,
        after: result.after,
        delta: result.delta,
        changeType: parsed.data.changeType,
      },
      req,
    });

    return NextResponse.json({
      ok: true,
      productId: parsed.data.productId,
      oldQuantity: result.before,
      newQuantity: result.after,
      delta: result.delta,
    });
  } catch (err) {
    if (err instanceof InventoryNotFoundError) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    console.error('[PATCH /api/inventory]', err);
    return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });
  }
}
