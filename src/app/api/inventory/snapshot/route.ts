import { NextResponse } from 'next/server';
import { listProducts } from '@/lib/serverDb';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function checkApiKey(req: Request): boolean {
  const key = process.env.INVENTORY_API_KEY;
  if (!key) return true; // No key configured — allow in dev
  const authHeader = req.headers.get('x-api-key') ?? req.headers.get('authorization');
  return authHeader === key || authHeader === `Bearer ${key}`;
}

export async function GET(req: Request) {
  if (!checkApiKey(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const products = await listProducts();
  const now = new Date().toISOString();

  const snapshot = products.map((p) => ({
    sku: p.sku ?? p.id,
    product_id: p.id,
    product_name: p.name,
    stock_quantity: p.stock ?? 0,
    low_stock_threshold: p.lowStockThreshold ?? 3,
    availability_status:
      (p.stock ?? 0) <= 0
        ? 'out_of_stock'
        : (p.stock ?? 0) <= (p.lowStockThreshold ?? 3)
        ? 'low_stock'
        : 'in_stock',
    last_updated: p.updatedAt ?? p.updated_at ?? now,
  }));

  return NextResponse.json({
    snapshot,
    count: snapshot.length,
    generated_at: now,
  });
}
