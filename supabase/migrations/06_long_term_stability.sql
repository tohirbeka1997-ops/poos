/*
# Long-Term Stability & Performance

## 1. Overview
Implement long-term stability features for 5+ years of operation:
- Tiyin-based amounts (INT) for precision
- Idempotent transactions (prevent duplicates)
- Shift reconciliation with snapshots
- Health metrics and monitoring
- Audit trail for critical operations
- Background report jobs

## 2. Data Type Optimization
- Store amounts in tiyin (1 so'm = 100 tiyin)
- Use INT for precision and performance
- Avoid floating point rounding errors

## 3. Idempotent Transactions
- Add transaction_uuid to prevent duplicates
- Handle double-clicks and network failures
- ON CONFLICT DO NOTHING pattern

## 4. Shift Reconciliation
- Snapshot on shift close
- Calculate cash/card/mobile totals
- Track differences (expected vs actual)

## 5. Monitoring
- Health metrics table
- Query timing logs
- Alert thresholds
*/

-- ============================================
-- 1. TIYIN-BASED AMOUNTS (INT)
-- ============================================

-- Add tiyin columns to sales table
ALTER TABLE sales 
ADD COLUMN IF NOT EXISTS subtotal_tiyin INT,
ADD COLUMN IF NOT EXISTS discount_tiyin INT,
ADD COLUMN IF NOT EXISTS tax_tiyin INT,
ADD COLUMN IF NOT EXISTS total_tiyin INT,
ADD COLUMN IF NOT EXISTS received_amount_tiyin INT,
ADD COLUMN IF NOT EXISTS debt_amount_tiyin INT,
ADD COLUMN IF NOT EXISTS change_amount_tiyin INT;

-- Migrate existing data (convert to tiyin)
UPDATE sales 
SET 
  subtotal_tiyin = ROUND(subtotal * 100)::INT,
  discount_tiyin = ROUND(discount * 100)::INT,
  tax_tiyin = ROUND(tax * 100)::INT,
  total_tiyin = ROUND(total * 100)::INT,
  received_amount_tiyin = ROUND(received_amount * 100)::INT,
  debt_amount_tiyin = ROUND(debt_amount * 100)::INT,
  change_amount_tiyin = ROUND(change_amount * 100)::INT
WHERE subtotal_tiyin IS NULL;

-- Add tiyin columns to sale_items
ALTER TABLE sale_items
ADD COLUMN IF NOT EXISTS price_tiyin INT,
ADD COLUMN IF NOT EXISTS discount_tiyin INT,
ADD COLUMN IF NOT EXISTS tax_tiyin INT,
ADD COLUMN IF NOT EXISTS total_tiyin INT;

-- Migrate sale_items data
UPDATE sale_items
SET
  price_tiyin = ROUND(price * 100)::INT,
  discount_tiyin = ROUND(discount * 100)::INT,
  tax_tiyin = ROUND(tax * 100)::INT,
  total_tiyin = ROUND(total * 100)::INT
WHERE price_tiyin IS NULL;

-- Add tiyin columns to products
ALTER TABLE products
ADD COLUMN IF NOT EXISTS price_tiyin INT,
ADD COLUMN IF NOT EXISTS cost_price_tiyin INT;

-- Migrate products data
UPDATE products
SET
  price_tiyin = ROUND(price * 100)::INT,
  cost_price_tiyin = ROUND(cost_price * 100)::INT
WHERE price_tiyin IS NULL;

-- ============================================
-- 2. IDEMPOTENT TRANSACTIONS
-- ============================================

-- Add transaction UUID to prevent duplicates
ALTER TABLE sales
ADD COLUMN IF NOT EXISTS transaction_uuid UUID;

-- Create unique index
CREATE UNIQUE INDEX IF NOT EXISTS sales_transaction_uuid_uidx 
ON sales(transaction_uuid) 
WHERE transaction_uuid IS NOT NULL;

-- Generate UUIDs for existing records
UPDATE sales 
SET transaction_uuid = gen_random_uuid() 
WHERE transaction_uuid IS NULL;

-- ============================================
-- 3. SHIFT RECONCILIATION & SNAPSHOTS
-- ============================================

-- Shift snapshots table
CREATE TABLE IF NOT EXISTS cash_shift_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shift_id uuid NOT NULL REFERENCES cash_shifts(id) ON DELETE CASCADE,
  closed_at timestamptz NOT NULL DEFAULT now(),
  
  -- Expected totals (from sales records)
  expected_cash_tiyin INT NOT NULL DEFAULT 0,
  expected_card_tiyin INT NOT NULL DEFAULT 0,
  expected_mobile_tiyin INT NOT NULL DEFAULT 0,
  expected_debt_tiyin INT NOT NULL DEFAULT 0,
  expected_total_tiyin INT NOT NULL DEFAULT 0,
  
  -- Actual totals (counted by cashier)
  actual_cash_tiyin INT NOT NULL DEFAULT 0,
  actual_card_tiyin INT NOT NULL DEFAULT 0,
  actual_mobile_tiyin INT NOT NULL DEFAULT 0,
  
  -- Differences
  cash_diff_tiyin INT NOT NULL DEFAULT 0,
  card_diff_tiyin INT NOT NULL DEFAULT 0,
  mobile_diff_tiyin INT NOT NULL DEFAULT 0,
  total_diff_tiyin INT NOT NULL DEFAULT 0,
  
  -- Transaction counts
  total_transactions INT NOT NULL DEFAULT 0,
  cash_transactions INT NOT NULL DEFAULT 0,
  card_transactions INT NOT NULL DEFAULT 0,
  mobile_transactions INT NOT NULL DEFAULT 0,
  debt_transactions INT NOT NULL DEFAULT 0,
  
  -- Metadata
  notes text,
  meta jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_shift_snapshots_shift_id ON cash_shift_snapshots(shift_id);
CREATE INDEX IF NOT EXISTS idx_shift_snapshots_closed_at ON cash_shift_snapshots(closed_at DESC);

-- Function to create shift snapshot
CREATE OR REPLACE FUNCTION create_shift_snapshot(
  p_shift_id uuid,
  p_actual_cash_tiyin INT,
  p_actual_card_tiyin INT,
  p_actual_mobile_tiyin INT,
  p_notes text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_expected_cash INT := 0;
  v_expected_card INT := 0;
  v_expected_mobile INT := 0;
  v_expected_debt INT := 0;
  v_expected_total INT := 0;
  v_total_transactions INT := 0;
  v_cash_transactions INT := 0;
  v_card_transactions INT := 0;
  v_mobile_transactions INT := 0;
  v_debt_transactions INT := 0;
  v_snapshot_id uuid;
BEGIN
  -- Calculate expected totals from sales
  SELECT 
    COALESCE(SUM(CASE WHEN payment_type = 'cash' THEN total_tiyin ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN payment_type = 'card' THEN total_tiyin ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN payment_type = 'mobile' THEN total_tiyin ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN payment_type = 'debt' OR payment_type = 'partial' THEN debt_amount_tiyin ELSE 0 END), 0),
    COALESCE(SUM(total_tiyin), 0),
    COUNT(*),
    COUNT(CASE WHEN payment_type = 'cash' THEN 1 END),
    COUNT(CASE WHEN payment_type = 'card' THEN 1 END),
    COUNT(CASE WHEN payment_type = 'mobile' THEN 1 END),
    COUNT(CASE WHEN payment_type = 'debt' OR payment_type = 'partial' THEN 1 END)
  INTO 
    v_expected_cash, v_expected_card, v_expected_mobile, v_expected_debt, v_expected_total,
    v_total_transactions, v_cash_transactions, v_card_transactions, v_mobile_transactions, v_debt_transactions
  FROM sales
  WHERE shift_id = p_shift_id AND status = 'completed';
  
  -- Create snapshot
  INSERT INTO cash_shift_snapshots (
    shift_id,
    expected_cash_tiyin, expected_card_tiyin, expected_mobile_tiyin, expected_debt_tiyin, expected_total_tiyin,
    actual_cash_tiyin, actual_card_tiyin, actual_mobile_tiyin,
    cash_diff_tiyin, card_diff_tiyin, mobile_diff_tiyin, total_diff_tiyin,
    total_transactions, cash_transactions, card_transactions, mobile_transactions, debt_transactions,
    notes
  ) VALUES (
    p_shift_id,
    v_expected_cash, v_expected_card, v_expected_mobile, v_expected_debt, v_expected_total,
    p_actual_cash_tiyin, p_actual_card_tiyin, p_actual_mobile_tiyin,
    p_actual_cash_tiyin - v_expected_cash,
    p_actual_card_tiyin - v_expected_card,
    p_actual_mobile_tiyin - v_expected_mobile,
    (p_actual_cash_tiyin + p_actual_card_tiyin + p_actual_mobile_tiyin) - (v_expected_cash + v_expected_card + v_expected_mobile),
    v_total_transactions, v_cash_transactions, v_card_transactions, v_mobile_transactions, v_debt_transactions,
    p_notes
  ) RETURNING id INTO v_snapshot_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'snapshot_id', v_snapshot_id,
    'expected_total_tiyin', v_expected_total,
    'actual_total_tiyin', p_actual_cash_tiyin + p_actual_card_tiyin + p_actual_mobile_tiyin,
    'total_diff_tiyin', (p_actual_cash_tiyin + p_actual_card_tiyin + p_actual_mobile_tiyin) - (v_expected_cash + v_expected_card + v_expected_mobile),
    'transactions', v_total_transactions
  );
END;
$$;

-- ============================================
-- 4. AUDIT TRAIL
-- ============================================

-- Audit logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  event text NOT NULL,
  entity text NOT NULL,
  entity_id uuid,
  payload jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_id ON audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_event ON audit_logs(event);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- Function to log audit event
CREATE OR REPLACE FUNCTION log_audit_event(
  p_actor_id uuid,
  p_event text,
  p_entity text,
  p_entity_id uuid,
  p_payload jsonb DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_log_id uuid;
BEGIN
  INSERT INTO audit_logs (actor_id, event, entity, entity_id, payload)
  VALUES (p_actor_id, p_event, p_entity, p_entity_id, p_payload)
  RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$;

-- ============================================
-- 5. HEALTH METRICS & MONITORING
-- ============================================

-- Health metrics table
CREATE TABLE IF NOT EXISTS health_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  metric text NOT NULL,
  value numeric NOT NULL,
  unit text,
  threshold_warning numeric,
  threshold_critical numeric,
  meta jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_health_metrics_metric ON health_metrics(metric);
CREATE INDEX IF NOT EXISTS idx_health_metrics_created_at ON health_metrics(created_at DESC);

-- Query timing logs
CREATE TABLE IF NOT EXISTS query_timing_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  query_name text NOT NULL,
  duration_ms numeric NOT NULL,
  params jsonb,
  status text,
  error_message text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_query_timing_logs_query_name ON query_timing_logs(query_name);
CREATE INDEX IF NOT EXISTS idx_query_timing_logs_duration ON query_timing_logs(duration_ms DESC);
CREATE INDEX IF NOT EXISTS idx_query_timing_logs_created_at ON query_timing_logs(created_at DESC);

-- Function to log query timing
CREATE OR REPLACE FUNCTION log_query_timing(
  p_query_name text,
  p_duration_ms numeric,
  p_params jsonb DEFAULT NULL,
  p_status text DEFAULT 'success',
  p_error_message text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_log_id uuid;
BEGIN
  INSERT INTO query_timing_logs (query_name, duration_ms, params, status, error_message)
  VALUES (p_query_name, p_duration_ms, p_params, p_status, p_error_message)
  RETURNING id INTO v_log_id;
  
  -- Alert if > 500ms
  IF p_duration_ms > 500 THEN
    INSERT INTO health_metrics (metric, value, unit, threshold_warning, meta)
    VALUES ('slow_query', p_duration_ms, 'ms', 500, jsonb_build_object('query_name', p_query_name));
  END IF;
  
  RETURN v_log_id;
END;
$$;

-- Function to collect health metrics
CREATE OR REPLACE FUNCTION collect_health_metrics()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_sales_count bigint;
  v_sales_size text;
  v_db_size text;
  v_slow_queries_count bigint;
  v_avg_query_time numeric;
BEGIN
  -- Count sales records
  SELECT COUNT(*) INTO v_sales_count FROM sales;
  
  -- Get table sizes
  SELECT pg_size_pretty(pg_total_relation_size('sales')) INTO v_sales_size;
  SELECT pg_size_pretty(pg_database_size(current_database())) INTO v_db_size;
  
  -- Count slow queries (last hour)
  SELECT COUNT(*) INTO v_slow_queries_count
  FROM query_timing_logs
  WHERE created_at > now() - interval '1 hour'
  AND duration_ms > 500;
  
  -- Average query time (last hour)
  SELECT COALESCE(AVG(duration_ms), 0) INTO v_avg_query_time
  FROM query_timing_logs
  WHERE created_at > now() - interval '1 hour';
  
  -- Insert metrics
  INSERT INTO health_metrics (metric, value, unit) VALUES
    ('sales_count', v_sales_count, 'records'),
    ('slow_queries_1h', v_slow_queries_count, 'count'),
    ('avg_query_time_1h', v_avg_query_time, 'ms');
  
  RETURN jsonb_build_object(
    'sales_count', v_sales_count,
    'sales_size', v_sales_size,
    'db_size', v_db_size,
    'slow_queries_1h', v_slow_queries_count,
    'avg_query_time_1h', v_avg_query_time
  );
END;
$$;

-- ============================================
-- 6. BACKGROUND REPORT JOBS
-- ============================================

-- Report jobs table
CREATE TABLE IF NOT EXISTS report_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  type text NOT NULL,
  params jsonb,
  status text NOT NULL DEFAULT 'pending',
  progress numeric DEFAULT 0,
  file_url text,
  error_message text,
  created_at timestamptz DEFAULT now(),
  started_at timestamptz,
  finished_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_report_jobs_user_id ON report_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_report_jobs_status ON report_jobs(status);
CREATE INDEX IF NOT EXISTS idx_report_jobs_created_at ON report_jobs(created_at DESC);

-- Function to create report job
CREATE OR REPLACE FUNCTION create_report_job(
  p_user_id uuid,
  p_type text,
  p_params jsonb DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_job_id uuid;
BEGIN
  INSERT INTO report_jobs (user_id, type, params, status)
  VALUES (p_user_id, p_type, p_params, 'pending')
  RETURNING id INTO v_job_id;
  
  RETURN v_job_id;
END;
$$;

-- Function to update report job status
CREATE OR REPLACE FUNCTION update_report_job(
  p_job_id uuid,
  p_status text,
  p_progress numeric DEFAULT NULL,
  p_file_url text DEFAULT NULL,
  p_error_message text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE report_jobs
  SET 
    status = p_status,
    progress = COALESCE(p_progress, progress),
    file_url = COALESCE(p_file_url, file_url),
    error_message = COALESCE(p_error_message, error_message),
    started_at = CASE WHEN p_status = 'processing' AND started_at IS NULL THEN now() ELSE started_at END,
    finished_at = CASE WHEN p_status IN ('completed', 'failed') THEN now() ELSE finished_at END
  WHERE id = p_job_id;
  
  RETURN jsonb_build_object('success', true, 'job_id', p_job_id, 'status', p_status);
END;
$$;

-- ============================================
-- 7. HELPER FUNCTIONS
-- ============================================

-- Convert tiyin to so'm (for display)
CREATE OR REPLACE FUNCTION tiyin_to_som(tiyin INT)
RETURNS numeric
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT (tiyin::numeric / 100)::numeric(15,2);
$$;

-- Convert so'm to tiyin (for storage)
CREATE OR REPLACE FUNCTION som_to_tiyin(som numeric)
RETURNS INT
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT ROUND(som * 100)::INT;
$$;

-- Commercial rounding (0.5 rounds up)
CREATE OR REPLACE FUNCTION commercial_round(amount numeric, decimals INT DEFAULT 0)
RETURNS numeric
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT ROUND(amount + 0.0000001, decimals);
$$;

-- ============================================
-- 8. COMMENTS
-- ============================================

COMMENT ON COLUMN sales.transaction_uuid IS 'Unique transaction ID to prevent duplicates (idempotent)';
COMMENT ON COLUMN sales.total_tiyin IS 'Total amount in tiyin (1 so''m = 100 tiyin)';
COMMENT ON TABLE cash_shift_snapshots IS 'Shift reconciliation snapshots with expected vs actual totals';
COMMENT ON TABLE audit_logs IS 'Audit trail for critical operations';
COMMENT ON TABLE health_metrics IS 'System health metrics and monitoring';
COMMENT ON TABLE query_timing_logs IS 'Query performance logs for monitoring';
COMMENT ON TABLE report_jobs IS 'Background report generation jobs';

COMMENT ON FUNCTION create_shift_snapshot IS 'Create shift reconciliation snapshot on shift close';
COMMENT ON FUNCTION log_audit_event IS 'Log audit event for critical operations';
COMMENT ON FUNCTION log_query_timing IS 'Log query execution time for monitoring';
COMMENT ON FUNCTION collect_health_metrics IS 'Collect system health metrics';
COMMENT ON FUNCTION create_report_job IS 'Create background report generation job';
COMMENT ON FUNCTION update_report_job IS 'Update report job status and progress';
