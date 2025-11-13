import { supabase } from '@/db/supabase';

// ============================================
// TYPES
// ============================================

export interface SalesPaginationParams {
  limit?: number;
  offset?: number;
  startDate?: string;
  endDate?: string;
  cashierId?: string;
  paymentType?: string;
  status?: string;
}

export interface PaginatedSalesResponse {
  data: any[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

export interface DailySalesSummary {
  sale_date: string;
  transaction_count: number;
  total_sales: number;
  total_tax: number;
  total_discount: number;
  avg_transaction: number;
  active_cashiers: number;
  cash_transactions: number;
  card_transactions: number;
  mobile_transactions: number;
  debt_transactions: number;
}

export interface MonthlySalesSummary {
  month: string;
  transaction_count: number;
  total_sales: number;
  total_tax: number;
  total_discount: number;
  avg_transaction: number;
  active_cashiers: number;
}

export interface CashierPerformance {
  cashier_id: string;
  username: string;
  full_name: string;
  total_transactions: number;
  total_sales: number;
  avg_transaction: number;
  total_discounts: number;
  days_worked: number;
  last_sale_date: string;
}

export interface ProductSalesSummary {
  product_id: string;
  name: string;
  sku: string;
  category_id: string;
  times_sold: number;
  total_quantity: number;
  total_revenue: number;
  avg_price: number;
  last_sold_date: string;
}

export interface SalesStats {
  total_sales: number;
  total_revenue: number;
  avg_transaction: number;
  today_sales: number;
  today_revenue: number;
  this_month_sales: number;
  this_month_revenue: number;
  oldest_record: string;
  newest_record: string;
}

export interface TableStats {
  table_name: string;
  row_count: number;
  total_size: string;
  table_size: string;
  indexes_size: string;
}

// ============================================
// PAGINATED SALES QUERIES
// ============================================

/**
 * Get paginated sales with filters
 * Uses database function for optimal performance
 */
export async function getSalesPaginated(
  params: SalesPaginationParams = {}
): Promise<PaginatedSalesResponse> {
  const {
    limit = 50,
    offset = 0,
    startDate,
    endDate,
    cashierId,
    paymentType,
    status = 'completed',
  } = params;

  const { data, error } = await supabase.rpc('get_sales_paginated', {
    p_limit: limit,
    p_offset: offset,
    p_start_date: startDate || null,
    p_end_date: endDate || null,
    p_cashier_id: cashierId || null,
    p_payment_type: paymentType || null,
    p_status: status || null,
  });

  if (error) {
    console.error('Error fetching paginated sales:', error);
    throw error;
  }

  const total = data && data.length > 0 ? data[0].total_count : 0;
  const hasMore = offset + limit < total;

  return {
    data: data || [],
    total,
    limit,
    offset,
    hasMore,
  };
}

// ============================================
// MATERIALIZED VIEW QUERIES
// ============================================

/**
 * Get daily sales summary (from materialized view)
 * Fast query for dashboard
 */
export async function getDailySalesSummary(
  startDate?: string,
  endDate?: string,
  limit = 30
): Promise<DailySalesSummary[]> {
  let query = supabase
    .from('daily_sales_summary')
    .select('*')
    .order('sale_date', { ascending: false })
    .limit(limit);

  if (startDate) {
    query = query.gte('sale_date', startDate);
  }

  if (endDate) {
    query = query.lte('sale_date', endDate);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching daily sales summary:', error);
    throw error;
  }

  return data || [];
}

/**
 * Get monthly sales summary (from materialized view)
 */
export async function getMonthlySalesSummary(
  limit = 12
): Promise<MonthlySalesSummary[]> {
  const { data, error } = await supabase
    .from('monthly_sales_summary')
    .select('*')
    .order('month', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching monthly sales summary:', error);
    throw error;
  }

  return data || [];
}

/**
 * Get cashier performance (from materialized view)
 */
export async function getCashierPerformance(): Promise<CashierPerformance[]> {
  const { data, error } = await supabase
    .from('cashier_performance')
    .select('*')
    .order('total_sales', { ascending: false });

  if (error) {
    console.error('Error fetching cashier performance:', error);
    throw error;
  }

  return data || [];
}

/**
 * Get product sales summary (from materialized view)
 */
export async function getProductSalesSummary(
  limit = 100
): Promise<ProductSalesSummary[]> {
  const { data, error } = await supabase
    .from('product_sales_summary')
    .select('*')
    .order('total_revenue', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching product sales summary:', error);
    throw error;
  }

  return data || [];
}

// ============================================
// REFRESH FUNCTIONS
// ============================================

/**
 * Refresh all materialized views
 * Should be called nightly via cron
 */
export async function refreshAllMaterializedViews(): Promise<void> {
  const { error } = await supabase.rpc('refresh_all_materialized_views');

  if (error) {
    console.error('Error refreshing materialized views:', error);
    throw error;
  }
}

/**
 * Refresh daily summary only
 * Can be called more frequently (hourly)
 */
export async function refreshDailySummary(): Promise<void> {
  const { error } = await supabase.rpc('refresh_daily_summary');

  if (error) {
    console.error('Error refreshing daily summary:', error);
    throw error;
  }
}

// ============================================
// STATISTICS & MONITORING
// ============================================

/**
 * Get sales statistics
 */
export async function getSalesStats(): Promise<SalesStats> {
  const { data, error } = await supabase.rpc('get_sales_stats');

  if (error) {
    console.error('Error fetching sales stats:', error);
    throw error;
  }

  return data || {
    total_sales: 0,
    total_revenue: 0,
    avg_transaction: 0,
    today_sales: 0,
    today_revenue: 0,
    this_month_sales: 0,
    this_month_revenue: 0,
    oldest_record: '',
    newest_record: '',
  };
}

/**
 * Get table statistics (for system status dashboard)
 */
export async function getTableStats(): Promise<TableStats[]> {
  const { data, error } = await supabase.rpc('get_table_stats');

  if (error) {
    console.error('Error fetching table stats:', error);
    return [];
  }

  return data || [];
}

// ============================================
// ARCHIVING
// ============================================

/**
 * Archive old sales (older than specified months)
 */
export async function archiveOldSales(
  monthsToKeep = 12
): Promise<{ success: boolean; archived_count: number; message: string }> {
  const { data, error } = await supabase.rpc('archive_old_sales', {
    months_to_keep: monthsToKeep,
  });

  if (error) {
    console.error('Error archiving sales:', error);
    throw error;
  }

  return data || { success: false, archived_count: 0, message: 'Failed to archive' };
}

// ============================================
// EXPORT FUNCTIONS
// ============================================

/**
 * Export sales to CSV
 */
export function exportSalesToCSV(sales: any[], filename = 'sales_export.csv'): void {
  if (!sales || sales.length === 0) {
    throw new Error('No data to export');
  }

  // CSV headers
  const headers = [
    'Receipt No',
    'Date',
    'Cashier',
    'Customer',
    'Subtotal',
    'Discount',
    'Tax',
    'Total',
    'Payment Type',
    'Received',
    'Change',
    'Debt',
    'Status',
  ];

  // CSV rows
  const rows = sales.map((sale) => [
    sale.receipt_no || '',
    new Date(sale.created_at).toLocaleString(),
    sale.cashier?.username || '',
    sale.customer?.name || '',
    sale.subtotal || 0,
    sale.discount || 0,
    sale.tax || 0,
    sale.total || 0,
    sale.payment_type || '',
    sale.received_amount || 0,
    sale.change_amount || 0,
    sale.debt_amount || 0,
    sale.status || '',
  ]);

  // Create CSV content
  const csvContent = [
    headers.join(','),
    ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
  ].join('\n');

  // Create blob and download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Export daily summary to CSV
 */
export function exportDailySummaryToCSV(
  summary: DailySalesSummary[],
  filename = 'daily_summary.csv'
): void {
  if (!summary || summary.length === 0) {
    throw new Error('No data to export');
  }

  const headers = [
    'Date',
    'Transactions',
    'Total Sales',
    'Tax',
    'Discount',
    'Avg Transaction',
    'Active Cashiers',
    'Cash',
    'Card',
    'Mobile',
    'Debt',
  ];

  const rows = summary.map((day) => [
    day.sale_date,
    day.transaction_count,
    day.total_sales,
    day.total_tax,
    day.total_discount,
    day.avg_transaction,
    day.active_cashiers,
    day.cash_transactions,
    day.card_transactions,
    day.mobile_transactions,
    day.debt_transactions,
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
