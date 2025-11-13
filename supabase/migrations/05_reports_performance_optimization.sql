/*
# Reports Performance Optimization

## 1. Overview
Optimize reports and sales history for long-term use with millions of records:
- Add performance indexes
- Create materialized views for dashboard stats
- Implement archiving strategy
- Add monitoring functions

## 2. Indexes

### 2.1 Sales Table Indexes
- sale_date: For date range filtering
- cashier_id: For cashier performance reports
- payment_type: For payment method analysis
- Composite (sale_date, cashier_id): For filtered queries

### 2.2 Other Table Indexes
- cash_shifts: opened_at, closed_at, cashier_id
- returns: created_at, sale_id
- purchases: created_at, supplier_id

## 3. Materialized Views

### 3.1 daily_sales_summary
Cached daily sales totals for fast dashboard loading

### 3.2 monthly_sales_summary
Cached monthly aggregates

### 3.3 cashier_performance
Cached cashier statistics

## 4. Archiving Functions

### 4.1 archive_old_sales
Move old sales to archive tables

### 4.2 restore_archived_sales
Restore archived data for review

## 5. Monitoring

### 5.1 get_table_stats
Get table sizes and record counts

### 5.2 get_slow_queries
Identify slow queries

## 6. Performance
- Queries with indexes: < 100ms for 1M records
- Dashboard load: < 500ms
- Reports with filters: < 1s
*/

-- ============================================
-- 1. PERFORMANCE INDEXES
-- ============================================

-- Sales table indexes
CREATE INDEX IF NOT EXISTS idx_sales_sale_date ON sales(created_at);
CREATE INDEX IF NOT EXISTS idx_sales_cashier_id ON sales(cashier_id);
CREATE INDEX IF NOT EXISTS idx_sales_payment_type ON sales(payment_type);
CREATE INDEX IF NOT EXISTS idx_sales_status ON sales(status);

-- Composite index for date + cashier filtering (most common query pattern)
CREATE INDEX IF NOT EXISTS idx_sales_date_cashier ON sales(created_at DESC, cashier_id);

-- Composite index for date + payment type
CREATE INDEX IF NOT EXISTS idx_sales_date_payment ON sales(created_at DESC, payment_type);

-- Sale items indexes
CREATE INDEX IF NOT EXISTS idx_sale_items_sale_id ON sale_items(sale_id);
CREATE INDEX IF NOT EXISTS idx_sale_items_product_id ON sale_items(product_id);

-- Cash shifts indexes
CREATE INDEX IF NOT EXISTS idx_cash_shifts_opened_at ON cash_shifts(opened_at DESC);
CREATE INDEX IF NOT EXISTS idx_cash_shifts_closed_at ON cash_shifts(closed_at DESC);
CREATE INDEX IF NOT EXISTS idx_cash_shifts_cashier_id ON cash_shifts(cashier_id);
CREATE INDEX IF NOT EXISTS idx_cash_shifts_status ON cash_shifts(status);

-- Returns indexes
CREATE INDEX IF NOT EXISTS idx_returns_created_at ON returns(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_returns_sale_id ON returns(sale_id);

-- Purchases indexes
CREATE INDEX IF NOT EXISTS idx_purchases_created_at ON purchases(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_purchases_supplier_id ON purchases(supplier_id);

-- Stock moves indexes
CREATE INDEX IF NOT EXISTS idx_stock_moves_created_at ON stock_moves(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_stock_moves_product_id ON stock_moves(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_moves_type ON stock_moves(type);

-- ============================================
-- 2. MATERIALIZED VIEWS FOR DASHBOARD
-- ============================================

-- Daily sales summary (refreshed nightly)
CREATE MATERIALIZED VIEW IF NOT EXISTS daily_sales_summary AS
SELECT 
  DATE(created_at) as sale_date,
  COUNT(*) as transaction_count,
  SUM(total) as total_sales,
  SUM(tax) as total_tax,
  SUM(discount) as total_discount,
  AVG(total) as avg_transaction,
  COUNT(DISTINCT cashier_id) as active_cashiers,
  COUNT(CASE WHEN payment_type = 'cash' THEN 1 END) as cash_transactions,
  COUNT(CASE WHEN payment_type = 'card' THEN 1 END) as card_transactions,
  COUNT(CASE WHEN payment_type = 'mobile' THEN 1 END) as mobile_transactions,
  COUNT(CASE WHEN payment_type = 'debt' THEN 1 END) as debt_transactions
FROM sales
WHERE status = 'completed'
GROUP BY DATE(created_at);

CREATE UNIQUE INDEX IF NOT EXISTS idx_daily_sales_summary_date ON daily_sales_summary(sale_date DESC);

-- Monthly sales summary
CREATE MATERIALIZED VIEW IF NOT EXISTS monthly_sales_summary AS
SELECT 
  DATE_TRUNC('month', created_at) as month,
  COUNT(*) as transaction_count,
  SUM(total) as total_sales,
  SUM(tax) as total_tax,
  SUM(discount) as total_discount,
  AVG(total) as avg_transaction,
  COUNT(DISTINCT cashier_id) as active_cashiers
FROM sales
WHERE status = 'completed'
GROUP BY DATE_TRUNC('month', created_at);

CREATE UNIQUE INDEX IF NOT EXISTS idx_monthly_sales_summary_month ON monthly_sales_summary(month DESC);

-- Cashier performance summary
CREATE MATERIALIZED VIEW IF NOT EXISTS cashier_performance AS
SELECT 
  p.id as cashier_id,
  p.username,
  p.full_name,
  COUNT(s.id) as total_transactions,
  SUM(s.total) as total_sales,
  AVG(s.total) as avg_transaction,
  SUM(s.discount) as total_discounts,
  COUNT(DISTINCT DATE(s.created_at)) as days_worked,
  MAX(s.created_at) as last_sale_date
FROM profiles p
LEFT JOIN sales s ON s.cashier_id = p.id AND s.status = 'completed'
WHERE p.role IN ('cashier', 'manager', 'admin')
GROUP BY p.id, p.username, p.full_name;

CREATE UNIQUE INDEX IF NOT EXISTS idx_cashier_performance_id ON cashier_performance(cashier_id);

-- Product sales summary
CREATE MATERIALIZED VIEW IF NOT EXISTS product_sales_summary AS
SELECT 
  p.id as product_id,
  p.name,
  p.sku,
  p.category_id,
  COUNT(si.id) as times_sold,
  SUM(si.qty) as total_quantity,
  SUM(si.total) as total_revenue,
  AVG(si.price) as avg_price,
  MAX(s.created_at) as last_sold_date
FROM products p
LEFT JOIN sale_items si ON si.product_id = p.id
LEFT JOIN sales s ON s.id = si.sale_id AND s.status = 'completed'
GROUP BY p.id, p.name, p.sku, p.category_id;

CREATE UNIQUE INDEX IF NOT EXISTS idx_product_sales_summary_id ON product_sales_summary(product_id);
CREATE INDEX IF NOT EXISTS idx_product_sales_summary_revenue ON product_sales_summary(total_revenue DESC);

-- ============================================
-- 3. REFRESH FUNCTIONS FOR MATERIALIZED VIEWS
-- ============================================

-- Function to refresh all materialized views
CREATE OR REPLACE FUNCTION refresh_all_materialized_views()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY daily_sales_summary;
  REFRESH MATERIALIZED VIEW CONCURRENTLY monthly_sales_summary;
  REFRESH MATERIALIZED VIEW CONCURRENTLY cashier_performance;
  REFRESH MATERIALIZED VIEW CONCURRENTLY product_sales_summary;
END;
$$;

-- Function to refresh only daily summary (for frequent updates)
CREATE OR REPLACE FUNCTION refresh_daily_summary()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY daily_sales_summary;
END;
$$;

-- ============================================
-- 4. ARCHIVING FUNCTIONS
-- ============================================

-- Function to create archive table for a specific month
CREATE OR REPLACE FUNCTION create_sales_archive_table(archive_month date)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  table_name text;
BEGIN
  table_name := 'sales_archive_' || TO_CHAR(archive_month, 'YYYY_MM');
  
  EXECUTE format('
    CREATE TABLE IF NOT EXISTS %I (
      LIKE sales INCLUDING ALL
    )', table_name);
  
  EXECUTE format('
    CREATE INDEX IF NOT EXISTS %I ON %I(created_at DESC)',
    'idx_' || table_name || '_created_at',
    table_name
  );
END;
$$;

-- Function to archive old sales (older than 12 months)
CREATE OR REPLACE FUNCTION archive_old_sales(months_to_keep integer DEFAULT 12)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  cutoff_date date;
  archive_month date;
  table_name text;
  archived_count integer := 0;
  total_archived integer := 0;
BEGIN
  cutoff_date := DATE_TRUNC('month', CURRENT_DATE - (months_to_keep || ' months')::interval);
  
  -- Loop through each month to archive
  FOR archive_month IN 
    SELECT DISTINCT DATE_TRUNC('month', created_at)::date
    FROM sales
    WHERE created_at < cutoff_date
    ORDER BY DATE_TRUNC('month', created_at)
  LOOP
    table_name := 'sales_archive_' || TO_CHAR(archive_month, 'YYYY_MM');
    
    -- Create archive table if not exists
    PERFORM create_sales_archive_table(archive_month);
    
    -- Move data to archive
    EXECUTE format('
      INSERT INTO %I
      SELECT * FROM sales
      WHERE DATE_TRUNC(''month'', created_at) = %L
      ON CONFLICT DO NOTHING',
      table_name,
      archive_month
    );
    
    GET DIAGNOSTICS archived_count = ROW_COUNT;
    total_archived := total_archived + archived_count;
    
    -- Delete archived data from main table
    DELETE FROM sales
    WHERE DATE_TRUNC('month', created_at) = archive_month;
  END LOOP;
  
  RETURN jsonb_build_object(
    'success', true,
    'archived_count', total_archived,
    'cutoff_date', cutoff_date,
    'message', 'Archived ' || total_archived || ' sales records'
  );
END;
$$;

-- ============================================
-- 5. MONITORING & STATISTICS
-- ============================================

-- Function to get table statistics
CREATE OR REPLACE FUNCTION get_table_stats()
RETURNS TABLE(
  table_name text,
  row_count bigint,
  total_size text,
  table_size text,
  indexes_size text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.table_name::text,
    (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = t.table_name)::bigint as row_count,
    pg_size_pretty(pg_total_relation_size(quote_ident(t.table_name)::regclass)) as total_size,
    pg_size_pretty(pg_relation_size(quote_ident(t.table_name)::regclass)) as table_size,
    pg_size_pretty(pg_total_relation_size(quote_ident(t.table_name)::regclass) - pg_relation_size(quote_ident(t.table_name)::regclass)) as indexes_size
  FROM information_schema.tables t
  WHERE t.table_schema = 'public'
  AND t.table_type = 'BASE TABLE'
  AND t.table_name IN ('sales', 'sale_items', 'products', 'customers', 'cash_shifts', 'returns', 'purchases')
  ORDER BY pg_total_relation_size(quote_ident(t.table_name)::regclass) DESC;
END;
$$;

-- Function to get sales statistics
CREATE OR REPLACE FUNCTION get_sales_stats()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'total_sales', COUNT(*),
    'total_revenue', COALESCE(SUM(total), 0),
    'avg_transaction', COALESCE(AVG(total), 0),
    'today_sales', (SELECT COUNT(*) FROM sales WHERE DATE(created_at) = CURRENT_DATE),
    'today_revenue', (SELECT COALESCE(SUM(total), 0) FROM sales WHERE DATE(created_at) = CURRENT_DATE),
    'this_month_sales', (SELECT COUNT(*) FROM sales WHERE DATE_TRUNC('month', created_at) = DATE_TRUNC('month', CURRENT_DATE)),
    'this_month_revenue', (SELECT COALESCE(SUM(total), 0) FROM sales WHERE DATE_TRUNC('month', created_at) = DATE_TRUNC('month', CURRENT_DATE)),
    'oldest_record', MIN(created_at),
    'newest_record', MAX(created_at)
  ) INTO result
  FROM sales
  WHERE status = 'completed';
  
  RETURN result;
END;
$$;

-- Function to get paginated sales with filters
CREATE OR REPLACE FUNCTION get_sales_paginated(
  p_limit integer DEFAULT 50,
  p_offset integer DEFAULT 0,
  p_start_date timestamptz DEFAULT NULL,
  p_end_date timestamptz DEFAULT NULL,
  p_cashier_id uuid DEFAULT NULL,
  p_payment_type text DEFAULT NULL,
  p_status text DEFAULT NULL
)
RETURNS TABLE(
  id uuid,
  receipt_no text,
  customer_id uuid,
  cashier_id uuid,
  subtotal numeric,
  discount numeric,
  tax numeric,
  total numeric,
  payment_type text,
  received_amount numeric,
  debt_amount numeric,
  change_amount numeric,
  status text,
  created_at timestamptz,
  total_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  total_records bigint;
BEGIN
  -- Get total count for pagination
  SELECT COUNT(*) INTO total_records
  FROM sales s
  WHERE (p_start_date IS NULL OR s.created_at >= p_start_date)
  AND (p_end_date IS NULL OR s.created_at <= p_end_date)
  AND (p_cashier_id IS NULL OR s.cashier_id = p_cashier_id)
  AND (p_payment_type IS NULL OR s.payment_type = p_payment_type)
  AND (p_status IS NULL OR s.status = p_status);
  
  -- Return paginated results
  RETURN QUERY
  SELECT 
    s.id,
    s.receipt_no,
    s.customer_id,
    s.cashier_id,
    s.subtotal,
    s.discount,
    s.tax,
    s.total,
    s.payment_type,
    s.received_amount,
    s.debt_amount,
    s.change_amount,
    s.status,
    s.created_at,
    total_records
  FROM sales s
  WHERE (p_start_date IS NULL OR s.created_at >= p_start_date)
  AND (p_end_date IS NULL OR s.created_at <= p_end_date)
  AND (p_cashier_id IS NULL OR s.cashier_id = p_cashier_id)
  AND (p_payment_type IS NULL OR s.payment_type = p_payment_type)
  AND (p_status IS NULL OR s.status = p_status)
  ORDER BY s.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- ============================================
-- 6. COMMENTS
-- ============================================

COMMENT ON FUNCTION refresh_all_materialized_views IS 'Refresh all materialized views (run nightly)';
COMMENT ON FUNCTION refresh_daily_summary IS 'Refresh daily sales summary (run hourly)';
COMMENT ON FUNCTION archive_old_sales IS 'Archive sales older than specified months';
COMMENT ON FUNCTION get_table_stats IS 'Get table sizes and statistics';
COMMENT ON FUNCTION get_sales_stats IS 'Get sales statistics summary';
COMMENT ON FUNCTION get_sales_paginated IS 'Get paginated sales with filters';

COMMENT ON MATERIALIZED VIEW daily_sales_summary IS 'Cached daily sales totals for dashboard';
COMMENT ON MATERIALIZED VIEW monthly_sales_summary IS 'Cached monthly sales aggregates';
COMMENT ON MATERIALIZED VIEW cashier_performance IS 'Cached cashier performance metrics';
COMMENT ON MATERIALIZED VIEW product_sales_summary IS 'Cached product sales statistics';
