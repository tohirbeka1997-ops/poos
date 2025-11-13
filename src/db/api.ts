import { supabase } from './supabase';
import type {
  Profile,
  Category,
  Product,
  Customer,
  Supplier,
  Sale,
  SaleItem,
  Return,
  ReturnItem,
  Purchase,
  PurchaseItem,
  StockMove,
  CashShift,
  CashCollection,
  Setting,
  ProductWithCategory,
  SaleWithDetails,
} from '@/types/types';

// ============= Profiles =============
export const getProfiles = async (includeDeleted = false): Promise<Profile[]> => {
  let query = supabase
    .from('profiles')
    .select('*');
  
  // Filter out deleted users by default
  if (!includeDeleted) {
    query = query.eq('is_deleted', false);
  }
  
  query = query.order('created_at', { ascending: false });
  
  const { data, error } = await query;
  
  if (error) throw error;
  return Array.isArray(data) ? data : [];
};

export const getProfile = async (id: string): Promise<Profile | null> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  
  if (error) throw error;
  return data;
};

export const updateProfile = async (id: string, updates: Partial<Profile>): Promise<Profile | null> => {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', id)
    .select()
    .maybeSingle();
  
  if (error) throw error;
  return data;
};

export const deleteProfile = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('profiles')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
};

export const updateLastLogin = async (userId: string): Promise<void> => {
  const { error } = await supabase.rpc('update_last_login', { user_id: userId });
  if (error) throw error;
};

// ============= Categories =============
export const getCategories = async (): Promise<Category[]> => {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('name', { ascending: true });
  
  if (error) throw error;
  return Array.isArray(data) ? data : [];
};

export const createCategory = async (category: Omit<Category, 'id' | 'created_at'>): Promise<Category | null> => {
  const { data, error } = await supabase
    .from('categories')
    .insert(category)
    .select()
    .maybeSingle();
  
  if (error) throw error;
  return data;
};

export const updateCategory = async (id: number, updates: Partial<Category>): Promise<Category | null> => {
  const { data, error } = await supabase
    .from('categories')
    .update(updates)
    .eq('id', id)
    .select()
    .maybeSingle();
  
  if (error) throw error;
  return data;
};

export const deleteCategory = async (id: number): Promise<void> => {
  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
};

// ============= Products =============
export const getProducts = async (page = 1, limit = 50): Promise<ProductWithCategory[]> => {
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  
  const { data, error } = await supabase
    .from('products')
    .select('*, category:categories(*)')
    .order('id', { ascending: false })
    .range(from, to);
  
  if (error) throw error;
  return Array.isArray(data) ? data : [];
};

export const searchProducts = async (query: string): Promise<ProductWithCategory[]> => {
  const { data, error } = await supabase
    .from('products')
    .select('*, category:categories(*)')
    .or(`name.ilike.%${query}%,sku.ilike.%${query}%,barcode.eq.${query}`)
    .eq('is_active', true)
    .order('name', { ascending: true })
    .limit(20);
  
  if (error) throw error;
  return Array.isArray(data) ? data : [];
};

export const getProduct = async (id: number): Promise<ProductWithCategory | null> => {
  const { data, error } = await supabase
    .from('products')
    .select('*, category:categories(*)')
    .eq('id', id)
    .maybeSingle();
  
  if (error) throw error;
  return data;
};

export const createProduct = async (product: Omit<Product, 'id' | 'created_at' | 'updated_at'>): Promise<Product | null> => {
  const { data, error } = await supabase
    .from('products')
    .insert(product)
    .select()
    .maybeSingle();
  
  if (error) throw error;
  return data;
};

export const updateProduct = async (id: number, updates: Partial<Product>): Promise<Product | null> => {
  const { data, error } = await supabase
    .from('products')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .maybeSingle();
  
  if (error) throw error;
  return data;
};

export const deleteProduct = async (id: number): Promise<void> => {
  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
};

// ============= Customers =============
export const getCustomers = async (page = 1, limit = 50): Promise<Customer[]> => {
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .order('id', { ascending: false })
    .range(from, to);
  
  if (error) throw error;
  return Array.isArray(data) ? data : [];
};

export const searchCustomers = async (query: string): Promise<Customer[]> => {
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .or(`name.ilike.%${query}%,phone.ilike.%${query}%,code.eq.${query}`)
    .eq('is_active', true)
    .order('name', { ascending: true })
    .limit(20);
  
  if (error) throw error;
  return Array.isArray(data) ? data : [];
};

export const getCustomer = async (id: number): Promise<Customer | null> => {
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  
  if (error) throw error;
  return data;
};

export const createCustomer = async (customer: Omit<Customer, 'id' | 'created_at' | 'updated_at'>): Promise<Customer | null> => {
  const { data, error } = await supabase
    .from('customers')
    .insert(customer)
    .select()
    .maybeSingle();
  
  if (error) throw error;
  return data;
};

export const updateCustomer = async (id: number, updates: Partial<Customer>): Promise<Customer | null> => {
  const { data, error } = await supabase
    .from('customers')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .maybeSingle();
  
  if (error) throw error;
  return data;
};

export const deleteCustomer = async (id: number): Promise<void> => {
  const { error } = await supabase
    .from('customers')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
};

// ============= Suppliers =============
export const getSuppliers = async (): Promise<Supplier[]> => {
  const { data, error } = await supabase
    .from('suppliers')
    .select('*')
    .order('name', { ascending: true });
  
  if (error) throw error;
  return Array.isArray(data) ? data : [];
};

export const createSupplier = async (supplier: Omit<Supplier, 'id' | 'created_at'>): Promise<Supplier | null> => {
  const { data, error } = await supabase
    .from('suppliers')
    .insert(supplier)
    .select()
    .maybeSingle();
  
  if (error) throw error;
  return data;
};

export const updateSupplier = async (id: number, updates: Partial<Supplier>): Promise<Supplier | null> => {
  const { data, error } = await supabase
    .from('suppliers')
    .update(updates)
    .eq('id', id)
    .select()
    .maybeSingle();
  
  if (error) throw error;
  return data;
};

export const deleteSupplier = async (id: number): Promise<void> => {
  const { error } = await supabase
    .from('suppliers')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
};

// ============= Cash Shifts =============
export const getCashShifts = async (page = 1, limit = 50): Promise<CashShift[]> => {
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  
  const { data, error } = await supabase
    .from('cash_shifts')
    .select('*')
    .order('id', { ascending: false })
    .range(from, to);
  
  if (error) throw error;
  return Array.isArray(data) ? data : [];
};

export const getOpenShift = async (cashierId: string): Promise<CashShift | null> => {
  const { data, error } = await supabase
    .from('cash_shifts')
    .select('*')
    .eq('cashier_id', cashierId)
    .eq('status', 'open')
    .order('id', { ascending: false })
    .limit(1)
    .maybeSingle();
  
  if (error) throw error;
  return data;
};

export const openShift = async (cashierId: string, openingCash: number): Promise<CashShift | null> => {
  const { data, error } = await supabase
    .from('cash_shifts')
    .insert({
      cashier_id: cashierId,
      opening_cash: openingCash,
      status: 'open',
    })
    .select()
    .maybeSingle();
  
  if (error) throw error;
  return data;
};

export const closeShift = async (shiftId: number, closingCash: number, notes?: string): Promise<CashShift | null> => {
  const { data: shift } = await supabase
    .from('cash_shifts')
    .select('opening_cash')
    .eq('id', shiftId)
    .maybeSingle();
  
  const expectedCash = shift?.opening_cash || 0;
  const difference = closingCash - expectedCash;
  
  const { data, error } = await supabase
    .from('cash_shifts')
    .update({
      closed_at: new Date().toISOString(),
      closing_cash: closingCash,
      expected_cash: expectedCash,
      difference,
      status: 'closed',
      notes,
    })
    .eq('id', shiftId)
    .select()
    .maybeSingle();
  
  if (error) throw error;
  return data;
};

export const addCashCollection = async (collection: Omit<CashCollection, 'id' | 'created_at'>): Promise<CashCollection | null> => {
  const { data, error } = await supabase
    .from('cash_collections')
    .insert(collection)
    .select()
    .maybeSingle();
  
  if (error) throw error;
  return data;
};

// ============= Sales =============
export const generateReceiptNo = async (): Promise<string> => {
  const { data, error } = await supabase.rpc('generate_receipt_no');
  if (error) throw error;
  return data;
};

export const createSale = async (
  sale: Omit<Sale, 'id' | 'created_at'>,
  items: Omit<SaleItem, 'id' | 'sale_id'>[]
): Promise<Sale | null> => {
  // Sotuv yaratish
  const { data: saleData, error: saleError } = await supabase
    .from('sales')
    .insert(sale)
    .select()
    .maybeSingle();
  
  if (saleError) throw saleError;
  if (!saleData) return null;
  
  // Sotuv elementlarini qo'shish
  const saleItems = items.map(item => ({
    ...item,
    sale_id: saleData.id,
  }));
  
  const { error: itemsError } = await supabase
    .from('sale_items')
    .insert(saleItems);
  
  if (itemsError) throw itemsError;
  
  // Ombor harakatlarini yaratish
  const stockMoves = items.map(item => ({
    product_id: item.product_id,
    type: 'out' as const,
    qty: item.qty,
    ref_type: 'sale',
    ref_id: saleData.id,
    created_by: sale.cashier_id,
  }));
  
  const { error: stockError } = await supabase
    .from('stock_moves')
    .insert(stockMoves);
  
  if (stockError) throw stockError;
  
  // Agar qarzga bo'lsa, mijoz balansini yangilash
  if (sale.debt_amount > 0 && sale.customer_id) {
    const { data: customer } = await supabase
      .from('customers')
      .select('balance')
      .eq('id', sale.customer_id)
      .maybeSingle();
    
    await supabase
      .from('customers')
      .update({ balance: (customer?.balance || 0) - sale.debt_amount })
      .eq('id', sale.customer_id);
  }
  
  return saleData;
};

export const getSales = async (page = 1, limit = 50): Promise<SaleWithDetails[]> => {
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  
  const { data, error } = await supabase
    .from('sales')
    .select('*, customer:customers(*), cashier:profiles(*), items:sale_items(*)')
    .order('id', { ascending: false })
    .range(from, to);
  
  if (error) throw error;
  return Array.isArray(data) ? data : [];
};

export const getSale = async (id: number): Promise<SaleWithDetails | null> => {
  const { data, error } = await supabase
    .from('sales')
    .select('*, customer:customers(*), cashier:profiles(*), items:sale_items(*)')
    .eq('id', id)
    .maybeSingle();
  
  if (error) throw error;
  return data;
};

export const getSaleByReceiptNo = async (receiptNo: string): Promise<SaleWithDetails | null> => {
  const { data, error } = await supabase
    .from('sales')
    .select('*, customer:customers(*), cashier:profiles(*), items:sale_items(*)')
    .eq('receipt_no', receiptNo)
    .maybeSingle();
  
  if (error) throw error;
  return data;
};

export const getSaleItems = async (saleId: number): Promise<SaleItem[]> => {
  const { data, error } = await supabase
    .from('sale_items')
    .select('*')
    .eq('sale_id', saleId)
    .order('id', { ascending: true });
  
  if (error) throw error;
  return Array.isArray(data) ? data : [];
};

// ============= Returns =============
export const generateReturnNo = async (): Promise<string> => {
  const { data, error } = await supabase.rpc('generate_return_no');
  if (error) throw error;
  return data;
};

export const createReturn = async (
  returnData: Omit<Return, 'id' | 'created_at'>,
  items: Omit<ReturnItem, 'id' | 'return_id'>[]
): Promise<Return | null> => {
  // Qaytarish yaratish
  const { data: returnRecord, error: returnError } = await supabase
    .from('returns')
    .insert(returnData)
    .select()
    .maybeSingle();
  
  if (returnError) throw returnError;
  if (!returnRecord) return null;
  
  // Qaytarish elementlarini qo'shish
  const returnItems = items.map(item => ({
    ...item,
    return_id: returnRecord.id,
  }));
  
  const { error: itemsError } = await supabase
    .from('return_items')
    .insert(returnItems);
  
  if (itemsError) throw itemsError;
  
  // Ombor harakatlarini yaratish (qaytarish - zaxirani oshirish)
  const stockMoves = items.map(item => ({
    product_id: item.product_id,
    type: 'in' as const,
    qty: item.qty,
    ref_type: 'return',
    ref_id: returnRecord.id,
    created_by: returnData.cashier_id,
  }));
  
  const { error: stockError } = await supabase
    .from('stock_moves')
    .insert(stockMoves);
  
  if (stockError) throw stockError;
  
  return returnRecord;
};

export const getReturns = async (page = 1, limit = 50): Promise<Return[]> => {
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  
  const { data, error } = await supabase
    .from('returns')
    .select('*')
    .order('id', { ascending: false })
    .range(from, to);
  
  if (error) throw error;
  return Array.isArray(data) ? data : [];
};

export const getReturnItems = async (returnId: number): Promise<ReturnItem[]> => {
  const { data, error } = await supabase
    .from('return_items')
    .select('*')
    .eq('return_id', returnId)
    .order('id', { ascending: true });
  
  if (error) throw error;
  return Array.isArray(data) ? data : [];
};

// ============= Purchases =============
export const generatePurchaseNo = async (): Promise<string> => {
  const { data, error } = await supabase.rpc('generate_purchase_no');
  if (error) throw error;
  return data;
};

export const createPurchase = async (
  purchase: Omit<Purchase, 'id' | 'created_at'>,
  items: Omit<PurchaseItem, 'id' | 'purchase_id'>[]
): Promise<Purchase | null> => {
  // Xarid yaratish
  const { data: purchaseData, error: purchaseError } = await supabase
    .from('purchases')
    .insert(purchase)
    .select()
    .maybeSingle();
  
  if (purchaseError) throw purchaseError;
  if (!purchaseData) return null;
  
  // Xarid elementlarini qo'shish
  const purchaseItems = items.map(item => ({
    ...item,
    purchase_id: purchaseData.id,
  }));
  
  const { error: itemsError } = await supabase
    .from('purchase_items')
    .insert(purchaseItems);
  
  if (itemsError) throw itemsError;
  
  // Ombor harakatlarini yaratish
  const stockMoves = items.map(item => ({
    product_id: item.product_id,
    type: 'in' as const,
    qty: item.qty,
    ref_type: 'purchase',
    ref_id: purchaseData.id,
    created_by: purchase.received_by,
  }));
  
  const { error: stockError } = await supabase
    .from('stock_moves')
    .insert(stockMoves);
  
  if (stockError) throw stockError;
  
  return purchaseData;
};

export const getPurchases = async (page = 1, limit = 50): Promise<Purchase[]> => {
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  
  const { data, error } = await supabase
    .from('purchases')
    .select('*')
    .order('id', { ascending: false })
    .range(from, to);
  
  if (error) throw error;
  return Array.isArray(data) ? data : [];
};

export const getPurchaseItems = async (purchaseId: number): Promise<PurchaseItem[]> => {
  const { data, error } = await supabase
    .from('purchase_items')
    .select('*')
    .eq('purchase_id', purchaseId)
    .order('id', { ascending: true });
  
  if (error) throw error;
  return Array.isArray(data) ? data : [];
};

// ============= Stock Moves =============
export const getStockMoves = async (productId?: number, page = 1, limit = 50): Promise<StockMove[]> => {
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  
  let query = supabase
    .from('stock_moves')
    .select('*')
    .order('id', { ascending: false });
  
  if (productId) {
    query = query.eq('product_id', productId);
  }
  
  const { data, error } = await query.range(from, to);
  
  if (error) throw error;
  return Array.isArray(data) ? data : [];
};

export const createStockMove = async (move: Omit<StockMove, 'id' | 'created_at'>): Promise<StockMove | null> => {
  const { data, error } = await supabase
    .from('stock_moves')
    .insert(move)
    .select()
    .maybeSingle();
  
  if (error) throw error;
  return data;
};

// ============= Settings =============
export const getSettings = async (): Promise<Setting[]> => {
  const { data, error } = await supabase
    .from('settings')
    .select('*')
    .order('key', { ascending: true });
  
  if (error) throw error;
  return Array.isArray(data) ? data : [];
};

export const getSetting = async (key: string): Promise<Setting | null> => {
  const { data, error } = await supabase
    .from('settings')
    .select('*')
    .eq('key', key)
    .maybeSingle();
  
  if (error) throw error;
  return data;
};

export const updateSetting = async (key: string, value: string): Promise<Setting | null> => {
  const { data, error } = await supabase
    .from('settings')
    .upsert({ key, value, updated_at: new Date().toISOString() })
    .select()
    .maybeSingle();
  
  if (error) throw error;
  return data;
};
