/**
 * Bulk apply pricing rules to Products. Reads Product.costPrice as the input
 * to the evaluator, writes the resulting retail to Product.price, and emits
 * a PriceHistory row for every change — never updates without history.
 *
 * Three modes:
 *   - dryRun: compute candidates, return preview, no DB writes
 *   - apply:  do the writes in a single $transaction
 *
 * Filters allow scoping to a subset of products (by id or by rule).
 */
import 'server-only';
import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { listActivePricingRules, type PricingRuleDto } from '@/lib/db/pricingRules';
import {
  evaluate,
  type EvaluationResult,
  type PricingRuleLike,
} from '@/lib/pricing/evaluator';

export interface ApplyOptions {
  dryRun: boolean;
  productIds?: string[];
  /** Restrict the rule set to a single rule (preview the impact of one rule). */
  ruleId?: string;
  changedBy: string;
  note?: string | null;
}

export interface ApplyCandidate {
  productId: string;
  sku: string | null;
  name: string;
  costPrice: number;
  oldPrice: number;
  newPrice: number;
  delta: number;
  appliedRule: EvaluationResult['appliedRule'];
  willChange: boolean;
}

export interface ApplyResult {
  dryRun: boolean;
  productsConsidered: number;
  productsChanged: number;
  productsSkipped: number;
  candidates: ApplyCandidate[];
}

interface ProductForApply {
  id: string;
  name: string;
  sku: string | null;
  category: string;
  brand: string | null;
  price: Prisma.Decimal;
  costPrice: Prisma.Decimal | null;
}

async function loadCandidateProducts(
  productIds?: string[],
): Promise<ProductForApply[]> {
  const where: Prisma.ProductWhereInput = {
    isActive: true,
    archivedAt: null,
    costPrice: { not: null },
  };
  if (productIds && productIds.length > 0) {
    where.id = { in: productIds };
  }
  const rows = await prisma.product.findMany({
    where,
    select: {
      id: true,
      name: true,
      sku: true,
      category: true,
      brand: true,
      price: true,
      costPrice: true,
    },
    orderBy: { name: 'asc' },
  });
  return rows as ProductForApply[];
}

function asRuleLike(r: PricingRuleDto): PricingRuleLike {
  return {
    id: r.id,
    name: r.name,
    scope: r.scope,
    scopeValue: r.scopeValue,
    markupPct: r.markupPct,
    floorPrice: r.floorPrice,
    ceilingPrice: r.ceilingPrice,
    priority: r.priority,
    active: r.active,
  };
}

export async function applyPricingRules(opts: ApplyOptions): Promise<ApplyResult> {
  const allRules = await listActivePricingRules();
  const rules: PricingRuleLike[] = (opts.ruleId
    ? allRules.filter((r) => r.id === opts.ruleId)
    : allRules
  ).map(asRuleLike);

  const products = await loadCandidateProducts(opts.productIds);

  const candidates: ApplyCandidate[] = [];
  for (const p of products) {
    if (p.costPrice == null) continue;
    const cost = Number(p.costPrice);
    const oldPrice = Number(p.price);

    const result = evaluate(cost, rules, {
      sku: p.sku ?? undefined,
      category: p.category,
      brand: p.brand ?? undefined,
    });

    const newPrice = result.retailPrice;
    const willChange = result.appliedRule !== null && newPrice !== oldPrice;
    candidates.push({
      productId: p.id,
      sku: p.sku,
      name: p.name,
      costPrice: cost,
      oldPrice,
      newPrice,
      delta: Math.round((newPrice - oldPrice) * 100) / 100,
      appliedRule: result.appliedRule,
      willChange,
    });
  }

  const changes = candidates.filter((c) => c.willChange);

  if (opts.dryRun) {
    return {
      dryRun: true,
      productsConsidered: candidates.length,
      productsChanged: changes.length,
      productsSkipped: candidates.length - changes.length,
      candidates,
    };
  }

  // Commit: update prices + write history rows in one transaction.
  await prisma.$transaction(async (tx) => {
    for (const c of changes) {
      await tx.product.update({
        where: { id: c.productId },
        data: { price: c.newPrice },
      });
      await tx.priceHistory.create({
        data: {
          productId: c.productId,
          oldPrice: c.oldPrice,
          newPrice: c.newPrice,
          source: 'rule_apply',
          ruleId: c.appliedRule?.id ?? null,
          changedBy: opts.changedBy,
          note: opts.note ?? null,
        },
      });
    }
  });

  return {
    dryRun: false,
    productsConsidered: candidates.length,
    productsChanged: changes.length,
    productsSkipped: candidates.length - changes.length,
    candidates,
  };
}
