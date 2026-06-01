/**
 * Pure pricing-rule evaluator. No I/O, no Prisma — given a wholesale price,
 * a list of candidate rules, and a context (sku / category / brand), it
 * picks the most-specific active rule and returns the resulting retail
 * price. Used by both the quote endpoint (read-only) and the apply endpoint
 * (writes price changes inside a transaction).
 *
 * Precedence:
 *   1. scope = 'sku'      (most specific)
 *   2. scope = 'brand'
 *   3. scope = 'category'
 *   4. scope = 'global'   (least specific)
 *
 * Among rules at the same scope, `priority` desc wins. Floor and ceiling
 * are enforced AFTER markup. Money is computed in Number (USD with 2dp
 * precision is safe up to ~$1e13).
 */

export type RuleScope = 'global' | 'category' | 'brand' | 'sku';

export interface PricingRuleLike {
  id: string;
  name: string;
  scope: RuleScope;
  scopeValue: string | null;
  markupPct: number;          // e.g. 35 means +35%
  floorPrice: number | null;
  ceilingPrice: number | null;
  priority: number;
  active: boolean;
}

export interface EvaluatorContext {
  sku?: string | null;
  category?: string | null;
  brand?: string | null;
}

export interface AppliedRuleSummary {
  id: string;
  name: string;
  scope: RuleScope;
  scopeValue: string | null;
  markupPct: number;
  floorPrice: number | null;
  ceilingPrice: number | null;
}

export interface EvaluationResult {
  wholesalePrice: number;
  retailPrice: number;
  margin: number;             // retailPrice - wholesalePrice
  marginPct: number;          // (margin / wholesalePrice) * 100, 0 if wholesale is 0
  appliedRule: AppliedRuleSummary | null;
  formula: string;            // human-readable explanation
}

const SCOPE_RANK: Record<RuleScope, number> = {
  sku: 3,
  brand: 2,
  category: 1,
  global: 0,
};

function ruleMatches(rule: PricingRuleLike, ctx: EvaluatorContext): boolean {
  if (!rule.active) return false;
  switch (rule.scope) {
    case 'global':
      return true;
    case 'sku':
      return Boolean(ctx.sku) && rule.scopeValue === ctx.sku;
    case 'brand':
      return Boolean(ctx.brand) && rule.scopeValue === ctx.brand;
    case 'category':
      return Boolean(ctx.category) && rule.scopeValue === ctx.category;
    default:
      return false;
  }
}

function pickBest(rules: readonly PricingRuleLike[]): PricingRuleLike | null {
  if (rules.length === 0) return null;
  // Sort by scope rank desc, then priority desc — stable for equal keys.
  const sorted = [...rules].sort((a, b) => {
    const rankDelta = SCOPE_RANK[b.scope] - SCOPE_RANK[a.scope];
    if (rankDelta !== 0) return rankDelta;
    return b.priority - a.priority;
  });
  return sorted[0];
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function fmt(n: number): string {
  return `$${n.toFixed(2)}`;
}

function clamp(
  raw: number,
  floor: number | null,
  ceiling: number | null,
): { value: number; floored: boolean; capped: boolean } {
  let value = raw;
  let floored = false;
  let capped = false;
  if (floor != null && value < floor) {
    value = floor;
    floored = true;
  }
  if (ceiling != null && value > ceiling) {
    value = ceiling;
    capped = true;
  }
  return { value, floored, capped };
}

export function evaluate(
  wholesalePrice: number,
  rules: readonly PricingRuleLike[],
  ctx: EvaluatorContext,
): EvaluationResult {
  if (!Number.isFinite(wholesalePrice) || wholesalePrice < 0) {
    throw new Error('wholesalePrice must be a non-negative finite number');
  }

  const candidates = rules.filter((r) => ruleMatches(r, ctx));
  const best = pickBest(candidates);

  if (!best) {
    return {
      wholesalePrice: round2(wholesalePrice),
      retailPrice: round2(wholesalePrice),
      margin: 0,
      marginPct: 0,
      appliedRule: null,
      formula: 'no matching rule — retail = wholesale',
    };
  }

  const raw = wholesalePrice * (1 + best.markupPct / 100);
  const { value: retail, floored, capped } = clamp(raw, best.floorPrice, best.ceilingPrice);
  const rounded = round2(retail);
  const margin = round2(rounded - wholesalePrice);
  const marginPct = wholesalePrice > 0 ? round2((margin / wholesalePrice) * 100) : 0;

  const parts: string[] = [
    `${fmt(wholesalePrice)} × ${(1 + best.markupPct / 100).toFixed(3)} = ${fmt(round2(raw))}`,
  ];
  if (floored) parts.push(`floor ${fmt(best.floorPrice!)} applied`);
  if (capped) parts.push(`ceiling ${fmt(best.ceilingPrice!)} applied`);
  parts.push(`final ${fmt(rounded)} via rule "${best.name}"`);

  return {
    wholesalePrice: round2(wholesalePrice),
    retailPrice: rounded,
    margin,
    marginPct,
    appliedRule: {
      id: best.id,
      name: best.name,
      scope: best.scope,
      scopeValue: best.scopeValue,
      markupPct: best.markupPct,
      floorPrice: best.floorPrice,
      ceilingPrice: best.ceilingPrice,
    },
    formula: parts.join(' · '),
  };
}
