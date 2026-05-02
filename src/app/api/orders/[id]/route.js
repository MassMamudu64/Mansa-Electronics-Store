import { NextResponse } from 'next/server';
import { getOrderById, updateOrderStatus } from '@/lib/serverDb';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(_req, { params }) {
  const order = await getOrderById(params.id);
  if (!order) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ order });
}

export async function PATCH(req, { params }) {
  let body;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { status } = body;
  const VALID = ['pending', 'confirmed', 'completed', 'cancelled'];
  if (!VALID.includes(status)) {
    return NextResponse.json({ error: `Invalid status. Must be one of: ${VALID.join(', ')}` }, { status: 400 });
  }

  const updated = await updateOrderStatus(params.id, status);
  if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ order: updated });
}
