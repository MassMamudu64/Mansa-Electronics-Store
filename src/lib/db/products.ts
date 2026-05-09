/**
 * MIGRATION NOTE:
 * Hostinger MySQL implementation preserved below as comments where the
 * behavior diverges. Supabase PostgreSQL implementation now active.
 *
 * Only one query needed adjustment for the cutover: the `contains` filter
 * used by product search. MySQL's default collation (utf8mb4_unicode_ci)
 * makes `LIKE` case-insensitive by default, so the original Prisma calls
 * relied on that implicit behavior. PostgreSQL's `LIKE` is case-sensitive,
 * so we now pass `mode: 'insensitive'` explicitly — Prisma rewrites this to
 * `ILIKE` on PG. All other queries are provider-agnostic via Prisma.
 *
 * Product queries. Each call returns the JSON shape the existing client
 * expects (via serializeProduct). Inventory is always joined since the
 * storefront and admin both need stock alongside the product fields.
 */
import 'server-only';
import { prisma } from '@/lib/prisma';
import { serializeProduct } from './serialize';
import type { Prisma } from '@prisma/client';

export interface ProductListFilters {
  featured?: boolean;
  category?: string;
  q?: string;
  limit?: number;
  includeArchived?: boolean;
}

export async function listProducts(filters: ProductListFilters = {}) {
  const where: Prisma.ProductWhereInput = {};
  if (!filters.includeArchived) {
    where.archivedAt = null;
    where.isActive = true;
  }
  if (filters.featured) where.isBestSeller = true;
  if (filters.category) where.category = filters.category;
  if (filters.q) {
    // DEPRECATED — Hostinger MySQL (case-insensitive collation by default):
    // where.OR = [
    //   { name: { contains: filters.q } },
    //   { category: { contains: filters.q } },
    //   { brand: { contains: filters.q } },
    // ];
    // ACTIVE — Supabase PostgreSQL (case-sensitive LIKE; need ILIKE):
    where.OR = [
      { name: { contains: filters.q, mode: 'insensitive' } },
      { category: { contains: filters.q, mode: 'insensitive' } },
      { brand: { contains: filters.q, mode: 'insensitive' } },
    ];
  }

  const rows = await prisma.product.findMany({
    where,
    include: { inventory: true },
    orderBy: [{ isBestSeller: 'desc' }, { createdAt: 'desc' }],
    take: filters.limit && filters.limit > 0 ? Math.min(filters.limit, 200) : undefined,
  });
  return rows.map(serializeProduct);
}

export async function getProductById(id: string) {
  const row = await prisma.product.findUnique({
    where: { id },
    include: { inventory: true },
  });
  return row ? serializeProduct(row) : null;
}

export async function getProductBySlugOrSku(key: string) {
  const row = await prisma.product.findFirst({
    where: { OR: [{ id: key }, { slug: key }, { sku: key }] },
    include: { inventory: true },
  });
  return row ? serializeProduct(row) : null;
}

export interface CreateProductInput {
  id: string;
  slug: string;
  name: string;
  category?: string;
  brand?: string;
  sku?: string;
  description?: string;
  bullets?: string[];
  image_url?: string;
  images?: { url: string; alt: string }[];
  price: number;
  compare_at_price?: number | null;
  currency?: string;
  stock?: number;
  lowStockThreshold?: number;
  isBestSeller?: boolean;
  tags?: string[];
  compatibility?: string[];
}

/**
 * Create product + its inventory row in one transaction. Either both rows
 * exist or neither does.
 */
export async function createProduct(input: CreateProductInput) {
  const created = await prisma.$transaction(async (tx) => {
    const product = await tx.product.create({
      data: {
        id: input.id,
        slug: input.slug,
        name: input.name,
        category: input.category ?? 'Accessories',
        brand: input.brand ?? null,
        sku: input.sku ?? null,
        description: input.description ?? null,
        bullets: input.bullets ?? [],
        imageUrl: input.image_url ?? null,
        images: input.images ?? [],
        price: input.price,
        compareAtPrice: input.compare_at_price ?? null,
        currency: input.currency ?? 'USD',
        lowStockThreshold: input.lowStockThreshold ?? 3,
        isBestSeller: input.isBestSeller ?? false,
        tags: input.tags ?? [],
        compatibility: input.compatibility ?? [],
      },
    });

    await tx.inventory.create({
      data: { productId: product.id, stock: input.stock ?? 0 },
    });

    return tx.product.findUniqueOrThrow({
      where: { id: product.id },
      include: { inventory: true },
    });
  });

  return serializeProduct(created);
}

export interface UpdateProductInput {
  name?: string;
  category?: string;
  brand?: string;
  sku?: string;
  description?: string;
  bullets?: string[];
  image_url?: string;
  images?: { url: string; alt: string }[];
  price?: number;
  compare_at_price?: number | null;
  currency?: string;
  lowStockThreshold?: number;
  isBestSeller?: boolean;
  tags?: string[];
  compatibility?: string[];
  slug?: string;
}

export async function updateProduct(id: string, patch: UpdateProductInput) {
  const data: Prisma.ProductUpdateInput = {};
  if (patch.name !== undefined) data.name = patch.name;
  if (patch.category !== undefined) data.category = patch.category;
  if (patch.brand !== undefined) data.brand = patch.brand;
  if (patch.sku !== undefined) data.sku = patch.sku;
  if (patch.description !== undefined) data.description = patch.description;
  if (patch.bullets !== undefined) data.bullets = patch.bullets;
  if (patch.image_url !== undefined) data.imageUrl = patch.image_url;
  if (patch.images !== undefined) data.images = patch.images;
  if (patch.price !== undefined) data.price = patch.price;
  if (patch.compare_at_price !== undefined) data.compareAtPrice = patch.compare_at_price;
  if (patch.currency !== undefined) data.currency = patch.currency;
  if (patch.lowStockThreshold !== undefined) data.lowStockThreshold = patch.lowStockThreshold;
  if (patch.isBestSeller !== undefined) data.isBestSeller = patch.isBestSeller;
  if (patch.tags !== undefined) data.tags = patch.tags;
  if (patch.compatibility !== undefined) data.compatibility = patch.compatibility;
  if (patch.slug !== undefined) data.slug = patch.slug;

  const updated = await prisma.product.update({
    where: { id },
    data,
    include: { inventory: true },
  });
  return serializeProduct(updated);
}

export async function archiveProduct(id: string) {
  await prisma.product.update({
    where: { id },
    data: { archivedAt: new Date(), isActive: false },
  });
}
