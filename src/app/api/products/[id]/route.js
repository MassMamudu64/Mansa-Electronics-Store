import { NextResponse } from 'next/server';
import {
  getProductById,
  getProductBySlugOrSku,
  updateProduct,
  archiveProduct,
} from '@/lib/db/products';
import { requireSession, requireSameOrigin } from '@/lib/auth/guard';
import { UpdateProductSchema } from '@/lib/validation/schemas';
import { logAdminActivity } from '@/lib/db/adminActivity';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// GET /api/products/:key — public. `key` may be id, slug, or sku.
export async function GET(_req, { params }) {
  const key = (params?.id ?? '').trim().slice(0, 100);
  if (!key) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  try {
    const product = await getProductBySlugOrSku(key);
    if (!product || product.archivedAt || product.is_active === false) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json({ product });
  } catch (err) {
    console.error('[GET /api/products/:key]', err);
    return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });
  }
}

// PATCH /api/products/:id — admin only
export async function PATCH(req, { params }) {
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

  const parsed = UpdateProductSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  try {
    const product = await updateProduct(params.id, parsed.data);

    await logAdminActivity({
      adminSub: auth.session.sub,
      action: 'product.update',
      resource: 'product',
      resourceId: params.id,
      metadata: { fields: Object.keys(parsed.data) },
      req,
    });

    return NextResponse.json({ product });
  } catch (err) {
    if (err?.code === 'P2025') {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    if (err?.code === 'P2002') {
      return NextResponse.json({ error: 'Slug or SKU already exists' }, { status: 409 });
    }
    console.error('[PATCH /api/products/:id]', err);
    return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });
  }
}

// DELETE /api/products/:id — soft archive, admin only
export async function DELETE(req, { params }) {
  const csrf = requireSameOrigin(req);
  if (csrf) return csrf;

  const auth = await requireSession();
  if (!auth.ok) return auth.res;

  try {
    await archiveProduct(params.id);

    await logAdminActivity({
      adminSub: auth.session.sub,
      action: 'product.archive',
      resource: 'product',
      resourceId: params.id,
      req,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err?.code === 'P2025') {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    console.error('[DELETE /api/products/:id]', err);
    return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });
  }
}
