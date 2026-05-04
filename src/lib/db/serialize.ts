/**
 * Convert Prisma row shapes to the JSON shape the existing client expects.
 * - Decimal → Number (safe for prices ≤ $1M)
 * - Date    → ISO string
 * - snake/camel field name mapping
 */
import 'server-only';
import type { Prisma } from '@prisma/client';

type ProductWithInventory = Prisma.ProductGetPayload<{
  include: { inventory: true };
}>;

type OrderWithItems = Prisma.OrderGetPayload<{
  include: { items: true };
}>;

export function serializeProduct(p: ProductWithInventory) {
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    category: p.category,
    brand: p.brand ?? '',
    sku: p.sku ?? '',
    description: p.description ?? '',
    bullets: (p.bullets as string[] | null) ?? [],
    image_url: p.imageUrl ?? '/placeholder.svg',
    images: (p.images as { url: string; alt: string }[] | null) ?? [],
    price: Number(p.price),
    compare_at_price: p.compareAtPrice == null ? null : Number(p.compareAtPrice),
    currency: p.currency,
    stock: p.inventory?.stock ?? 0,
    lowStockThreshold: p.lowStockThreshold,
    isBestSeller: p.isBestSeller,
    is_best_seller: p.isBestSeller,
    is_active: p.isActive,
    tags: (p.tags as string[] | null) ?? [],
    compatibility: (p.compatibility as string[] | null) ?? [],
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
    archivedAt: p.archivedAt ? p.archivedAt.toISOString() : null,
  };
}

export function serializeOrder(o: OrderWithItems) {
  return {
    id: o.id,
    shortCode: o.shortCode,
    customer: {
      name: o.customerName,
      email: o.customerEmail,
      phone: o.customerPhone,
      address: o.customerAddress,
      notes: o.customerNotes ?? '',
    },
    items: o.items.map((i) => ({
      id: i.productId,
      name: i.name,
      sku: i.sku ?? '',
      price: Number(i.price),
      quantity: i.quantity,
    })),
    totals: {
      subtotal: Number(o.subtotal),
      bundleDiscount: Number(o.bundleDiscount),
      delivery: Number(o.delivery),
      total: Number(o.total),
    },
    status: o.status,
    createdAt: o.createdAt.toISOString(),
    updatedAt: o.updatedAt.toISOString(),
  };
}
