import { siteConfig } from '@/config/site';
import { formatPrice } from './money';
import type { Order } from '@/types/order';

export function buildWhatsAppOrderUrl(order: Order): string {
  const lines = order.items.map(
    (i) => `• ${i.name} × ${i.quantity} — ${formatPrice(i.unitPrice * i.quantity)}`,
  );

  const message = [
    `Hi Mansa, I'd like to order [${order.shortCode}]:`,
    '',
    ...lines,
    '',
    order.totals.bundleDiscount
      ? `Subtotal: ${formatPrice(order.totals.subtotal)}\nBundle discount: −${formatPrice(order.totals.bundleDiscount)}`
      : '',
    `Total: ${formatPrice(order.totals.total)}`,
    '',
    `Name: ${order.customer.name}`,
    `Phone: ${order.customer.phone}`,
    `Delivery: ${order.customer.address}, ${order.customer.city}`,
    `Payment: ${order.payment.toUpperCase()}`,
    order.notes ? `Notes: ${order.notes}` : '',
  ]
    .filter(Boolean)
    .join('\n');

  return `https://wa.me/${siteConfig.whatsappNumber}?text=${encodeURIComponent(message)}`;
}
