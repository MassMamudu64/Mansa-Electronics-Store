import { NextResponse } from 'next/server';
import { listProducts, deductStock, createOrder } from '@/lib/serverDb';
import { sendOrderEmail } from '@/lib/mailer';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function validateCustomer(c) {
  const errors = [];
  if (!c || typeof c !== 'object') return ['customer object is required'];
  if (!c.name?.trim() || c.name.trim().length < 2) errors.push('Full name is required');
  if (!c.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c.email)) errors.push('Valid email is required');
  if (!c.phone || c.phone.replace(/\D/g, '').length < 7) errors.push('Valid phone number is required');
  if (!c.address?.trim() || c.address.trim().length < 5) errors.push('Delivery address is required');
  return errors;
}

export async function GET() {
  // Admin route to list orders
  const { listOrders } = await import('@/lib/serverDb');
  const orders = await listOrders();
  return NextResponse.json({ orders });
}

export async function POST(req) {
  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { customer, items } = body ?? {};

  const custErrors = validateCustomer(customer);
  if (custErrors.length) {
    return NextResponse.json({ error: custErrors.join(', ') }, { status: 400 });
  }
  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: 'Cart is empty' }, { status: 400 });
  }

  // Re-price from server catalog — client prices are untrusted
  const catalog = await listProducts();
  const byId = new Map(catalog.map((p) => [p.id, p]));

  const lines = [];
  for (const item of items) {
    const p = byId.get(item.id);
    if (!p) {
      return NextResponse.json({ error: `Unknown product ${item.id}` }, { status: 400 });
    }
    const qty = Math.max(1, Math.floor(Number(item.quantity) || 1));
    if ((p.stock ?? 0) < qty) {
      return NextResponse.json(
        { error: `"${p.name}" only has ${p.stock ?? 0} in stock` },
        { status: 409 },
      );
    }
    lines.push({
      id: p.id,
      name: p.name,
      sku: p.sku ?? p.id,
      price: p.price ?? p.selling_price ?? 0,
      quantity: qty,
    });
  }

  const subtotal = lines.reduce((s, l) => s + l.price * l.quantity, 0);
  const delivery = subtotal >= 50 ? 0 : 5;
  const total = subtotal + delivery;
  const totals = { subtotal, bundleDiscount: 0, delivery, total };

  // Deduct inventory atomically before creating the order
  try {
    await deductStock(lines);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 409 });
  }

  const order = await createOrder({
    customer: {
      name: customer.name.trim(),
      email: customer.email.trim(),
      phone: customer.phone.trim(),
      address: customer.address.trim(),
      notes: customer.notes?.trim() ?? '',
    },
    items: lines,
    totals,
    status: 'pending',
  });

  // Send email — order is already saved even if email fails
  let emailSent = true;
  let emailError = null;
  try {
    await sendOrderEmail({ order: { ...order, totals } });
  } catch (err) {
    emailSent = false;
    emailError = err.message;
    console.error('[Order email] Failed:', err.message);
  }

  return NextResponse.json({
    ok: true,
    orderId: order.id,
    orderRef: order.shortCode ?? order.id,
    total: totals.total,
    emailSent,
    ...(emailError ? { emailNote: 'Email delivery failed but your order is saved.' } : {}),
  });
}
