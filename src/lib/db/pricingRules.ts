/**
 * CRUD over `pricing_rules`. Used by the admin pricing module + the public
 * quote endpoint (which reads only active rules).
 */
import 'server-only';
import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import type { PricingRuleLike, RuleScope } from '@/lib/pricing/evaluator';

type Row = Prisma.PricingRuleGetPayload<{}>;

export interface PricingRuleDto extends PricingRuleLike {
  createdAt: string;
  updatedAt: string;
  updatedBy: string | null;
}

function serialize(r: Row): PricingRuleDto {
  return {
    id: r.id,
    name: r.name,
    scope: r.scope as RuleScope,
    scopeValue: r.scopeValue,
    markupPct: Number(r.markupPct),
    floorPrice: r.floorPrice == null ? null : Number(r.floorPrice),
    ceilingPrice: r.ceilingPrice == null ? null : Number(r.ceilingPrice),
    priority: r.priority,
    active: r.active,
    updatedBy: r.updatedBy,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  };
}

export async function listPricingRules(opts: { activeOnly?: boolean } = {}): Promise<PricingRuleDto[]> {
  const where: Prisma.PricingRuleWhereInput = {};
  if (opts.activeOnly) where.active = true;
  const rows = await prisma.pricingRule.findMany({
    where,
    orderBy: [{ active: 'desc' }, { priority: 'desc' }, { updatedAt: 'desc' }],
  });
  return rows.map(serialize);
}

/**
 * Active rules only, ordered for evaluator consumption. Caller still runs
 * `evaluate(...)` which re-sorts by scope precedence.
 */
export async function listActivePricingRules(): Promise<PricingRuleDto[]> {
  return listPricingRules({ activeOnly: true });
}

export async function getPricingRule(id: string): Promise<PricingRuleDto | null> {
  const r = await prisma.pricingRule.findUnique({ where: { id } });
  return r ? serialize(r) : null;
}

export interface CreatePricingRuleInput {
  name: string;
  scope: RuleScope;
  scopeValue: string | null;
  markupPct: number;
  floorPrice: number | null;
  ceilingPrice: number | null;
  priority: number;
  active: boolean;
  updatedBy: string;
}

export async function createPricingRule(
  input: CreatePricingRuleInput,
): Promise<PricingRuleDto> {
  const created = await prisma.pricingRule.create({
    data: {
      name: input.name,
      scope: input.scope,
      scopeValue: input.scopeValue,
      markupPct: input.markupPct,
      floorPrice: input.floorPrice,
      ceilingPrice: input.ceilingPrice,
      priority: input.priority,
      active: input.active,
      updatedBy: input.updatedBy,
    },
  });
  return serialize(created);
}

export interface UpdatePricingRuleInput {
  name?: string;
  scope?: RuleScope;
  scopeValue?: string | null;
  markupPct?: number;
  floorPrice?: number | null;
  ceilingPrice?: number | null;
  priority?: number;
  active?: boolean;
  updatedBy: string;
}

export async function updatePricingRule(
  id: string,
  patch: UpdatePricingRuleInput,
): Promise<PricingRuleDto> {
  const data: Prisma.PricingRuleUpdateInput = { updatedBy: patch.updatedBy };
  if (patch.name !== undefined) data.name = patch.name;
  if (patch.scope !== undefined) data.scope = patch.scope;
  if (patch.scopeValue !== undefined) data.scopeValue = patch.scopeValue;
  if (patch.markupPct !== undefined) data.markupPct = patch.markupPct;
  if (patch.floorPrice !== undefined) data.floorPrice = patch.floorPrice;
  if (patch.ceilingPrice !== undefined) data.ceilingPrice = patch.ceilingPrice;
  if (patch.priority !== undefined) data.priority = patch.priority;
  if (patch.active !== undefined) data.active = patch.active;
  const updated = await prisma.pricingRule.update({ where: { id }, data });
  return serialize(updated);
}

export async function deletePricingRule(id: string): Promise<void> {
  await prisma.pricingRule.delete({ where: { id } });
}
