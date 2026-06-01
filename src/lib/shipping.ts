/**
 * Single source of truth for delivery pricing.
 * Free delivery at/above the threshold, otherwise a flat fee.
 */
export const FREE_DELIVERY_THRESHOLD = 450;
export const DELIVERY_FEE = 15;

/** Returns the delivery charge for a given subtotal (0 when it qualifies for free delivery). */
export function deliveryFor(subtotal: number): number {
  return subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE;
}
