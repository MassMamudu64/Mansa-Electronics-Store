import { createClient } from '@/lib/supabase/client';

// Admin-only. Reads from analytics views that aggregate orders and customers.
// All queries are guarded by RLS on the underlying tables.

export interface OverviewKpis {
  revenueThisWeek: number;
  ordersThisWeek: number;
  cancelledThisWeek: number;
  repeatRate: number;
  avgLifetimeValue: number;
  totalCustomers: number;
  topProducts: Array<{
    id: string;
    name: string;
    category: string;
    units_sold: number;
    revenue: number;
    gross_profit: number;
  }>;
}

export const analyticsService = {
  async overview(): Promise<OverviewKpis> {
    const supabase = createClient();

    const [weeklyRes, customerRes, topRes] = await Promise.all([
      supabase.from('v_weekly_revenue').select('*').limit(1),
      supabase.from('v_customer_metrics').select('*').single(),
      supabase
        .from('v_product_performance')
        .select('id,name,category,units_sold,revenue,gross_profit')
        .order('revenue', { ascending: false })
        .limit(5),
    ]);

    const week = (weeklyRes.data as any[] | null)?.[0];
    const customer = customerRes.data as any;
    return {
      revenueThisWeek: Number(week?.revenue ?? 0),
      ordersThisWeek: Number(week?.order_count ?? 0),
      cancelledThisWeek: Number(week?.cancelled_count ?? 0),
      repeatRate: Number(customer?.repeat_rate_pct ?? 0),
      avgLifetimeValue: Number(customer?.avg_lifetime_value ?? 0),
      totalCustomers: Number(customer?.total_customers ?? 0),
      topProducts: (topRes.data as any[]) ?? [],
    };
  },

  async lowStock() {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('v_product_performance')
      .select('*')
      .eq('is_low_stock', true)
      .order('stock_on_hand');
    if (error) throw new Error(error.message);
    return data ?? [];
  },

  async slowMovers() {
    const supabase = createClient();
    const { data, error } = await supabase.from('v_slow_movers').select('*');
    if (error) throw new Error(error.message);
    return data ?? [];
  },

  async revenueTrend() {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('v_weekly_revenue')
      .select('*')
      .order('week_start', { ascending: true });
    if (error) throw new Error(error.message);
    return data ?? [];
  },

  async productPerformance() {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('v_product_performance')
      .select('*')
      .order('revenue', { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  },
};
