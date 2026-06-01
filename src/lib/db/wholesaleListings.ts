/**
 * Read-only access to `wholesale_listings`. Writes happen in the FastAPI
 * pricing engine; from Next.js this table is only ever read (to power the
 * admin pricing pages and the public quote endpoint).
 */
import 'server-only';
import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';

export interface WholesaleListingFilters {
  sku?: string;
  brand?: string;
  model?: string;       // partial, case-insensitive
  condition?: string;
  storage?: string;
  inStockOnly?: boolean;
  limit?: number;
  offset?: number;
}

export interface WholesaleListingRow {
  id: string;
  sourceId: string;
  externalId: string | null;
  sku: string;
  name: string;
  brand: string | null;
  model: string | null;
  condition: string | null;
  storage: string | null;
  color: string | null;
  carrier: string | null;
  wholesalePrice: number;
  currency: string;
  inStock: boolean;
  stockQuantity: number | null;
  sourceUrl: string | null;
  scrapedAt: string;
}

type Row = Prisma.WholesaleListingGetPayload<{}>;

function serialize(r: Row): WholesaleListingRow {
  return {
    id: r.id,
    sourceId: r.sourceId,
    externalId: r.externalId,
    sku: r.sku,
    name: r.name,
    brand: r.brand,
    model: r.model,
    condition: r.condition,
    storage: r.storage,
    color: r.color,
    carrier: r.carrier,
    wholesalePrice: Number(r.wholesalePrice),
    currency: r.currency,
    inStock: r.inStock,
    stockQuantity: r.stockQuantity,
    sourceUrl: r.sourceUrl,
    scrapedAt: r.scrapedAt.toISOString(),
  };
}

export async function listWholesaleListings(
  f: WholesaleListingFilters = {},
): Promise<WholesaleListingRow[]> {
  const where: Prisma.WholesaleListingWhereInput = {};
  if (f.sku) where.sku = f.sku;
  if (f.brand) where.brand = f.brand;
  if (f.condition) where.condition = f.condition;
  if (f.storage) where.storage = f.storage;
  if (f.inStockOnly) where.inStock = true;
  if (f.model) where.model = { contains: f.model, mode: 'insensitive' };

  const rows = await prisma.wholesaleListing.findMany({
    where,
    orderBy: [{ scrapedAt: 'desc' }, { wholesalePrice: 'asc' }],
    take: f.limit && f.limit > 0 ? Math.min(f.limit, 500) : 200,
    skip: f.offset && f.offset > 0 ? f.offset : 0,
  });
  return rows.map(serialize);
}

export async function getWholesaleListingsBySku(
  sku: string,
): Promise<WholesaleListingRow[]> {
  const rows = await prisma.wholesaleListing.findMany({
    where: { sku },
    orderBy: { scrapedAt: 'desc' },
  });
  return rows.map(serialize);
}

/**
 * Pick the best listing for a quote: prefer in-stock, then most-recently
 * scraped. Filters narrow the candidate set; the function may return null
 * if nothing matches.
 */
export async function findBestListingForQuote(opts: {
  sku?: string;
  model?: string;
  storage?: string;
  condition?: string;
}): Promise<WholesaleListingRow | null> {
  const where: Prisma.WholesaleListingWhereInput = {};
  if (opts.sku) {
    where.sku = opts.sku;
  } else if (opts.model) {
    where.OR = [
      { name: { contains: opts.model, mode: 'insensitive' } },
      { model: { contains: opts.model, mode: 'insensitive' } },
    ];
  } else {
    return null;
  }
  if (opts.storage) where.storage = opts.storage;
  if (opts.condition) where.condition = opts.condition;

  // Try in-stock first.
  const inStock = await prisma.wholesaleListing.findFirst({
    where: { ...where, inStock: true },
    orderBy: { scrapedAt: 'desc' },
  });
  if (inStock) return serialize(inStock);

  const any = await prisma.wholesaleListing.findFirst({
    where,
    orderBy: { scrapedAt: 'desc' },
  });
  return any ? serialize(any) : null;
}
