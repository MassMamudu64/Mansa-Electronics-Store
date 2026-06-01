/**
 * Pricing rules per-id endpoints — admin-only.
 *   GET    /api/pricing/rules/:id  → fetch one
 *   PATCH  /api/pricing/rules/:id  → update fields
 *   DELETE /api/pricing/rules/:id  → hard delete (rules have no foreign-key
 *                                    cascade impact: price_history.rule_id
 *                                    is ON DELETE SET NULL, price_quotes
 *                                    same — audit rows survive).
 */
import { NextResponse, type NextRequest } from 'next/server';
import { requireSameOrigin, requireSession } from '@/lib/auth/guard';
import { UpdatePricingRuleSchema } from '@/lib/validation/schemas';
import {
  deletePricingRule,
  getPricingRule,
  updatePricingRule,
} from '@/lib/db/pricingRules';
import { logAdminActivity } from '@/lib/db/adminActivity';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const auth = await requireSession();
  if (!auth.ok) return auth.res;

  try {
    const rule = await getPricingRule(params.id);
    if (!rule) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json({ rule });
  } catch (err) {
    console.error('[GET /api/pricing/rules/:id]', err);
    return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const csrf = requireSameOrigin(req);
  if (csrf) return csrf;

  const auth = await requireSession();
  if (!auth.ok) return auth.res;

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const parsed = UpdatePricingRuleSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  try {
    const rule = await updatePricingRule(params.id, {
      ...parsed.data,
      updatedBy: auth.session.sub,
    });

    await logAdminActivity({
      adminSub: auth.session.sub,
      action: 'pricing.rule.update',
      resource: 'pricing_rule',
      resourceId: params.id,
      metadata: { fields: Object.keys(parsed.data) },
      req,
    });

    return NextResponse.json({ rule });
  } catch (err) {
    if ((err as { code?: string })?.code === 'P2025') {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    console.error('[PATCH /api/pricing/rules/:id]', err);
    return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const csrf = requireSameOrigin(req);
  if (csrf) return csrf;

  const auth = await requireSession();
  if (!auth.ok) return auth.res;

  try {
    await deletePricingRule(params.id);
    await logAdminActivity({
      adminSub: auth.session.sub,
      action: 'pricing.rule.delete',
      resource: 'pricing_rule',
      resourceId: params.id,
      req,
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    if ((err as { code?: string })?.code === 'P2025') {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    console.error('[DELETE /api/pricing/rules/:id]', err);
    return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });
  }
}
