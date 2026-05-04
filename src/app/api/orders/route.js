import { NextResponse } from 'next/server';
import {
  listOrders,
  createOrderTransactional,
  CheckoutError,
} from '@/lib/db/orders';
import { sendOrderEmail } from '@/lib/mailer';
import { requireSession, requireSameOrigin } from '@/lib/auth/guard';
import { CreateOrderSchema } from '@/lib/validation/schemas';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// GET /api/orders — admin only (PII). Middleware blocks anon; double-checked here.
export async function GET() {
  const auth = await requireSession();
  if (!auth.ok) return auth.res;

  try {
    const orders = await listOrders();
    return NextResponse.json({ orders });
  } catch (err) {
    console.error('[GET /api/orders]', err);
    return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });
  }
}

// POST /api/orders — public checkout. CSRF-checked at middleware; validated here.
export async function POST(req) {
  const csrf = requireSameOrigin(req);
  if (csrf) return csrf;

  let raw;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const parsed = CreateOrderSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  let order;
  try {
    order = await createOrderTransactional({
      customer: parsed.data.customer,
      items: parsed.data.items,
    });
  } catch (err) {
    if (err instanceof CheckoutError) {
      const status =
        err.code === 'INSUFFICIENT_STOCK' || err.code === 'STOCK_RACE' ? 409 : 400;
      return NextResponse.json({ error: err.publicMessage }, { status });
    }
    console.error('[POST /api/orders]', err);
    return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });
  }

  let emailSent = true;
  try {
    await sendOrderEmail({ order });
  } catch (err) {
    emailSent = false;
    console.error('[Order email] Failed:', err?.message ?? err);
  }

  return NextResponse.json({
    ok: true,
    orderId: order.id,
    orderRef: order.shortCode ?? order.id,
    total: order.totals.total,
    emailSent,
  });
}
