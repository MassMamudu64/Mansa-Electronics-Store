/**
 * Pricing rules — admin-only CRUD.
 *   GET  /api/pricing/rules   → list (active and inactive)
 *   POST /api/pricing/rules   → create
 */
import { NextResponse, type NextRequest } from 'next/server';
import { requireSameOrigin, requireSession } from '@/lib/auth/guard';
import { CreatePricingRuleSchema } from '@/lib/validation/schemas';
import {
  createPricingRule,
  listPricingRules,
} from '@/lib/db/pricingRules';
import { logAdminActivity } from '@/lib/db/adminActivity';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  const auth = await requireSession();
  if (!auth.ok) return auth.res;

  try {
    const rules = await listPricingRules();
    return NextResponse.json({ rules, count: rules.length });
  } catch (err) {
    console.error('[GET /api/pricing/rules]', err);
    return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });
  }
}

export async function POST(req: NextRequest) {
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

  const parsed = CreatePricingRuleSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  try {
    const rule = await createPricingRule({
      name: parsed.data.name,
      scope: parsed.data.scope,
      scopeValue: parsed.data.scopeValue ?? null,
      markupPct: parsed.data.markupPct,
      floorPrice: parsed.data.floorPrice ?? null,
      ceilingPrice: parsed.data.ceilingPrice ?? null,
      priority: parsed.data.priority ?? 0,
      active: parsed.data.active ?? true,
      updatedBy: auth.session.sub,
    });

    await logAdminActivity({
      adminSub: auth.session.sub,
      action: 'pricing.rule.create',
      resource: 'pricing_rule',
      resourceId: rule.id,
      metadata: {
        scope: rule.scope,
        scopeValue: rule.scopeValue,
        markupPct: rule.markupPct,
      },
      req,
    });

    return NextResponse.json({ rule }, { status: 201 });
  } catch (err) {
    console.error('[POST /api/pricing/rules]', err);
    return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });
  }
}
