import { NextResponse } from 'next/server';
import { listProducts, createProduct } from '@/lib/db/products';
import { newId } from '@/lib/id';
import { requireSession, requireSameOrigin } from '@/lib/auth/guard';
import { CreateProductSchema } from '@/lib/validation/schemas';
import { logAdminActivity } from '@/lib/db/adminActivity';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// GET /api/products — public catalog read
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const featured = searchParams.get('featured') === 'true';
  const limitRaw = searchParams.get('limit');
  const limit = limitRaw ? Math.min(Math.max(Number(limitRaw) || 0, 0), 200) : undefined;
  const category = (searchParams.get('category') ?? '').slice(0, 50);
  const q = (searchParams.get('q') ?? '').slice(0, 100);

  try {
    const products = await listProducts({ featured, category, q, limit });
    return NextResponse.json({ products });
  } catch (err) {
    console.error('[GET /api/products]', err);
    return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });
  }
}

// POST /api/products — admin only
export async function POST(req) {
  const csrf = requireSameOrigin(req);
  if (csrf) return csrf;

  const auth = await requireSession();
  if (!auth.ok) return auth.res;

  let raw;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const parsed = CreateProductSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
  const body = parsed.data;

  const slug =
    body.slug ??
    body.name
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .replace(/-+/g, '-');

  try {
    const product = await createProduct({
      id: newId('p'),
      slug,
      name: body.name,
      category: body.category,
      brand: body.brand,
      sku: body.sku,
      description: body.description,
      bullets: body.bullets,
      image_url: body.image_url ?? '/placeholder.svg',
      images: body.images ?? [{ url: body.image_url ?? '/placeholder.svg', alt: body.name }],
      price: body.price,
      compare_at_price: body.compare_at_price ?? null,
      currency: body.currency,
      stock: body.stock,
      lowStockThreshold: body.lowStockThreshold,
      isBestSeller: body.isBestSeller,
      tags: body.tags,
      compatibility: body.compatibility,
    });

    await logAdminActivity({
      adminSub: auth.session.sub,
      action: 'product.create',
      resource: 'product',
      resourceId: product.id,
      metadata: { name: product.name, price: product.price },
      req,
    });

    return NextResponse.json({ product }, { status: 201 });
  } catch (err) {
    console.error('[POST /api/products]', err);
    if ((err && err.code === 'P2002')) {
      return NextResponse.json({ error: 'Slug or SKU already exists' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });
  }
}
