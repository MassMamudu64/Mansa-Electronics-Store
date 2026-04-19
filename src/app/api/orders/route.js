import { NextResponse } from 'next/server';
import { listProducts, deductInventory, createOrder } from '@/lib/db';
import { buildInvoicePdf } from '@/lib/pdf';
import { sendOrderEmail } from '@/lib/mailer';

export const dynamic = 'force-dynamic';
// PDFKit needs Node APIs (fs, Buffer, fonts) — force Node runtime, not Edge.
export const runtime = 'nodejs';

function validateCustomer(c) {
  const errors = [];
  if (!c || typeof c !== 'object') return ['customer is required'];
  if (!c.name || c.name.trim().length < 2) errors.push('name is too short');
  if (!c.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c.email)) errors.push('email is invalid');
  if (!c.phone || c.phone.replace(/\D/g, '').length < 7) errors.push('phone is invalid');
  if (!c.address || c.address.trim().length < 6) errors.push('address is too short');
  return errors;
}

export async function POST(req) {
  let body;
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const { customer, items } = body || {};
  const custErrors = validateCustomer(customer);
  if (custErrors.length) return NextResponse.json({ error: custErrors.join(', ') }, { status: 400 });
  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: 'Cart is empty' }, { status: 400 });
  }

  // Rebuild line items from the server-side catalog so the client can't tamper with prices.
  const catalog = await listProducts();
  const byId = new Map(catalog.map((p) => [p.id, p]));
  const lines = [];
  for (const item of items) {
    const p = byId.get(item.id);
    if (!p) return NextResponse.json({ error: `Unknown product ${item.id}` }, { status: 400 });
    const qty = Math.max(1, Number(item.quantity) || 0);
    if (qty > p.quantity) {
      return NextResponse.json({ error: `${p.model} ${p.storage} only has ${p.quantity} in stock` }, { status: 409 });
    }
    lines.push({
      id: p.id,
      model: p.model,
      storage: p.storage,
      condition: p.condition,
      price: p.price,
      quantity: qty,
    });
  }

  const subtotal = lines.reduce((s, l) => s + l.price * l.quantity, 0);
  const totals = { subtotal, total: subtotal };

  // Deduct inventory first — if this throws, nothing is persisted.
  try {
    await deductInventory(lines);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 409 });
  }

  const order = await createOrder({
    customer: {
      name: customer.name.trim(),
      email: customer.email.trim(),
      phone: customer.phone.trim(),
      address: customer.address.trim(),
    },
    items: lines,
    totals,
    status: 'pending',
  });

  // Generate invoice + notify operator. Don't fail the order if email is down —
  // the order is already recorded and inventory is deducted.
  let emailOk = true;
  let emailError = null;
  try {
    const pdf = await buildInvoicePdf(order);
    await sendOrderEmail({ order, pdfBuffer: pdf });
  } catch (err) {
    emailOk = false;
    emailError = err.message;
    console.error('Order email failed:', err);
  }

  return NextResponse.json({
    ok: true,
    orderId: order.id,
    total: order.totals.total,
    emailSent: emailOk,
    emailError,
  });
}
