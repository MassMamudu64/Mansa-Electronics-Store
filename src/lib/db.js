// Tiny JSON-file data layer. Swap this module for Prisma/Supabase/etc. later —
// the rest of the app only talks to these functions.
import { promises as fs } from 'fs';
import path from 'path';
import crypto from 'crypto';

const DATA_DIR = path.join(process.cwd(), 'data');
const PRODUCTS_FILE = path.join(DATA_DIR, 'products.json');
const ORDERS_FILE = path.join(DATA_DIR, 'orders.json');

// Serialize writes so two concurrent requests can't clobber each other's state.
let writeQueue = Promise.resolve();
function serialize(fn) {
  const next = writeQueue.then(fn, fn);
  writeQueue = next.catch(() => {});
  return next;
}

async function readJson(file, fallback) {
  try {
    const raw = await fs.readFile(file, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    if (err.code === 'ENOENT') return fallback;
    throw err;
  }
}

async function writeJson(file, data) {
  await fs.mkdir(path.dirname(file), { recursive: true });
  const tmp = `${file}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(data, null, 2), 'utf8');
  await fs.rename(tmp, file);
}

// ---------- Products ----------

export async function listProducts() {
  return readJson(PRODUCTS_FILE, []);
}

export async function getProduct(id) {
  const products = await listProducts();
  return products.find((p) => p.id === id) || null;
}

export async function createProduct(input) {
  return serialize(async () => {
    const products = await listProducts();
    const product = {
      id: `p_${crypto.randomBytes(4).toString('hex')}`,
      category: input.category || 'iPhone',
      model: input.model,
      storage: input.storage || '-',
      condition: input.condition || 'A',
      price: Number(input.price) || 0,
      quantity: Math.max(0, Number(input.quantity) || 0),
      image: input.image || '/placeholder.svg',
    };
    products.push(product);
    await writeJson(PRODUCTS_FILE, products);
    return product;
  });
}

export async function updateProduct(id, patch) {
  return serialize(async () => {
    const products = await listProducts();
    const i = products.findIndex((p) => p.id === id);
    if (i === -1) return null;
    const updated = { ...products[i], ...patch, id };
    if (patch.price !== undefined) updated.price = Number(patch.price);
    if (patch.quantity !== undefined) updated.quantity = Math.max(0, Number(patch.quantity));
    products[i] = updated;
    await writeJson(PRODUCTS_FILE, products);
    return updated;
  });
}

export async function deleteProduct(id) {
  return serialize(async () => {
    const products = await listProducts();
    const next = products.filter((p) => p.id !== id);
    const removed = products.length !== next.length;
    if (removed) await writeJson(PRODUCTS_FILE, next);
    return removed;
  });
}

// Atomically decrement stock for every line in the order. Throws if any item
// is out of stock so the caller can reject the whole order cleanly.
export async function deductInventory(items) {
  return serialize(async () => {
    const products = await listProducts();
    const byId = new Map(products.map((p) => [p.id, p]));
    for (const line of items) {
      const p = byId.get(line.id);
      if (!p) throw new Error(`Product not found: ${line.id}`);
      if (p.quantity < line.quantity) {
        throw new Error(`Not enough stock for ${p.model} ${p.storage} (have ${p.quantity}, need ${line.quantity})`);
      }
    }
    for (const line of items) {
      const p = byId.get(line.id);
      p.quantity -= line.quantity;
    }
    await writeJson(PRODUCTS_FILE, Array.from(byId.values()));
  });
}

// ---------- Orders ----------

export async function listOrders() {
  return readJson(ORDERS_FILE, []);
}

export async function createOrder(order) {
  return serialize(async () => {
    const orders = await readJson(ORDERS_FILE, []);
    const record = {
      id: `ord_${Date.now().toString(36)}_${crypto.randomBytes(3).toString('hex')}`,
      createdAt: new Date().toISOString(),
      ...order,
    };
    orders.push(record);
    await writeJson(ORDERS_FILE, orders);
    return record;
  });
}
