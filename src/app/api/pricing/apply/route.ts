/**
 * POST /api/pricing/apply — admin-only. Bulk apply pricing rules to Products.
 *
 * Body (Zod-validated):
 *   { dryRun?, productIds?, ruleId?, note? }
 *
 * If dryRun is true (default in body), returns a preview list of candidates
 * with old/new prices but no DB writes. Otherwise runs a single
 * prisma.$transaction that updates Product.price and inserts a PriceHistory
 * row for every change — never updates without history.
 *
 * Mirrors the transactional safety of orders / inventory.
 */
import { NextResponse, type NextRequest } from 'next/server';
import { requireSameOrigin, requireSession } from '@/lib/auth/guard';
import { ApplyPricingSchema } from '@/lib/validation/schemas';
import { applyPricingRules } from '@/lib/pricing/apply';
import { logAdminActivity } from '@/lib/db/adminActivity';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

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

  const parsed = ApplyPricingSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  try {
    const result = await applyPricingRules({
      dryRun: parsed.data.dryRun ?? false,
      productIds: parsed.data.productIds,
      ruleId: parsed.data.ruleId,
      note: parsed.data.note ?? null,
      changedBy: auth.session.sub,
    });

    // Only log audit on committed runs, not previews.
    if (!result.dryRun) {
      await logAdminActivity({
        adminSub: auth.session.sub,
        action: 'pricing.apply',
        resource: 'pricing_rule',
        resourceId: parsed.data.ruleId ?? null,
        metadata: {
          productsConsidered: result.productsConsidered,
          productsChanged: result.productsChanged,
          productsSkipped: result.productsSkipped,
          productIdFilterSize: parsed.data.productIds?.length ?? null,
        },
        req,
      });
    }

    return NextResponse.json(result);
  } catch (err) {
    console.error('[POST /api/pricing/apply]', err);
    return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });
  }
}
