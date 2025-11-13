/*
# Supermarket POS Database Schema

## 1. Overview
Complete database schema for a Supermarket POS system including:
- User management with role-based access control
- Product and category management
- Customer management with balance and points
- Sales transactions with multiple payment types
- Returns/refunds processing
- Purchase orders from suppliers
- Inventory tracking with stock movements
- Cash register shift management

## 2. Tables

### 2.1 User Management
- `profiles`: User profiles with roles (admin, manager, cashier, accountant)

### 2.2 Product Management
- `categories`: Product categories
- `products`: Product catalog

### 2.3 Customer Management
- `customers`: Customer records

### 2.4 Sales Management
- `sales`: Sales transactions
- `sale_items`: Individual items in sales
- `payments`: Payment records

### 2.5 Returns Management
- `returns`: Return transactions
- `return_items`: Individual items in returns

### 2.6 Purchase Management
- `suppliers`: Supplier records
- `purchases`: Purchase orders
- `purchase_items`: Individual items in purchases

### 2.7 Inventory Management
- `stock_moves`: Stock movement log

### 2.8 Cash Register Management
- `cash_shifts`: Cash register shifts
- `cash_collections`: Cash collection (inkassa) records

### 2.9 Settings
- `settings`: System settings

## 3. Security
- RLS is NOT enabled on most tables for simplicity
- Access control is managed at application level based on user roles
- First registered user becomes admin automatically via trigger

## 4. Enums
- user_role: 'admin', 'manager', 'cashier', 'accountant'
- payment_type: 'cash', 'card', 'mobile', 'partial', 'debt'
- stock_move_type: 'in', 'out', 'adjustment'
*/

-- Create ENUM types
CREATE TYPE user_role AS ENUM ('admin', 'manager', 'cashier', 'accountant');
CREATE TYPE payment_type AS ENUM ('cash', 'card', 'mobile', 'partial', 'debt');
CREATE TYPE stock_move_type AS ENUM ('in', 'out', 'adjustment');

-- Profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text UNIQUE,
  full_name text,
  role user_role DEFAULT 'cashier'::user_role NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
  id bigserial PRIMARY KEY,
  name text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now()
);

-- Products table
CREATE TABLE IF NOT EXISTS products (
  id bigserial PRIMARY KEY,
  name text NOT NULL,
  sku text UNIQUE,
  barcode text UNIQUE,
  category_id bigint REFERENCES categories(id) ON DELETE SET NULL,
  unit text DEFAULT 'dona',
  sale_price bigint NOT NULL,
  cost_price bigint,
  tax_rate numeric(5,2) DEFAULT 0,
  stock numeric(10,2) DEFAULT 0,
  min_stock numeric(10,2) DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Customers table
CREATE TABLE IF NOT EXISTS customers (
  id bigserial PRIMARY KEY,
  code text UNIQUE,
  name text NOT NULL,
  phone text,
  address text,
  balance bigint DEFAULT 0,
  points bigint DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Suppliers table
CREATE TABLE IF NOT EXISTS suppliers (
  id bigserial PRIMARY KEY,
  name text NOT NULL,
  phone text,
  address text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Cash shifts table
CREATE TABLE IF NOT EXISTS cash_shifts (
  id bigserial PRIMARY KEY,
  cashier_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  opened_at timestamptz NOT NULL DEFAULT now(),
  closed_at timestamptz,
  opening_cash bigint NOT NULL,
  closing_cash bigint,
  expected_cash bigint,
  difference bigint,
  status text DEFAULT 'open',
  notes text
);

-- Sales table
CREATE TABLE IF NOT EXISTS sales (
  id bigserial PRIMARY KEY,
  receipt_no text UNIQUE NOT NULL,
  customer_id bigint REFERENCES customers(id) ON DELETE SET NULL,
  cashier_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  shift_id bigint REFERENCES cash_shifts(id) ON DELETE SET NULL,
  subtotal bigint NOT NULL,
  discount bigint DEFAULT 0,
  tax bigint DEFAULT 0,
  total bigint NOT NULL,
  payment_type payment_type NOT NULL,
  received_amount bigint DEFAULT 0,
  debt_amount bigint DEFAULT 0,
  change_amount bigint DEFAULT 0,
  status text DEFAULT 'completed',
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Sale items table
CREATE TABLE IF NOT EXISTS sale_items (
  id bigserial PRIMARY KEY,
  sale_id bigint REFERENCES sales(id) ON DELETE CASCADE,
  product_id bigint REFERENCES products(id) ON DELETE SET NULL,
  product_name text NOT NULL,
  qty numeric(10,2) NOT NULL,
  price bigint NOT NULL,
  discount bigint DEFAULT 0,
  tax bigint DEFAULT 0,
  total bigint NOT NULL
);

-- Payments table
CREATE TABLE IF NOT EXISTS payments (
  id bigserial PRIMARY KEY,
  sale_id bigint REFERENCES sales(id) ON DELETE CASCADE,
  method payment_type NOT NULL,
  amount bigint NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Returns table
CREATE TABLE IF NOT EXISTS returns (
  id bigserial PRIMARY KEY,
  return_no text UNIQUE NOT NULL,
  sale_id bigint REFERENCES sales(id) ON DELETE SET NULL,
  cashier_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  shift_id bigint REFERENCES cash_shifts(id) ON DELETE SET NULL,
  total_amount bigint NOT NULL,
  reason text,
  status text DEFAULT 'completed',
  created_at timestamptz DEFAULT now()
);

-- Return items table
CREATE TABLE IF NOT EXISTS return_items (
  id bigserial PRIMARY KEY,
  return_id bigint REFERENCES returns(id) ON DELETE CASCADE,
  sale_item_id bigint REFERENCES sale_items(id) ON DELETE SET NULL,
  product_id bigint REFERENCES products(id) ON DELETE SET NULL,
  product_name text NOT NULL,
  qty numeric(10,2) NOT NULL,
  price bigint NOT NULL,
  total bigint NOT NULL
);

-- Purchases table
CREATE TABLE IF NOT EXISTS purchases (
  id bigserial PRIMARY KEY,
  purchase_no text UNIQUE NOT NULL,
  supplier_id bigint REFERENCES suppliers(id) ON DELETE SET NULL,
  total bigint NOT NULL,
  status text DEFAULT 'completed',
  received_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Purchase items table
CREATE TABLE IF NOT EXISTS purchase_items (
  id bigserial PRIMARY KEY,
  purchase_id bigint REFERENCES purchases(id) ON DELETE CASCADE,
  product_id bigint REFERENCES products(id) ON DELETE SET NULL,
  product_name text NOT NULL,
  qty numeric(10,2) NOT NULL,
  cost_price bigint NOT NULL,
  total bigint NOT NULL
);

-- Stock moves table
CREATE TABLE IF NOT EXISTS stock_moves (
  id bigserial PRIMARY KEY,
  product_id bigint REFERENCES products(id) ON DELETE CASCADE,
  type stock_move_type NOT NULL,
  qty numeric(10,2) NOT NULL,
  ref_type text,
  ref_id bigint,
  notes text,
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

-- Cash collections table
CREATE TABLE IF NOT EXISTS cash_collections (
  id bigserial PRIMARY KEY,
  shift_id bigint REFERENCES cash_shifts(id) ON DELETE CASCADE,
  amount bigint NOT NULL,
  collected_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Settings table
CREATE TABLE IF NOT EXISTS settings (
  id bigserial PRIMARY KEY,
  key text UNIQUE NOT NULL,
  value text,
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX idx_products_barcode ON products(barcode);
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_sales_receipt_no ON sales(receipt_no);
CREATE INDEX idx_sales_customer ON sales(customer_id);
CREATE INDEX idx_sales_cashier ON sales(cashier_id);
CREATE INDEX idx_sales_shift ON sales(shift_id);
CREATE INDEX idx_sales_created_at ON sales(created_at);
CREATE INDEX idx_stock_moves_product ON stock_moves(product_id);
CREATE INDEX idx_cash_shifts_cashier ON cash_shifts(cashier_id);
CREATE INDEX idx_cash_shifts_status ON cash_shifts(status);

-- Trigger to handle new user registration
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  user_count int;
BEGIN
  -- Only insert into profiles after user is confirmed
  IF OLD IS DISTINCT FROM NULL AND OLD.confirmed_at IS NULL AND NEW.confirmed_at IS NOT NULL THEN
    -- Count existing users in profiles
    SELECT COUNT(*) INTO user_count FROM profiles;
    
    -- Extract username from email (before @)
    INSERT INTO profiles (id, username, full_name, role)
    VALUES (
      NEW.id,
      split_part(NEW.email, '@', 1),
      split_part(NEW.email, '@', 1),
      CASE WHEN user_count = 0 THEN 'admin'::user_role ELSE 'cashier'::user_role END
    );
  END IF;
  RETURN NEW;
END;
$$;

-- Bind trigger to auth.users table
DROP TRIGGER IF EXISTS on_auth_user_confirmed ON auth.users;
CREATE TRIGGER on_auth_user_confirmed
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Function to generate receipt number
CREATE OR REPLACE FUNCTION generate_receipt_no()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  next_id bigint;
  receipt_no text;
BEGIN
  SELECT COALESCE(MAX(id), 0) + 1 INTO next_id FROM sales;
  receipt_no := 'CHK-' || TO_CHAR(now(), 'YYYYMMDD') || '-' || LPAD(next_id::text, 6, '0');
  RETURN receipt_no;
END;
$$;

-- Function to generate return number
CREATE OR REPLACE FUNCTION generate_return_no()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  next_id bigint;
  return_no text;
BEGIN
  SELECT COALESCE(MAX(id), 0) + 1 INTO next_id FROM returns;
  return_no := 'RET-' || TO_CHAR(now(), 'YYYYMMDD') || '-' || LPAD(next_id::text, 6, '0');
  RETURN return_no;
END;
$$;

-- Function to generate purchase number
CREATE OR REPLACE FUNCTION generate_purchase_no()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  next_id bigint;
  purchase_no text;
BEGIN
  SELECT COALESCE(MAX(id), 0) + 1 INTO next_id FROM purchases;
  purchase_no := 'PUR-' || TO_CHAR(now(), 'YYYYMMDD') || '-' || LPAD(next_id::text, 6, '0');
  RETURN purchase_no;
END;
$$;

-- Function to update product stock
CREATE OR REPLACE FUNCTION update_product_stock()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.type = 'in' THEN
    UPDATE products SET stock = stock + NEW.qty WHERE id = NEW.product_id;
  ELSIF NEW.type = 'out' THEN
    UPDATE products SET stock = stock - NEW.qty WHERE id = NEW.product_id;
  ELSIF NEW.type = 'adjustment' THEN
    UPDATE products SET stock = NEW.qty WHERE id = NEW.product_id;
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger to automatically update stock on stock_moves insert
DROP TRIGGER IF EXISTS trigger_update_stock ON stock_moves;
CREATE TRIGGER trigger_update_stock
  AFTER INSERT ON stock_moves
  FOR EACH ROW
  EXECUTE FUNCTION update_product_stock();

-- Insert default settings
INSERT INTO settings (key, value) VALUES
  ('store_name', 'Supermarket'),
  ('store_address', 'Toshkent, O''zbekiston'),
  ('store_phone', '+998 90 123 45 67'),
  ('store_tin', '123456789'),
  ('tax_rate', '12'),
  ('currency', 'UZS'),
  ('receipt_footer', 'Rahmat! Yana keling!')
ON CONFLICT (key) DO NOTHING;
