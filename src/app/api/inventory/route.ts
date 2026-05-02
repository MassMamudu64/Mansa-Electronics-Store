import { NextResponse, type NextRequest } from 'next/server';
import { listProducts, saveProduct, getProductById } from '@/lib/serverDb';
import { promises as fs } from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const HISTORY_FILE = path.join(process.cwd(), 'data', 'inventory_changes.json');

async function readHistory() {
  try {
    const raw = await fs.readFile(HISTORY_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch { return []; }
}

async function appendHistory(entry: object) {
  const all = await readHistory();
  all.push(entry);
  await fs.mkdir(path.dirname(HISTORY_FILE), { recursive: true });
  await fs.writeFile(HISTORY_FILE, JSON.stringify(all, null, 2));
}

export async function GET() {
  const products = await listProducts();
  const items = products.map((p) => ({
    id: p.id,
    sku: p.sku ?? p.id,
    name: p.name,
    category: p.category,
    stock: p.stock ?? 0,
    lowStockThreshold: p.lowStockThreshold ?? 3,
    stockStatus:
      (p.stock ?? 0) <= 0
        ? 'out_of_stock'
        : (p.stock ?? 0) <= (p.lowStockThreshold ?? 3)
        ? 'low_stock'
        : 'in_stock',
    updatedAt: p.updatedAt ?? p.updated_at ?? new Date().toISOString(),
  }));
  return NextResponse.json({ items });
}

export async function PATCH(req: NextRequest) {
  let body: { productId: string; newQuantity: number; changeType: string; note?: string; changedBy?: string };
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { productId, newQuantity, changeType, note, changedBy } = body;
  if (!productId) return NextResponse.json({ error: 'productId required' }, { status: 400 });
  if (typeof newQuantity !== 'number' || newQuantity < 0) {
    return NextResponse.json({ error: 'newQuantity must be a non-negative number' }, { status: 400 });
  }

  const product = await getProductById(productId);
  if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 });

  const oldQty = product.stock ?? 0;
  const updated = { ...product, stock: newQuantity, updatedAt: new Date().toISOString() };
  await saveProduct(updated);

  await appendHistory({
    id: `ch_${Date.now()}`,
    productId,
    productName: product.name,
    sku: product.sku ?? productId,
    changeType: changeType ?? 'adjustment',
    quantityBefore: oldQty,
    quantityAfter: newQuantity,
    delta: newQuantity - oldQty,
    note: note ?? null,
    changedBy: changedBy ?? 'inventory-dashboard',
    createdAt: new Date().toISOString(),
  });

  return NextResponse.json({
    ok: true,
    productId,
    oldQuantity: oldQty,
    newQuantity,
    delta: newQuantity - oldQty,
  });
}
