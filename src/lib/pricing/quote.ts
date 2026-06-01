/**
 * Quote orchestration: find a wholesale listing, evaluate active rules, log
 * the resulting quote to `price_quotes`, and return the public-facing shape.
 *
 * This is called by the public POST /api/pricing/quote endpoint and (later)
 * by the admin pricing preview UI in Phase 3.
 */
import 'server-only';
import { prisma } from '@/lib/prisma';
import { findBestListingForQuote } from '@/lib/db/wholesaleListings';
import { listActivePricingRules } from '@/lib/db/pricingRules';
import { evaluate, type EvaluationResult } from '@/lib/pricing/evaluator';

export class QuoteError extends Error {
  constructor(
    public readonly code: 'NO_MATCH' | 'BAD_INPUT',
    public readonly publicMessage: string,
  ) {
    super(publicMessage);
  }
}

export interface QuoteRequest {
  sku?: string;
  model?: string;
  storage?: string;
  condition?: string;
  quantity: number;
}

export interface QuoteResponse {
  sku: string;
  name: string;
  brand: string | null;
  model: string | null;
  condition: string | null;
  storage: string | null;
  quantity: number;
  wholesalePrice: number;
  retailPrice: number;
  margin: number;
  marginPct: number;
  lineSubtotal: number;
  inStock: boolean;
  appliedRule: EvaluationResult['appliedRule'];
  currency: string;
  generatedAt: string;
}

export async function generateQuote(
  req: QuoteRequest,
  meta: { ipAddress?: string | null; userAgent?: string | null } = {},
): Promise<QuoteResponse> {
  if (!req.sku && !req.model) {
    throw new QuoteError('BAD_INPUT', 'Provide either sku or model');
  }
  if (!Number.isInteger(req.quantity) || req.quantity < 1) {
    throw new QuoteError('BAD_INPUT', 'Invalid quantity');
  }

  const listing = await findBestListingForQuote({
    sku: req.sku,
    model: req.model,
    storage: req.storage,
    condition: req.condition,
  });
  if (!listing) {
    throw new QuoteError('NO_MATCH', 'No matching listing available right now');
  }

  const rules = await listActivePricingRules();
  // Pricing rules are wholesale-side; rule context uses listing.brand/sku.
  // Category isn't on wholesale_listing today, so it's left undefined here
  // — global / brand / sku rules cover the live cases.
  const result = evaluate(listing.wholesalePrice, rules, {
    sku: listing.sku,
    brand: listing.brand ?? undefined,
  });

  const generatedAt = new Date();

  // Best-effort audit row. Failure here MUST NOT block the customer — we
  // mirror the adminActivity "swallow audit failure" pattern.
  prisma.priceQuote
    .create({
      data: {
        sku: listing.sku,
        basePrice: result.wholesalePrice,
        appliedRuleId: result.appliedRule?.id ?? null,
        finalPrice: result.retailPrice,
        currency: listing.currency,
        ipAddress: meta.ipAddress ?? null,
        userAgent: meta.userAgent?.slice(0, 500) ?? null,
      },
    })
    .catch((err) => {
      console.error('[priceQuote] audit insert failed:', err);
    });

  return {
    sku: listing.sku,
    name: listing.name,
    brand: listing.brand,
    model: listing.model,
    condition: listing.condition,
    storage: listing.storage,
    quantity: req.quantity,
    wholesalePrice: result.wholesalePrice,
    retailPrice: result.retailPrice,
    margin: result.margin,
    marginPct: result.marginPct,
    lineSubtotal: Math.round(result.retailPrice * req.quantity * 100) / 100,
    inStock: listing.inStock,
    appliedRule: result.appliedRule,
    currency: listing.currency,
    generatedAt: generatedAt.toISOString(),
  };
}
