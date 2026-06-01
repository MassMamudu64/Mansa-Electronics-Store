/**
 * Append-only price audit. Mirrors the InventoryHistory pattern. Every
 * `Product.price` mutation MUST write a row here in the same transaction.
 */
import 'server-only';
import type { Prisma, PrismaClient } from '@prisma/client';
import { prisma } from '@/lib/prisma';

export type PriceHistorySource =
  | 'manual'
  | 'rule_apply'
  | 'bulk_import'
  | 'wholesale_sync';

export interface PriceHistoryRow {
  id: string;
  productId: string;
  oldPrice: number;
  newPrice: number;
  source: PriceHistorySource;
  ruleId: string | null;
  changedBy: string | null;
  note: string | null;
  createdAt: string;
}

type Row = Prisma.PriceHistoryGetPayload<{}>;

function serialize(r: Row): PriceHistoryRow {
  return {
    id: r.id,
    productId: r.productId,
    oldPrice: Number(r.oldPrice),
    newPrice: Number(r.newPrice),
    source: r.source as PriceHistorySource,
    ruleId: r.ruleId,
    changedBy: r.changedBy,
    note: r.note,
    createdAt: r.createdAt.toISOString(),
  };
}

/**
 * Append one row. Accepts an optional transactional client so callers can
 * include the audit insert in the same prisma.$transaction as the
 * Product.price update.
 */
export async function appendPriceHistory(
  input: {
    productId: string;
    oldPrice: number;
    newPrice: number;
    source: PriceHistorySource;
    ruleId?: string | null;
    changedBy?: string | null;
    note?: string | null;
  },
  tx?: Prisma.TransactionClient | PrismaClient,
): Promise<void> {
  const client = tx ?? prisma;
  await client.priceHistory.create({
    data: {
      productId: input.productId,
      oldPrice: input.oldPrice,
      newPrice: input.newPrice,
      source: input.source,
      ruleId: input.ruleId ?? null,
      changedBy: input.changedBy ?? null,
      note: input.note ?? null,
    },
  });
}

export async function listPriceHistory(
  opts: { productId?: string; limit?: number } = {},
): Promise<PriceHistoryRow[]> {
  const rows = await prisma.priceHistory.findMany({
    where: opts.productId ? { productId: opts.productId } : undefined,
    orderBy: { createdAt: 'desc' },
    take: Math.min(Math.max(opts.limit ?? 200, 1), 1000),
  });
  return rows.map(serialize);
}

export interface PriceHistoryDetailRow extends PriceHistoryRow {
  productName: string;
  productSku: string | null;
  ruleName: string | null;
}

/**
 * Same as listPriceHistory but joins product name/sku and rule name so the
 * admin overview table can render without a second round-trip.
 */
export async function listPriceHistoryWithDetails(
  opts: { limit?: number; sinceDays?: number } = {},
): Promise<PriceHistoryDetailRow[]> {
  const where: Prisma.PriceHistoryWhereInput = {};
  if (opts.sinceDays && opts.sinceDays > 0) {
    const since = new Date(Date.now() - opts.sinceDays * 24 * 60 * 60 * 1000);
    where.createdAt = { gte: since };
  }
  const rows = await prisma.priceHistory.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: Math.min(Math.max(opts.limit ?? 50, 1), 500),
    include: {
      product: { select: { name: true, sku: true } },
      rule: { select: { name: true } },
    },
  });
  return rows.map((r) => ({
    ...serialize(r),
    productName: r.product?.name ?? '—',
    productSku: r.product?.sku ?? null,
    ruleName: r.rule?.name ?? null,
  }));
}

export async function countPriceChangesSince(sinceDays: number): Promise<number> {
  const since = new Date(Date.now() - sinceDays * 24 * 60 * 60 * 1000);
  return prisma.priceHistory.count({ where: { createdAt: { gte: since } } });
}
