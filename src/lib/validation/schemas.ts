/**
 * Zod schemas for every request body the server accepts.
 * Used in route handlers via .safeParse() so we never trust raw JSON.
 */
import { z } from 'zod';

// ─── Auth ────────────────────────────────────────────────────────────────────
export const LoginSchema = z.object({
  id: z.string().min(1).max(64),
  password: z.string().min(1).max(256),
});
export type LoginInput = z.infer<typeof LoginSchema>;

// ─── Orders ──────────────────────────────────────────────────────────────────
export const CustomerSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(254),
  phone: z.string().trim().min(7).max(30),
  address: z.string().trim().min(5).max(500),
  notes: z.string().trim().max(1000).optional().default(''),
});

export const OrderItemSchema = z.object({
  id: z.string().min(1).max(64),
  quantity: z.number().int().min(1).max(99),
});

export const CreateOrderSchema = z.object({
  customer: CustomerSchema,
  items: z.array(OrderItemSchema).min(1).max(50),
});

export const UpdateOrderStatusSchema = z.object({
  status: z.enum(['pending', 'confirmed', 'completed', 'cancelled']),
});

// ─── Products ────────────────────────────────────────────────────────────────
const ImageSchema = z.object({
  url: z.string().trim().max(500),
  alt: z.string().trim().max(200),
});

export const CreateProductSchema = z.object({
  name: z.string().trim().min(1).max(200),
  category: z.string().trim().max(50).optional(),
  brand: z.string().trim().max(50).optional(),
  sku: z.string().trim().max(50).optional(),
  description: z.string().max(5000).optional(),
  bullets: z.array(z.string().max(200)).max(20).optional(),
  image_url: z.string().trim().max(500).optional(),
  images: z.array(ImageSchema).max(10).optional(),
  price: z.number().min(0).max(1_000_000),
  compare_at_price: z.number().min(0).max(1_000_000).nullable().optional(),
  currency: z.string().trim().length(3).optional(),
  stock: z.number().int().min(0).max(100_000).optional(),
  lowStockThreshold: z.number().int().min(0).max(1000).optional(),
  isBestSeller: z.boolean().optional(),
  tags: z.array(z.string().max(50)).max(20).optional(),
  compatibility: z.array(z.string().max(100)).max(20).optional(),
  slug: z.string().trim().max(200).optional(),
});

export const UpdateProductSchema = CreateProductSchema.partial();

// ─── Inventory ───────────────────────────────────────────────────────────────
export const UpdateInventorySchema = z.object({
  productId: z.string().min(1).max(64),
  newQuantity: z.number().int().min(0).max(100_000),
  changeType: z
    .enum(['restock', 'adjustment', 'correction', 'deduction'])
    .optional()
    .default('adjustment'),
  note: z.string().trim().max(500).optional(),
});

// ─── Pricing engine ──────────────────────────────────────────────────────────
export const QuoteRequestSchema = z
  .object({
    sku: z.string().trim().min(1).max(100).optional(),
    model: z.string().trim().min(1).max(200).optional(),
    storage: z.string().trim().max(50).optional(),
    condition: z.string().trim().max(50).optional(),
    quantity: z.number().int().min(1).max(99).optional().default(1),
  })
  .refine((d) => Boolean(d.sku || d.model), {
    message: 'Provide either sku or model',
    path: ['sku'],
  });
export type QuoteRequestInput = z.infer<typeof QuoteRequestSchema>;

const RuleScopeEnum = z.enum(['global', 'category', 'brand', 'sku']);

export const CreatePricingRuleSchema = z
  .object({
    name: z.string().trim().min(1).max(200),
    scope: RuleScopeEnum,
    scopeValue: z.string().trim().min(1).max(100).nullable().optional(),
    markupPct: z.number().min(-100).max(1000),
    floorPrice: z.number().min(0).max(1_000_000).nullable().optional(),
    ceilingPrice: z.number().min(0).max(1_000_000).nullable().optional(),
    priority: z.number().int().min(0).max(1000).optional().default(0),
    active: z.boolean().optional().default(true),
  })
  .refine(
    (d) => d.scope === 'global' || (d.scopeValue && d.scopeValue.length > 0),
    { message: 'scopeValue is required when scope is not global', path: ['scopeValue'] },
  )
  .refine(
    (d) =>
      d.floorPrice == null ||
      d.ceilingPrice == null ||
      d.floorPrice <= d.ceilingPrice,
    { message: 'floorPrice must be <= ceilingPrice', path: ['floorPrice'] },
  );

export const UpdatePricingRuleSchema = z
  .object({
    name: z.string().trim().min(1).max(200).optional(),
    scope: RuleScopeEnum.optional(),
    scopeValue: z.string().trim().min(1).max(100).nullable().optional(),
    markupPct: z.number().min(-100).max(1000).optional(),
    floorPrice: z.number().min(0).max(1_000_000).nullable().optional(),
    ceilingPrice: z.number().min(0).max(1_000_000).nullable().optional(),
    priority: z.number().int().min(0).max(1000).optional(),
    active: z.boolean().optional(),
  })
  .refine(
    (d) =>
      d.floorPrice == null ||
      d.ceilingPrice == null ||
      d.floorPrice <= d.ceilingPrice,
    { message: 'floorPrice must be <= ceilingPrice', path: ['floorPrice'] },
  );

export const ApplyPricingSchema = z.object({
  dryRun: z.boolean().optional().default(false),
  productIds: z.array(z.string().min(1).max(64)).max(500).optional(),
  ruleId: z.string().min(1).max(64).optional(),
  note: z.string().trim().max(500).optional(),
});
