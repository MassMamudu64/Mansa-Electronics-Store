import { NextResponse } from 'next/server';
import { listProducts, saveProduct } from '@/lib/serverDb';
import { newId } from '@/lib/id';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const featured = searchParams.get('featured') === 'true';
  const limit = searchParams.get('limit') ? Number(searchParams.get('limit')) : undefined;
  const category = searchParams.get('category') ?? '';
  const q = searchParams.get('q') ?? '';

  let products = await listProducts();

  if (featured) {
    products = products.filter((p) => p.isBestSeller || p.is_best_seller);
  }
  if (category) {
    products = products.filter((p) => p.category === category);
  }
  if (q) {
    const lower = q.toLowerCase();
    products = products.filter(
      (p) =>
        p.name?.toLowerCase().includes(lower) ||
        p.category?.toLowerCase().includes(lower) ||
        p.tags?.some?.((t) => t.toLowerCase().includes(lower)),
    );
  }
  if (limit) products = products.slice(0, limit);

  return NextResponse.json({ products });
}

export async function POST(req) {
  let body;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  if (!body.name || body.price === undefined) {
    return NextResponse.json({ error: 'name and price are required' }, { status: 400 });
  }

  const now = new Date().toISOString();
  const slug =
    body.slug ??
    body.name
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .replace(/-+/g, '-');

  const product = {
    id: newId('p'),
    slug,
    name: body.name,
    category: body.category ?? 'Accessories',
    brand: body.brand ?? '',
    sku: body.sku ?? '',
    description: body.description ?? '',
    bullets: body.bullets ?? [],
    image_url: body.image_url ?? '/placeholder.svg',
    images: body.images ?? [{ url: body.image_url ?? '/placeholder.svg', alt: body.name }],
    price: Number(body.price),
    compare_at_price: body.compare_at_price ? Number(body.compare_at_price) : null,
    currency: body.currency ?? 'USD',
    stock: Number(body.stock ?? 0),
    lowStockThreshold: Number(body.lowStockThreshold ?? 3),
    isBestSeller: body.isBestSeller ?? false,
    is_active: true,
    tags: body.tags ?? [],
    compatibility: body.compatibility ?? [],
    createdAt: now,
    updatedAt: now,
  };

  await saveProduct(product);
  return NextResponse.json({ product }, { status: 201 });
}
