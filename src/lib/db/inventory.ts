/**
 * Inventory queries. setInventory writes the new value AND appends to
 * InventoryHistory in one transaction so the audit log can never be
 * out of sync with the current stock.
 */
import 'server-only';
import { prisma } from '@/lib/prisma';

export type StockStatus = 'in_stock' | 'low_stock' | 'out_of_stock';

function deriveStatus(stock: number, threshold: number): StockStatus {
  if (stock <= 0) return 'out_of_stock';
  if (stock <= threshold) return 'low_stock';
  return 'in_stock';
}

export async function listInventory() {
  const rows = await prisma.product.findMany({
    where: { archivedAt: null, isActive: true },
    include: { inventory: true },
    orderBy: { name: 'asc' },
  });

  return rows.map((p) => {
    const stock = p.inventory?.stock ?? 0;
    return {
      id: p.id,
      sku: p.sku ?? p.id,
      name: p.name,
      category: p.category,
      stock,
      lowStockThreshold: p.lowStockThreshold,
      stockStatus: deriveStatus(stock, p.lowStockThreshold),
      updatedAt: (p.inventory?.updatedAt ?? p.updatedAt).toISOString(),
    };
  });
}

export async function inventorySnapshot() {
  const rows = await prisma.product.findMany({
    where: { archivedAt: null, isActive: true },
    include: { inventory: true },
  });
  const now = new Date().toISOString();
  return rows.map((p) => {
    const stock = p.inventory?.stock ?? 0;
    return {
      sku: p.sku ?? p.id,
      product_id: p.id,
      product_name: p.name,
      stock_quantity: stock,
      low_stock_threshold: p.lowStockThreshold,
      availability_status: deriveStatus(stock, p.lowStockThreshold),
      last_updated: (p.inventory?.updatedAt ?? p.updatedAt).toISOString() ?? now,
    };
  });
}

export async function getInventoryBySku(sku: string) {
  const product = await prisma.product.findFirst({
    where: {
      OR: [{ sku }, { id: sku }, { slug: sku }],
      archivedAt: null,
      isActive: true,
    },
    include: { inventory: true },
  });
  if (!product) return null;
  const stock = product.inventory?.stock ?? 0;
  return {
    sku: product.sku ?? product.id,
    product_id: product.id,
    product_name: product.name,
    stock_quantity: stock,
    low_stock_threshold: product.lowStockThreshold,
    availability_status: deriveStatus(stock, product.lowStockThreshold),
    last_updated: (product.inventory?.updatedAt ?? product.updatedAt).toISOString(),
  };
}

export class InventoryNotFoundError extends Error {}

/**
 * Set absolute stock quantity AND append history record in one transaction.
 * Returns the before/after values so callers can show a confirmation.
 */
export async function setInventory(input: {
  productId: string;
  newQuantity: number;
  changeType: 'restock' | 'adjustment' | 'correction' | 'deduction';
  note?: string | null;
  changedBy: string;
}) {
  return prisma.$transaction(async (tx) => {
    const inv = await tx.inventory.findUnique({
      where: { productId: input.productId },
      include: { product: { select: { name: true, sku: true } } },
    });
    if (!inv) throw new InventoryNotFoundError('inventory not found');

    const before = inv.stock;
    const after = input.newQuantity;

    await tx.inventory.update({
      where: { productId: input.productId },
      data: { stock: after },
    });

    await tx.inventoryHistory.create({
      data: {
        productId: input.productId,
        productName: inv.product.name,
        sku: inv.product.sku,
        changeType: input.changeType,
        quantityBefore: before,
        quantityAfter: after,
        delta: after - before,
        note: input.note ?? null,
        changedBy: input.changedBy,
      },
    });

    return { before, after, delta: after - before };
  });
}

export async function listInventoryHistory(limit = 200) {
  const rows = await prisma.inventoryHistory.findMany({
    orderBy: { createdAt: 'desc' },
    take: Math.min(Math.max(limit, 1), 1000),
  });
  return rows.map((r) => ({
    id: r.id,
    productId: r.productId,
    productName: r.productName,
    sku: r.sku ?? '',
    changeType: r.changeType,
    quantityBefore: r.quantityBefore,
    quantityAfter: r.quantityAfter,
    delta: r.delta,
    note: r.note,
    changedBy: r.changedBy ?? '',
    createdAt: r.createdAt.toISOString(),
  }));
}
