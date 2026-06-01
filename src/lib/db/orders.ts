/**
 * Order queries with full transactional safety.
 *
 * createOrderTransactional: re-prices from server catalog, verifies stock,
 * decrements inventory atomically, writes the order + items + history,
 * all in one DB transaction. Either everything succeeds or the entire
 * checkout is rolled back — no partial state.
 */
import 'server-only';
import { prisma } from '@/lib/prisma';
import { serializeOrder } from './serialize';
import { newId, shortCode } from '@/lib/id';
import { deliveryFor } from '@/lib/shipping';

export interface CustomerInput {
  name: string;
  email: string;
  phone: string;
  address: string;
  notes?: string;
}

export interface OrderItemInput {
  id: string;
  quantity: number;
}

export class CheckoutError extends Error {
  constructor(
    public readonly code:
      | 'UNAVAILABLE'
      | 'INSUFFICIENT_STOCK'
      | 'STOCK_RACE'
      | 'EMPTY_CART',
    public readonly publicMessage: string,
  ) {
    super(publicMessage);
  }
}

export async function listOrders() {
  const rows = await prisma.order.findMany({
    include: { items: true },
    orderBy: { createdAt: 'desc' },
  });
  return rows.map(serializeOrder);
}

export async function getOrderById(idOrShortCode: string) {
  const row = await prisma.order.findFirst({
    where: { OR: [{ id: idOrShortCode }, { shortCode: idOrShortCode }] },
    include: { items: true },
  });
  return row ? serializeOrder(row) : null;
}

export async function createOrderTransactional(input: {
  customer: CustomerInput;
  items: OrderItemInput[];
}) {
  if (input.items.length === 0) {
    throw new CheckoutError('EMPTY_CART', 'Cart is empty');
  }

  return prisma.$transaction(async (tx) => {
    // 1. Pull every requested product + its inventory in one query.
    const products = await tx.product.findMany({
      where: {
        id: { in: input.items.map((i) => i.id) },
        isActive: true,
        archivedAt: null,
      },
      include: { inventory: true },
    });
    const byId = new Map(products.map((p) => [p.id, p]));

    // 2. Build line items, re-pricing from the server catalog.
    interface Line {
      productId: string;
      name: string;
      sku: string | null;
      price: number;
      quantity: number;
      stockBefore: number;
    }
    const lines: Line[] = [];
    for (const item of input.items) {
      const p = byId.get(item.id);
      if (!p) {
        throw new CheckoutError('UNAVAILABLE', 'Cart contains unavailable items');
      }
      const stockBefore = p.inventory?.stock ?? 0;
      if (stockBefore < item.quantity) {
        throw new CheckoutError(
          'INSUFFICIENT_STOCK',
          `"${p.name}" only has ${stockBefore} in stock`,
        );
      }
      lines.push({
        productId: p.id,
        name: p.name,
        sku: p.sku,
        price: Number(p.price),
        quantity: item.quantity,
        stockBefore,
      });
    }

    // 3. Atomic stock deduction (updateMany with stock>=qty filter — fails
    //    if a concurrent transaction has already drained the row).
    for (const line of lines) {
      const r = await tx.inventory.updateMany({
        where: {
          productId: line.productId,
          stock: { gte: line.quantity },
        },
        data: { stock: { decrement: line.quantity } },
      });
      if (r.count !== 1) {
        throw new CheckoutError(
          'STOCK_RACE',
          'Stock changed during checkout. Please retry.',
        );
      }

      await tx.inventoryHistory.create({
        data: {
          productId: line.productId,
          productName: line.name,
          sku: line.sku,
          changeType: 'deduction',
          quantityBefore: line.stockBefore,
          quantityAfter: line.stockBefore - line.quantity,
          delta: -line.quantity,
          note: 'Order checkout',
          changedBy: 'storefront',
        },
      });
    }

    // 4. Compute totals.
    const subtotal = lines.reduce((s, l) => s + l.price * l.quantity, 0);
    const delivery = deliveryFor(subtotal);
    const total = subtotal + delivery;

    // 5. Create order + line items in one nested write.
    const created = await tx.order.create({
      data: {
        id: newId('ord'),
        shortCode: shortCode(),
        customerName: input.customer.name,
        customerEmail: input.customer.email,
        customerPhone: input.customer.phone,
        customerAddress: input.customer.address,
        customerNotes: input.customer.notes ?? null,
        subtotal,
        delivery,
        total,
        status: 'pending',
        items: {
          create: lines.map((l) => ({
            productId: l.productId,
            name: l.name,
            sku: l.sku,
            price: l.price,
            quantity: l.quantity,
          })),
        },
      },
      include: { items: true },
    });

    return serializeOrder(created);
  });
}

export async function updateOrderStatus(
  id: string,
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled',
) {
  try {
    const updated = await prisma.order.update({
      where: { id },
      data: { status },
      include: { items: true },
    });
    return serializeOrder(updated);
  } catch (err) {
    // Prisma throws P2025 when no row matches the where clause.
    if ((err as { code?: string })?.code === 'P2025') return null;
    throw err;
  }
}
