import { NextResponse } from 'next/server';
import { getProductById, saveProduct } from '@/lib/serverDb';
import { promises as fs } from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function GET(_req, { params }) {
  const product = await getProductById(params.id);
  if (!product) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ product });
}

export async function PATCH(req, { params }) {
  let patch;
  try { patch = await req.json(); } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const existing = await getProductById(params.id);
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const updated = { ...existing, ...patch, id: params.id, updatedAt: new Date().toISOString() };
  await saveProduct(updated);
  return NextResponse.json({ product: updated });
}

export async function DELETE(_req, { params }) {
  // Soft-delete by archiving
  const existing = await getProductById(params.id);
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const archived = { ...existing, archivedAt: new Date().toISOString(), is_active: false };
  await saveProduct(archived);
  return NextResponse.json({ ok: true });
}
