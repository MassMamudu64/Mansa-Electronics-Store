import { NextResponse, type NextRequest } from 'next/server';
import { listProducts } from '@/lib/serverDb';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function checkApiKey(req: NextRequest): boolean {
  const key = process.env.INVENTORY_API_KEY;
  if (!key) return true;
  const authHeader = req.headers.get('x-api-key') ?? req.headers.get('authorization');
  return authHeader === key || authHeader === `Bearer ${key}`;
}

export async function GET(
  req: NextRequest,
  { params }: { params: { sku: string } },
) {
  if (!checkApiKey(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { sku } = params;
  const products = await listProducts();

  const product = products.find(
    (p) => p.sku === sku || p.id === sku || p.slug === sku,
  );

  if (!product) {
    return NextResponse.json({ error: `No inventory found for SKU: ${sku}` }, { status: 404 });
  }

  const stockQty = product.stock ?? 0;
  const threshold = product.lowStockThreshold ?? 3;

  return NextResponse.json({
    sku: product.sku ?? product.id,
    product_id: product.id,
    product_name: product.name,
    stock_quantity: stockQty,
    low_stock_threshold: threshold,
    availability_status:
      stockQty <= 0 ? 'out_of_stock' : stockQty <= threshold ? 'low_stock' : 'in_stock',
    last_updated: product.updatedAt ?? product.updated_at ?? new Date().toISOString(),
  });
}
