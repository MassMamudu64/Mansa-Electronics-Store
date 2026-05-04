import { NextResponse } from 'next/server';
import { getOrderById, updateOrderStatus } from '@/lib/db/orders';
import { requireSession, requireSameOrigin } from '@/lib/auth/guard';
import { UpdateOrderStatusSchema } from '@/lib/validation/schemas';
import { logAdminActivity } from '@/lib/db/adminActivity';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// GET /api/orders/:id — admin only (PII).
export async function GET(_req, { params }) {
  const auth = await requireSession();
  if (!auth.ok) return auth.res;

  try {
    const order = await getOrderById(params.id);
    if (!order) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ order });
  } catch (err) {
    console.error('[GET /api/orders/:id]', err);
    return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });
  }
}

// PATCH /api/orders/:id — admin only.
export async function PATCH(req, { params }) {
  const csrf = requireSameOrigin(req);
  if (csrf) return csrf;

  const auth = await requireSession();
  if (!auth.ok) return auth.res;

  let raw;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const parsed = UpdateOrderStatusSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  try {
    const updated = await updateOrderStatus(params.id, parsed.data.status);
    if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    await logAdminActivity({
      adminSub: auth.session.sub,
      action: 'order.status_change',
      resource: 'order',
      resourceId: params.id,
      metadata: { status: parsed.data.status },
      req,
    });

    return NextResponse.json({ order: updated });
  } catch (err) {
    console.error('[PATCH /api/orders/:id]', err);
    return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });
  }
}
