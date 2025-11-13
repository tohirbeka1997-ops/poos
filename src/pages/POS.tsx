import { useState, useEffect } from 'react';
import { useAuth } from 'miaoda-auth-react';
import { supabase } from '@/db/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Search, Plus, Minus, Trash2, ShoppingCart, User, DollarSign } from 'lucide-react';
import type { Product, Customer, CartItem, CashShift, PaymentType } from '@/types/types';
import { searchProducts, searchCustomers, generateReceiptNo, createSale, getOpenShift } from '@/db/api';

export default function POS() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerSearch, setCustomerSearch] = useState('');
  const [paymentType, setPaymentType] = useState<PaymentType>('cash');
  const [receivedAmount, setReceivedAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentShift, setCurrentShift] = useState<CashShift | null>(null);
  const [isCustomerDialogOpen, setIsCustomerDialogOpen] = useState(false);

  useEffect(() => {
    loadCurrentShift();
  }, [user]);

  useEffect(() => {
    if (searchQuery.length >= 2) {
      handleSearchProducts();
    } else {
      setProducts([]);
    }
  }, [searchQuery]);

  useEffect(() => {
    if (customerSearch.length >= 2) {
      handleSearchCustomers();
    } else {
      setCustomers([]);
    }
  }, [customerSearch]);

  const loadCurrentShift = async () => {
    if (!user) return;
    
    try {
      const shift = await getOpenShift(user.id);
      setCurrentShift(shift);
      
      if (!shift) {
        toast({
          title: 'Ogohlantirish',
          description: 'Iltimos, avval kassani oching',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Shift yuklashda xato:', error);
    }
  };

  const handleSearchProducts = async () => {
    try {
      const results = await searchProducts(searchQuery);
      setProducts(results);
    } catch (error) {
      console.error('Mahsulot qidirishda xato:', error);
    }
  };

  const handleSearchCustomers = async () => {
    try {
      const results = await searchCustomers(customerSearch);
      setCustomers(results);
    } catch (error) {
      console.error('Mijoz qidirishda xato:', error);
    }
  };

  const addToCart = (product: Product) => {
    if (product.stock <= 0) {
      toast({
        title: 'Xato',
        description: 'Mahsulot omborda yo\'q',
        variant: 'destructive',
      });
      return;
    }

    const existingItem = cart.find(item => item.product.id === product.id);
    
    if (existingItem) {
      if (existingItem.qty + 1 > product.stock) {
        toast({
          title: 'Xato',
          description: 'Omborda yetarli mahsulot yo\'q',
          variant: 'destructive',
        });
        return;
      }
      updateCartItemQty(product.id, existingItem.qty + 1);
    } else {
      const newItem: CartItem = {
        product,
        qty: 1,
        discount: 0,
        tax: Math.round((product.sale_price * product.tax_rate) / 100),
        total: product.sale_price + Math.round((product.sale_price * product.tax_rate) / 100),
      };
      setCart([...cart, newItem]);
    }
    
    setSearchQuery('');
    setProducts([]);
  };

  const updateCartItemQty = (productId: number, newQty: number) => {
    if (newQty <= 0) {
      removeFromCart(productId);
      return;
    }

    setCart(cart.map(item => {
      if (item.product.id === productId) {
        if (newQty > item.product.stock) {
          toast({
            title: 'Xato',
            description: 'Omborda yetarli mahsulot yo\'q',
            variant: 'destructive',
          });
          return item;
        }
        const tax = Math.round((item.product.sale_price * item.product.tax_rate * newQty) / 100);
        return {
          ...item,
          qty: newQty,
          tax,
          total: (item.product.sale_price * newQty) + tax - item.discount,
        };
      }
      return item;
    }));
  };

  const updateCartItemDiscount = (productId: number, discount: number) => {
    setCart(cart.map(item => {
      if (item.product.id === productId) {
        const subtotal = item.product.sale_price * item.qty;
        if (discount > subtotal) {
          toast({
            title: 'Xato',
            description: 'Chegirma mahsulot narxidan oshib ketdi',
            variant: 'destructive',
          });
          return item;
        }
        return {
          ...item,
          discount,
          total: subtotal + item.tax - discount,
        };
      }
      return item;
    }));
  };

  const removeFromCart = (productId: number) => {
    setCart(cart.filter(item => item.product.id !== productId));
  };

  const calculateTotals = () => {
    const subtotal = cart.reduce((sum, item) => sum + (item.product.sale_price * item.qty), 0);
    const discount = cart.reduce((sum, item) => sum + item.discount, 0);
    const tax = cart.reduce((sum, item) => sum + item.tax, 0);
    const total = subtotal + tax - discount;
    
    return { subtotal, discount, tax, total };
  };

  const handleCompleteSale = async () => {
    if (!user || !currentShift) {
      toast({
        title: 'Xato',
        description: 'Iltimos, avval kassani oching',
        variant: 'destructive',
      });
      return;
    }

    if (cart.length === 0) {
      toast({
        title: 'Xato',
        description: 'Savat bo\'sh',
        variant: 'destructive',
      });
      return;
    }

    // Har bir mahsulot uchun zaxira va miqdorni tekshirish
    for (const item of cart) {
      if (item.qty < 1) {
        toast({
          title: 'Xato',
          description: `${item.product.name}: miqdor 1 dan kam bo'lmasin`,
          variant: 'destructive',
        });
        return;
      }
      if (item.qty > item.product.stock) {
        toast({
          title: 'Xato',
          description: `${item.product.name}: omborda yetarli mahsulot yo'q`,
          variant: 'destructive',
        });
        return;
      }
    }

    const { total } = calculateTotals();
    
    // Qabul qilingan summani so'm birlikda olish (tiyin emas!)
    const receivedSom = Number(receivedAmount) || 0;
    const totalSom = total / 100; // tiyindan so'mga o'tkazish

    // Qisman/Qarzga uchun mijoz majburiy
    if ((paymentType === 'partial' || paymentType === 'debt') && !selectedCustomer) {
      toast({
        title: 'Xato',
        description: 'Qisman/Qarzga uchun mijoz tanlang',
        variant: 'destructive',
      });
      return;
    }

    // Naqd/Karta/Mobil uchun to'liq to'lov talab qilinadi
    if (paymentType === 'cash' || paymentType === 'card' || paymentType === 'mobile') {
      if (receivedSom < totalSom) {
        toast({
          title: 'Xato',
          description: `Qabul qilingan summa yetarli emas. Kerak: ${totalSom.toLocaleString()} so'm, Kiritilgan: ${receivedSom.toLocaleString()} so'm`,
          variant: 'destructive',
        });
        return;
      }
    }

    setIsProcessing(true);

    try {
      const receiptNo = await generateReceiptNo();
      const { subtotal, discount, tax, total } = calculateTotals();
      
      // So'mda hisoblash
      const receivedSom = Number(receivedAmount) || 0;
      const totalSom = total / 100;
      
      let debtAmount = 0;
      let changeAmount = 0;
      
      if (paymentType === 'debt') {
        // Qarzga: barcha summa qarz
        debtAmount = total;
      } else if (paymentType === 'partial') {
        // Qisman: farq qarz
        debtAmount = Math.max(total - (receivedSom * 100), 0);
      } else {
        // Naqd/Karta/Mobil: qaytim hisoblash
        changeAmount = Math.max((receivedSom * 100) - total, 0);
      }

      const saleData = {
        receipt_no: receiptNo,
        customer_id: selectedCustomer?.id || null,
        cashier_id: user.id,
        shift_id: currentShift.id,
        subtotal,
        discount,
        tax,
        total,
        payment_type: paymentType,
        received_amount: receivedSom * 100, // so'mdan tiyinga
        debt_amount: debtAmount,
        change_amount: changeAmount,
        status: 'completed',
        notes: null,
      };

      const saleItems = cart.map(item => ({
        product_id: item.product.id,
        product_name: item.product.name,
        qty: item.qty,
        price: item.product.sale_price,
        discount: item.discount,
        tax: item.tax,
        total: item.total,
      }));

      await createSale(saleData, saleItems);

      toast({
        title: 'Muvaffaqiyatli!',
        description: `To'lov qabul qilindi. Chek №${receiptNo}`,
      });

      // Savatni tozalash
      setCart([]);
      setSelectedCustomer(null);
      setReceivedAmount('');
      setPaymentType('cash');
    } catch (error) {
      console.error('Sotuv yaratishda xato:', error);
      toast({
        title: 'Xato',
        description: 'To\'lovni amalga oshirishda xatolik',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const { subtotal, discount, tax, total } = calculateTotals();

  if (!currentShift) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-12 text-center">
            <h2 className="text-2xl font-bold mb-4">Kassa ochilmagan</h2>
            <p className="text-muted-foreground mb-6">
              Sotuvni boshlash uchun avval kassani ochishingiz kerak
            </p>
            <Button onClick={() => window.location.href = '/shifts'}>
              Kassaga o'tish
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-7xl">
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Mahsulot qidirish va savat */}
        <div className="xl:col-span-2 space-y-4">
          {/* Qidiruv */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="w-5 h-5" />
                Mahsulot qidirish
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <Input
                  placeholder="Mahsulot nomi, shtrix-kod yoki SKU..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pr-10"
                />
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              </div>
              
              {products.length > 0 && (
                <div className="mt-4 border rounded-lg divide-y max-h-64 overflow-y-auto">
                  {products.map((product) => (
                    <div
                      key={product.id}
                      className="p-3 hover:bg-accent cursor-pointer flex justify-between items-center"
                      onClick={() => addToCart(product)}
                    >
                      <div>
                        <p className="font-medium">{product.name}</p>
                        <p className="text-sm text-muted-foreground">
                          Zaxira: {product.stock} {product.unit}
                        </p>
                      </div>
                      <p className="font-bold">{(product.sale_price / 100).toLocaleString()} so'm</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Savat */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5" />
                Savat ({cart.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {cart.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <ShoppingCart className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Savat bo'sh</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {cart.map((item) => (
                    <div key={item.product.id} className="border rounded-lg p-3">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <p className="font-medium">{item.product.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {(item.product.sale_price / 100).toLocaleString()} so'm × {item.qty}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeFromCart(item.product.id)}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                      
                      <div className="flex items-center gap-2 mb-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => updateCartItemQty(item.product.id, item.qty - 1)}
                        >
                          <Minus className="w-4 h-4" />
                        </Button>
                        <Input
                          type="number"
                          value={item.qty}
                          onChange={(e) => updateCartItemQty(item.product.id, Number(e.target.value))}
                          className="w-20 text-center"
                          min="1"
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => updateCartItemQty(item.product.id, item.qty + 1)}
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                        
                        <Input
                          type="number"
                          placeholder="Chegirma"
                          value={item.discount / 100}
                          onChange={(e) => updateCartItemDiscount(item.product.id, Number(e.target.value) * 100)}
                          className="w-32"
                        />
                        
                        <div className="ml-auto text-right">
                          <p className="font-bold">{(item.total / 100).toLocaleString()} so'm</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* To'lov paneli */}
        <div className="space-y-4">
          {/* Mijoz tanlash */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Mijoz
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedCustomer ? (
                <div className="flex justify-between items-center p-3 bg-accent rounded-lg">
                  <div>
                    <p className="font-medium">{selectedCustomer.name}</p>
                    <p className="text-sm text-muted-foreground">{selectedCustomer.phone}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedCustomer(null)}
                  >
                    O'chirish
                  </Button>
                </div>
              ) : (
                <Dialog open={isCustomerDialogOpen} onOpenChange={setIsCustomerDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full">
                      Mijoz tanlash
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Mijoz tanlash</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <Input
                        placeholder="Mijoz nomi yoki telefon..."
                        value={customerSearch}
                        onChange={(e) => setCustomerSearch(e.target.value)}
                      />
                      {customers.length > 0 && (
                        <div className="border rounded-lg divide-y max-h-64 overflow-y-auto">
                          {customers.map((customer) => (
                            <div
                              key={customer.id}
                              className="p-3 hover:bg-accent cursor-pointer"
                              onClick={() => {
                                setSelectedCustomer(customer);
                                setIsCustomerDialogOpen(false);
                                setCustomerSearch('');
                              }}
                            >
                              <p className="font-medium">{customer.name}</p>
                              <p className="text-sm text-muted-foreground">{customer.phone}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </CardContent>
          </Card>

          {/* Jami */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Jami
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Jami:</span>
                <span className="font-medium">{(subtotal / 100).toLocaleString()} so'm</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Chegirma:</span>
                <span className="font-medium text-destructive">-{(discount / 100).toLocaleString()} so'm</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Soliq:</span>
                <span className="font-medium">{(tax / 100).toLocaleString()} so'm</span>
              </div>
              <div className="border-t pt-3 flex justify-between">
                <span className="font-bold text-lg">Umumiy:</span>
                <span className="font-bold text-lg text-primary">{(total / 100).toLocaleString()} so'm</span>
              </div>
            </CardContent>
          </Card>

          {/* To'lov */}
          <Card>
            <CardHeader>
              <CardTitle>To'lov turi</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select value={paymentType} onValueChange={(value) => setPaymentType(value as PaymentType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Naqd</SelectItem>
                  <SelectItem value="card">Karta</SelectItem>
                  <SelectItem value="mobile">Mobil</SelectItem>
                  <SelectItem value="partial">Qisman</SelectItem>
                  <SelectItem value="debt">Qarzga</SelectItem>
                </SelectContent>
              </Select>

              {paymentType !== 'debt' && (
                <div>
                  <label className="text-sm font-medium mb-2 block">Qabul qilingan summa</label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={receivedAmount}
                    onChange={(e) => setReceivedAmount(e.target.value)}
                  />
                </div>
              )}

              {paymentType !== 'debt' && receivedAmount && Number(receivedAmount) * 100 > total && (
                <div className="p-3 bg-success/10 rounded-lg">
                  <p className="text-sm font-medium">Qaytim:</p>
                  <p className="text-lg font-bold text-success">
                    {((Number(receivedAmount) * 100 - total) / 100).toLocaleString()} so'm
                  </p>
                </div>
              )}

              <Button
                className="w-full"
                size="lg"
                onClick={handleCompleteSale}
                disabled={isProcessing || cart.length === 0}
              >
                {isProcessing ? 'Yuklanmoqda...' : 'Sotuvni yakunlash'}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
