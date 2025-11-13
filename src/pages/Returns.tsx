import { useState, useEffect } from 'react';
import { useAuth } from 'miaoda-auth-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { RotateCcw, Search, Eye, Plus, AlertCircle } from 'lucide-react';
import type { Sale, SaleItem, Return, ReturnItem, Profile } from '@/types/types';
import { 
  getSales, 
  getSaleByReceiptNo, 
  getSaleItems, 
  getReturns, 
  getReturnItems,
  createReturn,
  generateReturnNo,
  getProfiles,
  getProduct,
  updateProduct
} from '@/db/api';

interface ReturnItemInput {
  saleItemId: number;
  productId: number;
  productName: string;
  soldQty: number;
  returnQty: number;
  price: number;
  discount: number;
  tax: number;
  total: number;
  selected: boolean;
}

export default function Returns() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [returns, setReturns] = useState<Return[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedReturn, setSelectedReturn] = useState<Return | null>(null);
  const [returnItems, setReturnItems] = useState<ReturnItem[]>([]);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Yangi qaytarish yaratish uchun
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [receiptSearch, setReceiptSearch] = useState('');
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [saleItems, setSaleItems] = useState<SaleItem[]>([]);
  const [returnItemsInput, setReturnItemsInput] = useState<ReturnItemInput[]>([]);
  const [returnReason, setReturnReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [returnsData, profilesData] = await Promise.all([
        getReturns(1, 100),
        getProfiles(),
      ]);
      setReturns(returnsData);
      setProfiles(profilesData);
    } catch (error) {
      console.error('Ma\'lumotlarni yuklashda xato:', error);
      toast({
        title: 'Xato',
        description: 'Ma\'lumotlarni yuklashda xatolik yuz berdi',
        variant: 'destructive',
      });
    }
  };

  const handleViewDetails = async (returnRecord: Return) => {
    setIsLoading(true);
    try {
      const items = await getReturnItems(returnRecord.id);
      setReturnItems(items);
      setSelectedReturn(returnRecord);
      setIsDetailsOpen(true);
    } catch (error) {
      console.error('Qaytarish ma\'lumotlarini yuklashda xato:', error);
      toast({
        title: 'Xato',
        description: 'Qaytarish ma\'lumotlarini yuklashda xatolik yuz berdi',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchSale = async () => {
    if (!receiptSearch.trim()) {
      toast({
        title: 'Xato',
        description: 'Chek raqamini kiriting',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      const sale = await getSaleByReceiptNo(receiptSearch.trim());
      
      if (!sale) {
        toast({
          title: 'Topilmadi',
          description: 'Bunday chek raqami topilmadi',
          variant: 'destructive',
        });
        return;
      }

      if (sale.status === 'refunded') {
        toast({
          title: 'Xato',
          description: 'Bu sotuv allaqachon qaytarilgan',
          variant: 'destructive',
        });
        return;
      }

      const items = await getSaleItems(sale.id);
      
      setSelectedSale(sale);
      setSaleItems(items);
      
      // Qaytarish uchun mahsulotlar ro'yxatini tayyorlash
      const returnInputs: ReturnItemInput[] = items.map(item => ({
        saleItemId: item.id,
        productId: item.product_id,
        productName: item.product_name,
        soldQty: item.qty,
        returnQty: item.qty, // default: barcha miqdor
        price: item.price,
        discount: item.discount,
        tax: item.tax,
        total: item.total,
        selected: false,
      }));
      
      setReturnItemsInput(returnInputs);
    } catch (error) {
      console.error('Sotuvni qidirishda xato:', error);
      toast({
        title: 'Xato',
        description: 'Sotuvni qidirishda xatolik yuz berdi',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleItem = (index: number) => {
    const updated = [...returnItemsInput];
    updated[index].selected = !updated[index].selected;
    setReturnItemsInput(updated);
  };

  const handleQtyChange = (index: number, qty: number) => {
    const updated = [...returnItemsInput];
    const maxQty = updated[index].soldQty;
    
    if (qty < 0) qty = 0;
    if (qty > maxQty) qty = maxQty;
    
    updated[index].returnQty = qty;
    
    // Jami summani qayta hisoblash
    const unitPrice = updated[index].price / updated[index].soldQty;
    const unitDiscount = updated[index].discount / updated[index].soldQty;
    const unitTax = updated[index].tax / updated[index].soldQty;
    
    updated[index].total = Math.round((unitPrice - unitDiscount + unitTax) * qty);
    
    setReturnItemsInput(updated);
  };

  const calculateReturnTotal = () => {
    return returnItemsInput
      .filter(item => item.selected)
      .reduce((sum, item) => sum + item.total, 0);
  };

  const handleCreateReturn = async () => {
    if (!user || !selectedSale) return;

    const selectedItems = returnItemsInput.filter(item => item.selected);
    
    if (selectedItems.length === 0) {
      toast({
        title: 'Xato',
        description: 'Qaytariladigan mahsulotlarni tanlang',
        variant: 'destructive',
      });
      return;
    }

    if (!returnReason.trim()) {
      toast({
        title: 'Xato',
        description: 'Qaytarish sababini kiriting',
        variant: 'destructive',
      });
      return;
    }

    // Miqdorni tekshirish
    for (const item of selectedItems) {
      if (item.returnQty <= 0) {
        toast({
          title: 'Xato',
          description: `${item.productName}: qaytarish miqdori 0 dan katta bo'lishi kerak`,
          variant: 'destructive',
        });
        return;
      }
      if (item.returnQty > item.soldQty) {
        toast({
          title: 'Xato',
          description: `${item.productName}: qaytarish miqdori sotilgan miqdordan oshmasligi kerak`,
          variant: 'destructive',
        });
        return;
      }
    }

    setIsProcessing(true);

    try {
      const returnTotal = calculateReturnTotal();
      const returnNo = await generateReturnNo();
      
      const returnData = {
        return_no: returnNo,
        sale_id: selectedSale.id,
        cashier_id: user.id,
        shift_id: null,
        total_amount: returnTotal,
        reason: returnReason.trim(),
        status: 'completed' as const,
      };

      const returnItemsData = selectedItems.map(item => ({
        sale_item_id: item.saleItemId,
        product_id: item.productId,
        product_name: item.productName,
        qty: item.returnQty,
        price: Math.round(item.price / item.soldQty * item.returnQty),
        total: item.total,
      }));

      // Qaytarishni yaratish
      await createReturn(returnData, returnItemsData);

      // Ombor zaxirasini yangilash
      for (const item of selectedItems) {
        const product = await getProduct(item.productId);
        if (product) {
          await updateProduct(item.productId, {
            stock: product.stock + item.returnQty,
          });
        }
      }

      toast({
        title: 'Muvaffaqiyatli!',
        description: 'Qaytarish muvaffaqiyatli amalga oshirildi',
      });

      // Formani tozalash
      setIsCreateDialogOpen(false);
      setReceiptSearch('');
      setSelectedSale(null);
      setSaleItems([]);
      setReturnItemsInput([]);
      setReturnReason('');
      
      // Ma'lumotlarni yangilash
      loadData();
    } catch (error) {
      console.error('Qaytarish yaratishda xato:', error);
      toast({
        title: 'Xato',
        description: 'Qaytarish yaratishda xatolik yuz berdi',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const getCashierName = (cashierId: string) => {
    const profile = profiles.find(p => p.id === cashierId);
    return profile?.full_name || profile?.username || 'Noma\'lum';
  };

  const getPaymentTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      cash: 'Naqd',
      card: 'Karta',
      debt: 'Qarzdan',
    };
    return labels[type] || type;
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      completed: 'Yakunlangan',
      partial: 'Qisman',
      rejected: 'Bekor qilingan',
    };
    return labels[status] || status;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('uz-UZ', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const filterReturnsByDate = (returnRecord: Return) => {
    if (dateFilter === 'all') return true;
    
    const returnDate = new Date(returnRecord.created_at);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (dateFilter === 'today') {
      return returnDate >= today;
    } else if (dateFilter === 'week') {
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);
      return returnDate >= weekAgo;
    } else if (dateFilter === 'month') {
      const monthAgo = new Date(today);
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      return returnDate >= monthAgo;
    }
    return true;
  };

  const filteredReturns = returns.filter(returnRecord => {
    const matchesStatus = 
      statusFilter === 'all' || 
      returnRecord.status === statusFilter;
    
    const matchesDate = filterReturnsByDate(returnRecord);
    
    return matchesStatus && matchesDate;
  });

  // Statistika
  const todayReturns = returns.filter(r => {
    const returnDate = new Date(r.created_at);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return returnDate >= today && r.status === 'completed';
  });

  const todayTotal = todayReturns.reduce((sum, r) => sum + r.total_amount, 0);

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <RotateCcw className="w-8 h-8" />
          Qaytarishlar
        </h1>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Yangi qaytarish
        </Button>
      </div>

      {/* Statistika */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Bugungi qaytarishlar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-destructive">
              {(todayTotal / 100).toLocaleString()} so'm
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {todayReturns.length} ta qaytarish
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Jami qaytarishlar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-warning">
              {returns.length}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Barcha vaqt
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Jami summa
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-primary">
              {(returns.reduce((sum, r) => sum + r.total_amount, 0) / 100).toLocaleString()} so'm
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Barcha vaqt
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filtrlar */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Sana" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Barcha sanalar</SelectItem>
                <SelectItem value="today">Bugun</SelectItem>
                <SelectItem value="week">Oxirgi hafta</SelectItem>
                <SelectItem value="month">Oxirgi oy</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Holat" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Barcha holatlar</SelectItem>
                <SelectItem value="completed">Yakunlangan</SelectItem>
                <SelectItem value="partial">Qisman</SelectItem>
                <SelectItem value="rejected">Bekor qilingan</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Qaytarishlar jadvali */}
      <Card>
        <CardHeader>
          <CardTitle>
            Qaytarishlar ro'yxati ({filteredReturns.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredReturns.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <RotateCcw className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Qaytarishlar topilmadi</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-medium">ID</th>
                    <th className="text-left p-3 font-medium">Sana/Vaqt</th>
                    <th className="text-left p-3 font-medium">Kassir</th>
                    <th className="text-right p-3 font-medium">Summa</th>
                    <th className="text-center p-3 font-medium">Holat</th>
                    <th className="text-center p-3 font-medium">Amallar</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredReturns.map((returnRecord) => (
                    <tr key={returnRecord.id} className="border-b hover:bg-accent">
                      <td className="p-3">
                        <p className="font-medium">#{returnRecord.id}</p>
                      </td>
                      <td className="p-3 text-sm">
                        {formatDate(returnRecord.created_at)}
                      </td>
                      <td className="p-3 text-sm">
                        {getCashierName(returnRecord.cashier_id)}
                      </td>
                      <td className="p-3 text-right">
                        <p className="font-bold text-destructive">
                          {(returnRecord.total_amount / 100).toLocaleString()} so'm
                        </p>
                      </td>
                      <td className="p-3 text-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          returnRecord.status === 'completed'
                            ? 'bg-success/10 text-success'
                            : returnRecord.status === 'partial'
                            ? 'bg-warning/10 text-warning'
                            : 'bg-destructive/10 text-destructive'
                        }`}>
                          {getStatusLabel(returnRecord.status)}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleViewDetails(returnRecord)}
                            disabled={isLoading}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Yangi qaytarish yaratish dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Yangi qaytarish</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Chek qidirish */}
            {!selectedSale && (
              <div className="space-y-4">
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Chek raqamini kiriting..."
                      value={receiptSearch}
                      onChange={(e) => setReceiptSearch(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSearchSale()}
                      className="pl-10"
                    />
                  </div>
                  <Button onClick={handleSearchSale} disabled={isLoading}>
                    {isLoading ? 'Qidirilmoqda...' : 'Qidirish'}
                  </Button>
                </div>
                
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    Qaytarish uchun avval sotuvni toping
                  </p>
                </div>
              </div>
            )}

            {/* Sotuv ma'lumotlari va mahsulotlar */}
            {selectedSale && (
              <div className="space-y-6">
                {/* Sotuv ma'lumotlari */}
                <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                  <div>
                    <p className="text-sm text-muted-foreground">Chek raqami</p>
                    <p className="font-medium">{selectedSale.receipt_no}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Sana</p>
                    <p className="font-medium">{formatDate(selectedSale.created_at)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Jami summa</p>
                    <p className="font-medium">{(selectedSale.total / 100).toLocaleString()} so'm</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">To'lov turi</p>
                    <p className="font-medium">{getPaymentTypeLabel(selectedSale.payment_type)}</p>
                  </div>
                </div>

                {/* Mahsulotlar ro'yxati */}
                <div>
                  <h3 className="font-semibold mb-3">Qaytariladigan mahsulotlar</h3>
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-muted">
                        <tr>
                          <th className="text-left p-3 text-sm font-medium w-12"></th>
                          <th className="text-left p-3 text-sm font-medium">Mahsulot</th>
                          <th className="text-center p-3 text-sm font-medium">Sotilgan</th>
                          <th className="text-center p-3 text-sm font-medium">Qaytarish</th>
                          <th className="text-right p-3 text-sm font-medium">Narx</th>
                          <th className="text-right p-3 text-sm font-medium">Jami</th>
                        </tr>
                      </thead>
                      <tbody>
                        {returnItemsInput.map((item, index) => (
                          <tr key={index} className="border-t">
                            <td className="p-3">
                              <Checkbox
                                checked={item.selected}
                                onCheckedChange={() => handleToggleItem(index)}
                              />
                            </td>
                            <td className="p-3">{item.productName}</td>
                            <td className="p-3 text-center">{item.soldQty}</td>
                            <td className="p-3">
                              <Input
                                type="number"
                                min="0"
                                max={item.soldQty}
                                value={item.returnQty}
                                onChange={(e) => handleQtyChange(index, Number(e.target.value))}
                                disabled={!item.selected}
                                className="w-20 text-center"
                              />
                            </td>
                            <td className="p-3 text-right">
                              {(item.price / 100).toLocaleString()} so'm
                            </td>
                            <td className="p-3 text-right font-medium">
                              {(item.total / 100).toLocaleString()} so'm
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Qaytarish summasi */}
                <div className="p-4 bg-primary/5 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold">Qaytarish summasi:</span>
                    <span className="text-2xl font-bold text-destructive">
                      {(calculateReturnTotal() / 100).toLocaleString()} so'm
                    </span>
                  </div>
                </div>

                {/* Qaytarish sababi */}
                <div className="space-y-2">
                  <Label htmlFor="reason">Qaytarish sababi *</Label>
                  <Select value={returnReason} onValueChange={setReturnReason}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sababni tanlang" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Noto'g'ri mahsulot">Noto'g'ri mahsulot</SelectItem>
                      <SelectItem value="Buzilgan">Buzilgan</SelectItem>
                      <SelectItem value="Ortiqcha">Ortiqcha</SelectItem>
                      <SelectItem value="Mijoz fikrini o'zgartirdi">Mijoz fikrini o'zgartirdi</SelectItem>
                      <SelectItem value="Boshqa">Boshqa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Amallar */}
                <div className="flex gap-2 justify-end">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setSelectedSale(null);
                      setSaleItems([]);
                      setReturnItemsInput([]);
                      setReturnReason('');
                    }}
                  >
                    Bekor qilish
                  </Button>
                  <Button 
                    onClick={handleCreateReturn}
                    disabled={isProcessing || returnItemsInput.filter(i => i.selected).length === 0}
                  >
                    {isProcessing ? 'Yuklanmoqda...' : 'Qaytarishni tasdiqlash'}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Batafsil ko'rish dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Qaytarish tafsilotlari</DialogTitle>
          </DialogHeader>
          
          {selectedReturn && (
            <div className="space-y-6">
              {/* Asosiy ma'lumotlar */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Qaytarish ID</p>
                  <p className="font-medium">#{selectedReturn.id}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Sana/Vaqt</p>
                  <p className="font-medium">{formatDate(selectedReturn.created_at)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Kassir</p>
                  <p className="font-medium">{getCashierName(selectedReturn.cashier_id)}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-muted-foreground">Sabab</p>
                  <p className="font-medium">{selectedReturn.reason}</p>
                </div>
              </div>

              {/* Mahsulotlar ro'yxati */}
              <div>
                <h3 className="font-semibold mb-3">Qaytarilgan mahsulotlar</h3>
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-muted">
                      <tr>
                        <th className="text-left p-3 text-sm font-medium">Mahsulot</th>
                        <th className="text-center p-3 text-sm font-medium">Miqdor</th>
                        <th className="text-right p-3 text-sm font-medium">Narx</th>
                        <th className="text-right p-3 text-sm font-medium">Jami</th>
                      </tr>
                    </thead>
                    <tbody>
                      {returnItems.map((item) => (
                        <tr key={item.id} className="border-t">
                          <td className="p-3">{item.product_name}</td>
                          <td className="p-3 text-center">{item.qty}</td>
                          <td className="p-3 text-right">
                            {(item.price / 100).toLocaleString()} so'm
                          </td>
                          <td className="p-3 text-right font-medium">
                            {(item.total / 100).toLocaleString()} so'm
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Jami summa */}
              <div className="border-t pt-4">
                <div className="flex justify-between text-lg font-bold">
                  <span>Jami qaytarilgan:</span>
                  <span className="text-destructive">
                    {(selectedReturn.total_amount / 100).toLocaleString()} so'm
                  </span>
                </div>
              </div>

              {/* Amallar */}
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setIsDetailsOpen(false)}>
                  Yopish
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
