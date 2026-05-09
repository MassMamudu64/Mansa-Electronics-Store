/**
 * MIGRATION NOTE:
 * Originally written for Hostinger MySQL — kept verbatim. The script talks
 * to the database exclusively through the Prisma client, so it is provider-
 * agnostic and runs unchanged against Supabase PostgreSQL once schema.prisma
 * has `provider = "postgresql"` and DATABASE_URL points at Supabase.
 *
 * The filename ("import-json-to-mysql") is preserved to avoid breaking the
 * `db:import` script reference in package.json. It is no longer accurate;
 * treat it as "import-json-to-prisma".
 *
 * One-shot importer: copies data/products.json + data/orders.json +
 * data/inventory_changes.json into the database via Prisma.
 *
 * Run AFTER `npx prisma db push` (or `prisma migrate deploy`):
 *   node scripts/import-json-to-mysql.mjs
 *
 * Idempotent on products (skips if id already exists). Re-running is safe
 * for partial imports.
 */
import { PrismaClient } from '@prisma/client';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const DATA = path.join(ROOT, 'data');

const prisma = new PrismaClient();

async function readJson(file) {
  try {
    const raw = await fs.readFile(path.join(DATA, file), 'utf-8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    if (err.code === 'ENOENT') return [];
    throw err;
  }
}

async function importProducts() {
  const products = await readJson('products.json');
  if (products.length === 0) {
    console.log('· products.json: nothing to import');
    return;
  }

  let created = 0;
  let skipped = 0;
  for (const p of products) {
    if (!p.id || !p.name || p.price == null) continue;

    const existing = await prisma.product.findUnique({ where: { id: p.id } });
    if (existing) {
      skipped++;
      continue;
    }

    const slug =
      p.slug ??
      String(p.name)
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '')
        .replace(/-+/g, '-');

    await prisma.$transaction(async (tx) => {
      await tx.product.create({
        data: {
          id: p.id,
          slug,
          name: p.name,
          category: p.category ?? 'Accessories',
          brand: p.brand ?? null,
          sku: p.sku || null,
          description: p.description ?? null,
          bullets: Array.isArray(p.bullets) ? p.bullets : [],
          imageUrl: p.image_url ?? null,
          images: Array.isArray(p.images) ? p.images : [],
          price: Number(p.price),
          compareAtPrice: p.compare_at_price != null ? Number(p.compare_at_price) : null,
          currency: p.currency ?? 'USD',
          lowStockThreshold: Number(p.lowStockThreshold ?? 3),
          isBestSeller: Boolean(p.isBestSeller ?? p.is_best_seller),
          isActive: p.is_active !== false,
          tags: Array.isArray(p.tags) ? p.tags : [],
          compatibility: Array.isArray(p.compatibility) ? p.compatibility : [],
          archivedAt: p.archivedAt ? new Date(p.archivedAt) : null,
          createdAt: p.createdAt ? new Date(p.createdAt) : new Date(),
        },
      });

      await tx.inventory.create({
        data: { productId: p.id, stock: Number(p.stock ?? 0) },
      });
    });
    created++;
  }
  console.log(`· products: ${created} imported, ${skipped} already existed`);
}

async function importOrders() {
  const orders = await readJson('orders.json');
  if (orders.length === 0) {
    console.log('· orders.json: nothing to import');
    return;
  }

  let created = 0;
  let skipped = 0;
  for (const o of orders) {
    if (!o.id) continue;
    const existing = await prisma.order.findUnique({ where: { id: o.id } });
    if (existing) {
      skipped++;
      continue;
    }

    const items = Array.isArray(o.items) ? o.items : [];
    if (items.length === 0) continue;

    await prisma.order.create({
      data: {
        id: o.id,
        shortCode: o.shortCode ?? o.id.slice(-8),
        customerName: o.customer?.name ?? '',
        customerEmail: o.customer?.email ?? '',
        customerPhone: o.customer?.phone ?? '',
        customerAddress: o.customer?.address ?? '',
        customerNotes: o.customer?.notes ?? null,
        subtotal: Number(o.totals?.subtotal ?? 0),
        bundleDiscount: Number(o.totals?.bundleDiscount ?? 0),
        delivery: Number(o.totals?.delivery ?? 0),
        total: Number(o.totals?.total ?? 0),
        status: o.status ?? 'pending',
        createdAt: o.createdAt ? new Date(o.createdAt) : new Date(),
        items: {
          create: items.map((it) => ({
            productId: it.id,
            name: it.name,
            sku: it.sku ?? null,
            price: Number(it.price ?? 0),
            quantity: Number(it.quantity ?? 1),
          })),
        },
      },
    });
    created++;
  }
  console.log(`· orders: ${created} imported, ${skipped} already existed`);
}

async function importInventoryHistory() {
  const changes = await readJson('inventory_changes.json');
  if (changes.length === 0) {
    console.log('· inventory_changes.json: nothing to import');
    return;
  }

  let created = 0;
  for (const c of changes) {
    if (!c.productId) continue;
    await prisma.inventoryHistory.create({
      data: {
        productId: c.productId,
        productName: c.productName ?? '',
        sku: c.sku ?? null,
        changeType: c.changeType ?? 'adjustment',
        quantityBefore: Number(c.quantityBefore ?? 0),
        quantityAfter: Number(c.quantityAfter ?? 0),
        delta: Number(c.delta ?? 0),
        note: c.note ?? null,
        changedBy: c.changedBy ?? null,
        createdAt: c.createdAt ? new Date(c.createdAt) : new Date(),
      },
    });
    created++;
  }
  console.log(`· inventory_history: ${created} imported`);
}

async function main() {
  console.log('Importing JSON snapshots → MySQL …');
  await importProducts();
  await importOrders();
  await importInventoryHistory();
  console.log('Done.');
}

main()
  .catch((err) => {
    console.error('Import failed:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
