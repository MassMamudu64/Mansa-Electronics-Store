import { NextRequest } from 'next/server';
import {
  listOrders,
  createOrderTransactional,
  CheckoutError,
} from '@/lib/db/orders';
import { requireSession, requireSameOrigin } from '@/lib/auth/guard';
import { CreateOrderSchema } from '@/lib/validation/schemas';
import { sendEmail } from '@/lib/email/sendEmail';
import { renderOrderConfirmation } from '@/lib/email/templates/orderConfirmation';
import { renderAdminOrderAlert } from '@/lib/email/templates/adminOrderAlert';
import type { OrderEmailPayload } from '@/lib/email/templates/orderConfirmation';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  const auth = await requireSession();
  if (!auth.ok) return auth.res;

  try {
    const orders = await listOrders();
    return Response.json({ orders });
  } catch (err) {
    console.error('[GET /api/orders]', err);
    return Response.json({ error: 'Service unavailable' }, { status: 503 });
  }
}

export async function POST(req: NextRequest) {
  const csrf = requireSameOrigin(req);
  if (csrf) return csrf;

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return Response.json({ error: 'Invalid request' }, { status: 400 });
  }

  const parsed = CreateOrderSchema.safeParse(raw);
  if (!parsed.success) {
    return Response.json({ error: 'Invalid request' }, { status: 400 });
  }

  let order: Awaited<ReturnType<typeof createOrderTransactional>>;
  try {
    order = await createOrderTransactional({
      customer: parsed.data.customer,
      items: parsed.data.items,
    });
  } catch (err) {
    if (err instanceof CheckoutError) {
      const status =
        err.code === 'INSUFFICIENT_STOCK' || err.code === 'STOCK_RACE' ? 409 : 400;
      return Response.json({ error: err.publicMessage }, { status });
    }
    console.error('[POST /api/orders]', err);
    return Response.json({ error: 'Service unavailable' }, { status: 503 });
  }

  const emailPayload: OrderEmailPayload = {
    orderRef: order.shortCode ?? order.id,
    customerName: order.customer.name,
    customerEmail: order.customer.email,
    items: order.items.map((i) => ({
      name: i.name,
      sku: i.sku ?? null,
      price: i.price,
      quantity: i.quantity,
    })),
    subtotal: order.totals.subtotal,
    bundleDiscount: order.totals.bundleDiscount,
    delivery: order.totals.delivery,
    total: order.totals.total,
    createdAt: order.createdAt,
  };

  const buyer = renderOrderConfirmation(emailPayload);
  const admin = renderAdminOrderAlert(emailPayload);
  const adminInbox = process.env.ORDERS_INBOX;

  const [buyerResult, adminResult] = await Promise.allSettled([
    sendEmail({
      to: order.customer.email,
      subject: buyer.subject,
      html: buyer.html,
    }),
    adminInbox
      ? sendEmail({
          to: adminInbox,
          subject: admin.subject,
          html: admin.html,
          replyTo: order.customer.email,
        })
      : Promise.reject(new Error('ORDERS_INBOX is not set')),
  ]);

  if (buyerResult.status === 'rejected') {
    console.error('[Order email][buyer] Failed:', buyerResult.reason);
  }
  if (adminResult.status === 'rejected') {
    console.error('[Order email][admin] Failed:', adminResult.reason);
  }

  return Response.json({
    ok: true,
    order,
    orderId: order.id,
    orderRef: order.shortCode ?? order.id,
    total: order.totals.total,
    emailSent: {
      buyer: buyerResult.status === 'fulfilled',
      admin: adminResult.status === 'fulfilled',
    },
  });
}
