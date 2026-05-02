import type { CartItem, CartTotals } from './cart';
import type { Customer } from './customer';

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'dispatched'
  | 'delivered'
  | 'cancelled'
  | 'returned';

export type FulfillmentMethod = 'delivery' | 'pickup';
export type PaymentMethod = 'cod' | 'transfer' | 'mobile_money';

export interface Order {
  id: string;
  shortCode: string;
  customer: Customer;
  items: CartItem[];
  totals: CartTotals;
  status: OrderStatus;
  fulfillment: FulfillmentMethod;
  payment: PaymentMethod;
  notes?: string;
  whatsappMessageSent: boolean;
  createdAt: string;
  updatedAt: string;
}
