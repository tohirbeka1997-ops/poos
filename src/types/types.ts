// Database types for Supermarket POS System

export type UserRole = 'admin' | 'manager' | 'cashier' | 'accountant';
export type PaymentType = 'cash' | 'card' | 'mobile' | 'partial' | 'debt';
export type StockMoveType = 'in' | 'out' | 'adjustment';

export interface Profile {
  id: string;
  username: string | null;
  full_name: string | null;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  last_login: string | null;
  created_by: string | null;
  discount_limit: number;
  is_deleted: boolean;
  deleted_at: string | null;
  deleted_by: string | null;
}

export interface Category {
  id: number;
  name: string;
  description: string | null;
  created_at: string;
}

export interface Product {
  id: number;
  name: string;
  sku: string | null;
  barcode: string | null;
  category_id: number | null;
  unit: string;
  sale_price: number;
  cost_price: number | null;
  tax_rate: number;
  stock: number;
  min_stock: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Customer {
  id: number;
  code: string | null;
  name: string;
  phone: string | null;
  address: string | null;
  balance: number;
  points: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Supplier {
  id: number;
  name: string;
  phone: string | null;
  address: string | null;
  is_active: boolean;
  created_at: string;
}

export interface CashShift {
  id: number;
  cashier_id: string | null;
  opened_at: string;
  closed_at: string | null;
  opening_cash: number;
  closing_cash: number | null;
  expected_cash: number | null;
  difference: number | null;
  status: string;
  notes: string | null;
}

export interface Sale {
  id: number;
  receipt_no: string;
  customer_id: number | null;
  cashier_id: string | null;
  shift_id: number | null;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  payment_type: PaymentType;
  received_amount: number;
  debt_amount: number;
  change_amount: number;
  status: string;
  notes: string | null;
  created_at: string;
}

export interface SaleItem {
  id: number;
  sale_id: number;
  product_id: number | null;
  product_name: string;
  qty: number;
  price: number;
  discount: number;
  tax: number;
  total: number;
}

export interface Payment {
  id: number;
  sale_id: number;
  method: PaymentType;
  amount: number;
  created_at: string;
}

export interface Return {
  id: number;
  return_no: string;
  sale_id: number | null;
  cashier_id: string | null;
  shift_id: number | null;
  total_amount: number;
  reason: string | null;
  status: string;
  created_at: string;
}

export interface ReturnItem {
  id: number;
  return_id: number;
  sale_item_id: number | null;
  product_id: number | null;
  product_name: string;
  qty: number;
  price: number;
  total: number;
}

export interface Purchase {
  id: number;
  purchase_no: string;
  supplier_id: number | null;
  total: number;
  status: string;
  received_by: string | null;
  notes: string | null;
  created_at: string;
}

export interface PurchaseItem {
  id: number;
  purchase_id: number;
  product_id: number | null;
  product_name: string;
  qty: number;
  cost_price: number;
  total: number;
}

export interface StockMove {
  id: number;
  product_id: number;
  type: StockMoveType;
  qty: number;
  ref_type: string | null;
  ref_id: number | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
}

export interface CashCollection {
  id: number;
  shift_id: number;
  amount: number;
  collected_by: string | null;
  notes: string | null;
  created_at: string;
}

export interface Setting {
  id: number;
  key: string;
  value: string | null;
  updated_at: string;
}

// Extended types with relations
export interface ProductWithCategory extends Product {
  category?: Category;
}

export interface SaleWithDetails extends Sale {
  customer?: Customer;
  cashier?: Profile;
  items?: SaleItem[];
}

export interface ReturnWithDetails extends Return {
  sale?: Sale;
  cashier?: Profile;
  items?: ReturnItem[];
}

export interface PurchaseWithDetails extends Purchase {
  supplier?: Supplier;
  received_by_profile?: Profile;
  items?: PurchaseItem[];
}

export interface CashShiftWithCashier extends CashShift {
  cashier?: Profile;
}

// Cart item for POS
export interface CartItem {
  product: Product;
  qty: number;
  discount: number;
  tax: number;
  total: number;
}
