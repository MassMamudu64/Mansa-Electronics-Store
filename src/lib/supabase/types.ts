// Generated types stub. Replace with real output after creating the Supabase
// project:
//
//   npx supabase gen types typescript --linked > src/lib/supabase/types.ts
//
// Until then, this typed scaffold mirrors the schema closely enough for the
// service layer to compile.

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export interface Database {
  public: {
    Tables: {
      products: {
        Row: {
          id: string;
          slug: string;
          name: string;
          category: string;
          brand: string | null;
          sku: string | null;
          device_type: string;
          compatibility: string[];
          description: string;
          bullets: string[];
          image_url: string | null;
          images: Json;
          cost_price: number;
          selling_price: number;
          compare_at_price: number | null;
          currency: string;
          condition: 'New' | 'A' | 'B' | 'C' | null;
          storage: string | null;
          tags: string[];
          is_best_seller: boolean;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database['public']['Tables']['products']['Row']> & {
          slug: string; name: string; category: string; selling_price: number;
        };
        Update: Partial<Database['public']['Tables']['products']['Row']>;
      };
      inventory: {
        Row: {
          id: string;
          product_id: string;
          quantity: number;
          low_stock_threshold: number;
          last_restocked: string | null;
          updated_at: string;
        };
        Insert: { product_id: string; quantity?: number; low_stock_threshold?: number };
        Update: Partial<Database['public']['Tables']['inventory']['Row']>;
      };
      customers: {
        Row: {
          id: string;
          phone: string;
          name: string;
          email: string | null;
          city: string | null;
          address: string | null;
          first_seen: string;
          last_seen: string;
          order_count: number;
          lifetime_value: number;
        };
        Insert: { phone: string; name: string; email?: string | null; city?: string | null; address?: string | null };
        Update: Partial<Database['public']['Tables']['customers']['Row']>;
      };
      orders: {
        Row: {
          id: string;
          short_code: string;
          customer_id: string | null;
          customer_name: string;
          customer_phone: string;
          customer_address: string;
          customer_city: string;
          status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
          payment: 'cod' | 'transfer' | 'mobile_money';
          notes: string | null;
          subtotal: number;
          bundle_discount: number;
          total: number;
          whatsapp_sent: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database['public']['Tables']['orders']['Row']>;
        Update: Partial<Database['public']['Tables']['orders']['Row']>;
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          product_id: string;
          product_name: string;
          product_sku: string | null;
          quantity: number;
          price_at_sale: number;
          line_total: number;
        };
        Insert: Omit<Database['public']['Tables']['order_items']['Row'], 'id'>;
        Update: Partial<Database['public']['Tables']['order_items']['Row']>;
      };
      user_roles: {
        Row: { user_id: string; role: 'admin' | 'staff'; created_at: string };
        Insert: { user_id: string; role: 'admin' | 'staff' };
        Update: Partial<Database['public']['Tables']['user_roles']['Row']>;
      };
    };
    Views: {
      v_product_performance: {
        Row: {
          id: string; name: string; category: string; sku: string | null;
          units_sold: number; revenue: number; gross_profit: number;
          stock_on_hand: number | null; is_low_stock: boolean | null;
        };
      };
      v_weekly_revenue: {
        Row: { week_start: string; order_count: number; revenue: number; cancelled_count: number };
      };
      v_customer_metrics: {
        Row: { total_customers: number; repeat_customers: number; repeat_rate_pct: number; avg_lifetime_value: number };
      };
      v_slow_movers: {
        Row: { id: string; name: string; category: string; stock: number; units_sold_30d: number; created_at: string };
      };
    };
    Functions: {
      create_order: {
        Args: {
          p_customer_name: string;
          p_customer_phone: string;
          p_customer_address: string;
          p_customer_city: string;
          p_payment: 'cod' | 'transfer' | 'mobile_money';
          p_notes: string | null;
          p_short_code: string;
          p_cart_items: Json;
        };
        Returns: { order_id: string; short_code: string; total: number }[];
      };
    };
    Enums: {
      order_status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
      payment_method: 'cod' | 'transfer' | 'mobile_money';
      user_role: 'admin' | 'staff';
    };
  };
}
