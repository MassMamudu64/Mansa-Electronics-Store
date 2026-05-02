import { storage } from '@/lib/storage';
import { newId, shortCode } from '@/lib/id';
import { useCartStore } from '@/store/cartStore';
import { cartService } from './cartService';
import { buildWhatsAppOrderUrl } from '@/lib/whatsapp';
import type {
  Order,
  OrderStatus,
  FulfillmentMethod,
  PaymentMethod,
} from '@/types/order';
import type { Customer } from '@/types/customer';
import { customerInvariants as inv } from '@/types/customer';

const KEY = 'orders';

export interface CreateOrderInput {
  customer: Customer;
  fulfillment: FulfillmentMethod;
  payment: PaymentMethod;
  notes?: string;
}

export interface CreateOrderResult {
  order: Order;
  whatsappUrl: string;
}

// True when Supabase env vars are configured. Lets the same service support
// both local-mode dev and production without changing callers.
const isSupabaseConfigured = () =>
  typeof process !== 'undefined' &&
  !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
  !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const orderService = {
  async createFromCart(input: CreateOrderInput): Promise<CreateOrderResult> {
    assertValidCustomer(input.customer);

    const items = [...useCartStore.getState().items];
    if (items.length === 0) throw new Error('Cart is empty');

    if (isSupabaseConfigured()) {
      return createViaRpc(input, items);
    }
    return createLocally(input, items);
  },

  async getById(id: string): Promise<Order | null> {
    if (isSupabaseConfigured()) return getByIdFromSupabase(id);
    const all = await storage.list<Order>(KEY);
    return all.find((o) => o.id === id) ?? null;
  },

  async getByShortCode(code: string): Promise<Order | null> {
    if (isSupabaseConfigured()) return getByShortCodeFromSupabase(code);
    const all = await storage.list<Order>(KEY);
    return all.find((o) => o.shortCode === code) ?? null;
  },

  async listAll(): Promise<Order[]> {
    if (isSupabaseConfigured()) return listAllFromSupabase();
    const all = await storage.list<Order>(KEY);
    return all.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  async updateStatus(id: string, status: OrderStatus): Promise<Order> {
    if (isSupabaseConfigured()) return updateStatusInSupabase(id, status);
    const order = await this.getById(id);
    if (!order) throw new Error(`Order ${id} not found`);
    const updated: Order = { ...order, status, updatedAt: new Date().toISOString() };
    return storage.upsert(KEY, updated);
  },

  async markWhatsAppSent(id: string): Promise<void> {
    if (isSupabaseConfigured()) return markWhatsAppSentInSupabase(id);
    const order = await this.getById(id);
    if (!order) return;
    await storage.upsert(KEY, { ...order, whatsappMessageSent: true });
  },
};

// =============================================================================
// Local-mode (localStorage)
// =============================================================================
async function createLocally(
  input: CreateOrderInput,
  items: ReturnType<typeof useCartStore.getState>['items'],
): Promise<CreateOrderResult> {
  const totals = cartService.getTotals();
  const now = new Date().toISOString();
  const order: Order = {
    id: newId('ord'),
    shortCode: shortCode(),
    customer: input.customer,
    items,
    totals,
    status: 'pending',
    fulfillment: input.fulfillment,
    payment: input.payment,
    notes: input.notes,
    whatsappMessageSent: false,
    createdAt: now,
    updatedAt: now,
  };

  await storage.upsert(KEY, order);
  cartService.clear();
  return { order, whatsappUrl: buildWhatsAppOrderUrl(order) };
}

// =============================================================================
// Supabase mode — uses the create_order RPC for atomic stock decrement
// =============================================================================
async function createViaRpc(
  input: CreateOrderInput,
  items: ReturnType<typeof useCartStore.getState>['items'],
): Promise<CreateOrderResult> {
  const { createClient } = await import('@/lib/supabase/client');
  const supabase = createClient();

  const code = shortCode();
  const { data, error } = await (supabase as any).rpc('create_order', {
    p_customer_name: input.customer.name,
    p_customer_phone: input.customer.phone,
    p_customer_address: input.customer.address,
    p_customer_city: input.customer.city,
    p_payment: input.payment,
    p_notes: input.notes ?? null,
    p_short_code: code,
    p_cart_items: items.map((i) => ({ product_id: i.productId, quantity: i.quantity })),
  });

  if (error) throw new Error(error.message || 'Could not place order');
  const result = (data as Array<{ order_id: string }> | null)?.[0];
  if (!result) throw new Error('Order RPC returned no data');

  const order = await getByIdFromSupabase(result.order_id);
  if (!order) throw new Error('Order created but not retrievable');

  cartService.clear();
  return { order, whatsappUrl: buildWhatsAppOrderUrl(order) };
}

async function getByIdFromSupabase(id: string): Promise<Order | null> {
  const { createClient } = await import('@/lib/supabase/client');
  const supabase = createClient() as any;

  const { data: o } = await supabase.from('orders').select('*').eq('id', id).single();
  if (!o) return null;

  const { data: items } = await supabase.from('order_items').select('*').eq('order_id', id);
  return rowToOrder(o, items ?? []);
}

async function getByShortCodeFromSupabase(code: string): Promise<Order | null> {
  const { createClient } = await import('@/lib/supabase/client');
  const supabase = createClient() as any;
  const { data: o } = await supabase.from('orders').select('*').eq('short_code', code).single();
  if (!o) return null;
  const { data: items } = await supabase.from('order_items').select('*').eq('order_id', o.id);
  return rowToOrder(o, items ?? []);
}

async function listAllFromSupabase(): Promise<Order[]> {
  const { createClient } = await import('@/lib/supabase/client');
  const supabase = createClient() as any;
  const { data: orders } = await supabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false });
  if (!orders?.length) return [];

  const ids = orders.map((o: any) => o.id);
  const { data: items } = await supabase.from('order_items').select('*').in('order_id', ids);
  const byOrder = new Map<string, any[]>();
  (items ?? []).forEach((it: any) => {
    const arr = byOrder.get(it.order_id) ?? [];
    arr.push(it);
    byOrder.set(it.order_id, arr);
  });
  return orders.map((o: any) => rowToOrder(o, byOrder.get(o.id) ?? []));
}

async function updateStatusInSupabase(id: string, status: OrderStatus): Promise<Order> {
  const { createClient } = await import('@/lib/supabase/client');
  const supabase = createClient() as any;
  const { error } = await supabase.from('orders').update({ status }).eq('id', id);
  if (error) throw new Error(error.message);
  const updated = await getByIdFromSupabase(id);
  if (!updated) throw new Error(`Order ${id} not found after update`);
  return updated;
}

async function markWhatsAppSentInSupabase(id: string): Promise<void> {
  const { createClient } = await import('@/lib/supabase/client');
  const supabase = createClient() as any;
  await supabase.from('orders').update({ whatsapp_sent: true }).eq('id', id);
}

// Map a Supabase row + items into the domain Order shape
// (snake_case → camelCase, snapshot fields preserved on order_items).
function rowToOrder(o: any, items: any[]): Order {
  return {
    id: o.id,
    shortCode: o.short_code,
    customer: {
      name: o.customer_name,
      phone: o.customer_phone,
      address: o.customer_address,
      city: o.customer_city,
    },
    items: items.map((it) => ({
      productId: it.product_id,
      slug: '',
      name: it.product_name,
      image: '/placeholder.svg',
      unitPrice: Number(it.price_at_sale),
      quantity: it.quantity,
    })),
    totals: {
      subtotal: Number(o.subtotal),
      bundleDiscount: Number(o.bundle_discount),
      total: Number(o.total),
      itemCount: items.reduce((n, it) => n + it.quantity, 0),
    },
    status: o.status,
    fulfillment: 'delivery',
    payment: o.payment,
    notes: o.notes ?? undefined,
    whatsappMessageSent: o.whatsapp_sent,
    createdAt: o.created_at,
    updatedAt: o.updated_at,
  };
}

function assertValidCustomer(c: Customer) {
  if (c.name.trim().length < inv.nameMin) throw new Error('Name too short');
  if (!inv.phoneRegex.test(c.phone)) throw new Error('Invalid phone number');
  if (c.city.trim().length < inv.cityMin) throw new Error('City required');
  if (c.address.trim().length < inv.addressMin) throw new Error('Address too short');
  if (c.email && !inv.emailRegex.test(c.email)) throw new Error('Invalid email');
}
