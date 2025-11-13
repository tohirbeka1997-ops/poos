import { useState, useEffect } from 'react';
import { useAuth } from 'miaoda-auth-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { ShoppingCart, Plus, Eye, Search, Trash2 } from 'lucide-react';
import type { Purchase, PurchaseItem, Supplier, Product, Profile } from '@/types/types';
import { 
  getPurchases,
  getPurchaseItems,
  createPurchase,
  generatePurchaseNo,
  getSuppliers,
  createSupplier,
  getProducts,
  getProduct,
  updateProduct,
  getProfiles
} from '@/db/api';

interface PurchaseItemInput {
  productId: number;
  productName: string;
  qty: number;
  costPrice: number;
  total: number;
}

export default function Purchases() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [dateFilter, setDateFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [supplierFilter, setSupplierFilter] = useState('all');
  const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(null);
  const [purchaseItems, setPurchaseItems] = useState<PurchaseItem[]>([]);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Yangi xarid yaratish uchun
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedSupplierId, setSelectedSupplierId] = useState<number | null>(null);
  const [purchaseItemsInput, setPurchaseItemsInput] = useState<PurchaseItemInput[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [purchaseNotes, setPurchaseNotes] = useState('');

  // Yangi ta'minotchi yaratish
  const [isSupplierDialogOpen, setIsSupplierDialogOpen] = useState(false);
  const [newSupplierName, setNewSupplierName] = useState('');
  const [newSupplierPhone, setNewSupplierPhone] = useState('');
  const [newSupplierAddress, setNewSupplierAddress] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [purchasesData, suppliersData, productsData, profilesData] = await Promise.all([
        getPurchases(1, 100),
        getSuppliers(),
        getProducts(1, 1000),
        getProfiles(),
      ]);
      setPurchases(purchasesData);
      setSuppliers(suppliersData);
      setProducts(productsData);
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

  const handleViewDetails = async (purchase: Purchase) => {
    setIsLoading(true);
    try {
      const items = await getPurchaseItems(purchase.id);
      setPurchaseItems(items);
      setSelectedPurchase(purchase);
      setIsDetailsOpen(true);
    } catch (error) {
      console.error('Xarid ma\'lumotlarini yuklashda xato:', error);
      toast({
        title: 'Xato',
        description: 'Xarid ma\'lumotlarini yuklashda xatolik yuz berdi',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchProduct = (query: string) => {
    setProductSearch(query);
    if (query.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    const filtered = products.filter(p => 
      p.name.toLowerCase().includes(query.toLowerCase()) ||
      p.sku?.toLowerCase().includes(query.toLowerCase()) ||
      p.barcode?.toLowerCase().includes(query.toLowerCase())
    );
    setSearchResults(filtered.slice(0, 10));
  };

  const handleAddProduct = (product: Product) => {
    // Mahsulot allaqachon qo'shilganmi tekshirish
    const existing = purchaseItemsInput.find(item => item.productId === product.id);
    if (existing) {
      toast({
        title: 'Ogohlantirish',
        description: 'Bu mahsulot allaqachon qo\'shilgan',
        variant: 'destructive',
      });
      return;
    }

    const newItem: PurchaseItemInput = {
      productId: product.id,
      productName: product.name,
      qty: 1,
      costPrice: product.cost_price || 0,
      total: product.cost_price || 0,
    };

    setPurchaseItemsInput([...purchaseItemsInput, newItem]);
    setProductSearch('');
    setSearchResults([]);
  };

  const handleUpdateItem = (index: number, field: keyof PurchaseItemInput, value: number) => {
    const updated = [...purchaseItemsInput];
    updated[index] = { ...updated[index], [field]: value };
    
    // Jami summani qayta hisoblash
    if (field === 'qty' || field === 'costPrice') {
      updated[index].total = updated[index].qty * updated[index].costPrice;
    }
    
    setPurchaseItemsInput(updated);
  };

  const handleRemoveItem = (index: number) => {
    const updated = purchaseItemsInput.filter((_, i) => i !== index);
    setPurchaseItemsInput(updated);
  };

  const calculateTotal = () => {
    return purchaseItemsInput.reduce((sum, item) => sum + item.total, 0);
  };

  const handleCreateSupplier = async () => {
    if (!newSupplierName.trim()) {
      toast({
        title: 'Xato',
        description: 'Ta\'minotchi nomini kiriting',
        variant: 'destructive',
      });
      return;
    }

    try {
      const supplier = await createSupplier({
        name: newSupplierName.trim(),
        phone: newSupplierPhone.trim() || null,
        address: newSupplierAddress.trim() || null,
        is_active: true,
      });

      if (supplier) {
        setSuppliers([...suppliers, supplier]);
        setSelectedSupplierId(supplier.id);
        setIsSupplierDialogOpen(false);
        setNewSupplierName('');
        setNewSupplierPhone('');
        setNewSupplierAddress('');
        
        toast({
          title: 'Muvaffaqiyatli!',
          description: 'Ta\'minotchi muvaffaqiyatli qo\'shildi',
        });
      }
    } catch (error) {
      console.error('Ta\'minotchi yaratishda xato:', error);
      toast({
        title: 'Xato',
        description: 'Ta\'minotchi yaratishda xatolik yuz berdi',
        variant: 'destructive',
      });
    }
  };

  const handleCreatePurchase = async () => {
    if (!user) return;

    if (!selectedSupplierId) {
      toast({
        title: 'Xato',
        description: 'Ta\'minotchini tanlang',
        variant: 'destructive',
      });
      return;
    }

    if (purchaseItemsInput.length === 0) {
      toast({
        title: 'Xato',
        description: 'Kamida bitta mahsulot qo\'shing',
        variant: 'destructive',
      });
      return;
    }

    // Validatsiya
    for (const item of purchaseItemsInput) {
      if (item.qty < 1) {
        toast({
          title: 'Xato',
          description: `${item.productName}: miqdor 1 dan katta bo\'lishi kerak`,
          variant: 'destructive',
        });
        return;
      }
      if (item.costPrice <= 0) {
        toast({
          title: 'Xato',
          description: `${item.productName}: xarid narxi 0 dan katta bo\'lishi kerak`,
          variant: 'destructive',
        });
        return;
      }
    }

    setIsProcessing(true);

    try {
      const purchaseNo = await generatePurchaseNo();
      const total = calculateTotal();
      
      const purchaseData = {
        purchase_no: purchaseNo,
        supplier_id: selectedSupplierId,
        total,
        status: 'completed',
        received_by: user.id,
        notes: purchaseNotes.trim() || null,
      };

      const purchaseItemsData = purchaseItemsInput.map(item => ({
        product_id: item.productId,
        product_name: item.productName,
        qty: item.qty,
        cost_price: item.costPrice,
        total: item.total,
      }));

      // Xaridni yaratish
      await createPurchase(purchaseData, purchaseItemsData);

      // Mahsulot narxlarini yangilash
      for (const item of purchaseItemsInput) {
        const product = await getProduct(item.productId);
        if (product) {
          await updateProduct(item.productId, {
            stock: product.stock + item.qty,
            cost_price: item.costPrice,
          });
        }
      }

      toast({
        title: 'Muvaffaqiyatli!',
        description: 'Xarid muvaffaqiyatli saqlandi',
      });

      // Formani tozalash
      setIsCreateDialogOpen(false);
      setSelectedSupplierId(null);
      setPurchaseItemsInput([]);
      setPurchaseNotes('');
      setProductSearch('');
      setSearchResults([]);
      
      // Ma'lumotlarni yangilash
      loadData();
    } catch (error) {
      console.error('Xarid yaratishda xato:', error);
      toast({
        title: 'Xato',
        description: 'Xarid yaratishda xatolik yuz berdi',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const getSupplierName = (supplierId: number | null) => {
    if (!supplierId) return 'Noma\'lum';
    const supplier = suppliers.find(s => s.id === supplierId);
    return supplier?.name || 'Noma\'lum';
  };

  const getUserName = (userId: string | null) => {
    if (!userId) return 'Noma\'lum';
    const profile = profiles.find(p => p.id === userId);
    return profile?.full_name || profile?.username || 'Noma\'lum';
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      completed: 'Yakunlangan',
      pending: 'Kutilmoqda',
      cancelled: 'Bekor qilingan',
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

  const filterPurchasesByDate = (purchase: Purchase) => {
    if (dateFilter === 'all') return true;
    
    const purchaseDate = new Date(purchase.created_at);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (dateFilter === 'today') {
      return purchaseDate >= today;
    } else if (dateFilter === 'week') {
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);
      return purchaseDate >= weekAgo;
    } else if (dateFilter === 'month') {
      const monthAgo = new Date(today);
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      return purchaseDate >= monthAgo;
    }
    return true;
  };

  const filteredPurchases = purchases.filter(purchase => {
    const matchesStatus = 
      statusFilter === 'all' || 
      purchase.status === statusFilter;
    
    const matchesSupplier = 
      supplierFilter === 'all' || 
      purchase.supplier_id?.toString() === supplierFilter;
    
    const matchesDate = filterPurchasesByDate(purchase);
    
    return matchesStatus && matchesSupplier && matchesDate;
  });

  // Statistika
  const todayPurchases = purchases.filter(p => {
    const purchaseDate = new Date(p.created_at);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return purchaseDate >= today && p.status === 'completed';
  });

  const todayTotal = todayPurchases.reduce((sum, p) => sum + p.total, 0);

  const monthPurchases = purchases.filter(p => {
    const purchaseDate = new Date(p.created_at);
    const today = new Date();
    const monthAgo = new Date(today);
    monthAgo.setMonth(monthAgo.getMonth() - 1);
    return purchaseDate >= monthAgo && p.status === 'completed';
  });

  const monthTotal = monthPurchases.reduce((sum, p) => sum + p.total, 0);

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <ShoppingCart className="w-8 h-8" />
          Xaridlar
        </h1>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Yangi xarid
        </Button>
      </div>

      {/* Statistika */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Bugungi xaridlar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-primary">
              {(todayTotal / 100).toLocaleString()} so'm
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {todayPurchases.length} ta xarid
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Oylik xaridlar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-success">
              {(monthTotal / 100).toLocaleString()} so'm
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {monthPurchases.length} ta xarid
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Jami xaridlar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-warning">
              {purchases.length}
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

            <Select value={supplierFilter} onValueChange={setSupplierFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Ta'minotchi" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Barcha ta'minotchilar</SelectItem>
                {suppliers.map(supplier => (
                  <SelectItem key={supplier.id} value={supplier.id.toString()}>
                    {supplier.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Holat" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Barcha holatlar</SelectItem>
                <SelectItem value="completed">Yakunlangan</SelectItem>
                <SelectItem value="pending">Kutilmoqda</SelectItem>
                <SelectItem value="cancelled">Bekor qilingan</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Xaridlar jadvali */}
      <Card>
        <CardHeader>
          <CardTitle>
            Xaridlar ro'yxati ({filteredPurchases.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredPurchases.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <ShoppingCart className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Xaridlar topilmadi</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-medium">Xarid №</th>
                    <th className="text-left p-3 font-medium">Sana/Vaqt</th>
                    <th className="text-left p-3 font-medium">Ta'minotchi</th>
                    <th className="text-right p-3 font-medium">Summa</th>
                    <th className="text-center p-3 font-medium">Holat</th>
                    <th className="text-center p-3 font-medium">Amallar</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPurchases.map((purchase) => (
                    <tr key={purchase.id} className="border-b hover:bg-accent">
                      <td className="p-3">
                        <p className="font-medium">{purchase.purchase_no}</p>
                      </td>
                      <td className="p-3 text-sm">
                        {formatDate(purchase.created_at)}
                      </td>
                      <td className="p-3 text-sm">
                        {getSupplierName(purchase.supplier_id)}
                      </td>
                      <td className="p-3 text-right">
                        <p className="font-bold text-primary">
                          {(purchase.total / 100).toLocaleString()} so'm
                        </p>
                      </td>
                      <td className="p-3 text-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          purchase.status === 'completed'
                            ? 'bg-success/10 text-success'
                            : purchase.status === 'pending'
                            ? 'bg-warning/10 text-warning'
                            : 'bg-destructive/10 text-destructive'
                        }`}>
                          {getStatusLabel(purchase.status)}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleViewDetails(purchase)}
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

      {/* Yangi xarid yaratish dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Yangi xarid</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Ta'minotchi tanlash */}
            <div className="space-y-2">
              <Label>Ta'minotchi *</Label>
              <div className="flex gap-2">
                <Select 
                  value={selectedSupplierId?.toString() || ''} 
                  onValueChange={(v) => setSelectedSupplierId(Number(v))}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Ta'minotchini tanlang" />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers.map(supplier => (
                      <SelectItem key={supplier.id} value={supplier.id.toString()}>
                        {supplier.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button 
                  variant="outline" 
                  onClick={() => setIsSupplierDialogOpen(true)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Yangi
                </Button>
              </div>
            </div>

            {/* Mahsulot qidirish */}
            <div className="space-y-2">
              <Label>Mahsulot qidirish</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Mahsulot nomi, SKU yoki shtrix-kod..."
                  value={productSearch}
                  onChange={(e) => handleSearchProduct(e.target.value)}
                  className="pl-10"
                />
                {searchResults.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-background border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {searchResults.map(product => (
                      <div
                        key={product.id}
                        className="p-3 hover:bg-accent cursor-pointer border-b last:border-b-0"
                        onClick={() => handleAddProduct(product)}
                      >
                        <p className="font-medium">{product.name}</p>
                        <p className="text-sm text-muted-foreground">
                          SKU: {product.sku} | Zaxira: {product.stock}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Mahsulotlar ro'yxati */}
            {purchaseItemsInput.length > 0 && (
              <div>
                <h3 className="font-semibold mb-3">Xarid mahsulotlari</h3>
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-muted">
                      <tr>
                        <th className="text-left p-3 text-sm font-medium">Mahsulot</th>
                        <th className="text-center p-3 text-sm font-medium">Miqdor</th>
                        <th className="text-right p-3 text-sm font-medium">Xarid narxi</th>
                        <th className="text-right p-3 text-sm font-medium">Jami</th>
                        <th className="text-center p-3 text-sm font-medium w-12"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {purchaseItemsInput.map((item, index) => (
                        <tr key={index} className="border-t">
                          <td className="p-3">{item.productName}</td>
                          <td className="p-3">
                            <Input
                              type="number"
                              min="1"
                              value={item.qty}
                              onChange={(e) => handleUpdateItem(index, 'qty', Number(e.target.value))}
                              className="w-20 text-center"
                            />
                          </td>
                          <td className="p-3">
                            <Input
                              type="number"
                              min="0"
                              value={item.costPrice / 100}
                              onChange={(e) => handleUpdateItem(index, 'costPrice', Math.round(Number(e.target.value) * 100))}
                              className="w-28 text-right"
                            />
                          </td>
                          <td className="p-3 text-right font-medium">
                            {(item.total / 100).toLocaleString()} so'm
                          </td>
                          <td className="p-3 text-center">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemoveItem(index)}
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Jami summa */}
            {purchaseItemsInput.length > 0 && (
              <div className="p-4 bg-primary/5 rounded-lg">
                <div className="flex justify-between text-lg font-bold">
                  <span>Jami summa:</span>
                  <span className="text-primary">
                    {(calculateTotal() / 100).toLocaleString()} so'm
                  </span>
                </div>
              </div>
            )}

            {/* Izoh */}
            <div className="space-y-2">
              <Label>Izoh</Label>
              <Input
                placeholder="Xarid haqida qo'shimcha ma'lumot..."
                value={purchaseNotes}
                onChange={(e) => setPurchaseNotes(e.target.value)}
              />
            </div>

            {/* Amallar */}
            <div className="flex gap-2 justify-end">
              <Button 
                variant="outline" 
                onClick={() => {
                  setIsCreateDialogOpen(false);
                  setSelectedSupplierId(null);
                  setPurchaseItemsInput([]);
                  setPurchaseNotes('');
                  setProductSearch('');
                  setSearchResults([]);
                }}
              >
                Bekor qilish
              </Button>
              <Button 
                onClick={handleCreatePurchase}
                disabled={isProcessing || purchaseItemsInput.length === 0 || !selectedSupplierId}
              >
                {isProcessing ? 'Yuklanmoqda...' : 'Xaridni saqlash'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Yangi ta'minotchi yaratish dialog */}
      <Dialog open={isSupplierDialogOpen} onOpenChange={setIsSupplierDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Yangi ta'minotchi</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nomi *</Label>
              <Input
                placeholder="Ta'minotchi nomi"
                value={newSupplierName}
                onChange={(e) => setNewSupplierName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Telefon</Label>
              <Input
                placeholder="+998 XX XXX XX XX"
                value={newSupplierPhone}
                onChange={(e) => setNewSupplierPhone(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Manzil</Label>
              <Input
                placeholder="Manzil"
                value={newSupplierAddress}
                onChange={(e) => setNewSupplierAddress(e.target.value)}
              />
            </div>

            <div className="flex gap-2 justify-end">
              <Button 
                variant="outline" 
                onClick={() => {
                  setIsSupplierDialogOpen(false);
                  setNewSupplierName('');
                  setNewSupplierPhone('');
                  setNewSupplierAddress('');
                }}
              >
                Bekor qilish
              </Button>
              <Button onClick={handleCreateSupplier}>
                Saqlash
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Batafsil ko'rish dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Xarid tafsilotlari</DialogTitle>
          </DialogHeader>
          
          {selectedPurchase && (
            <div className="space-y-6">
              {/* Asosiy ma'lumotlar */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Xarid raqami</p>
                  <p className="font-medium">{selectedPurchase.purchase_no}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Sana/Vaqt</p>
                  <p className="font-medium">{formatDate(selectedPurchase.created_at)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Ta'minotchi</p>
                  <p className="font-medium">{getSupplierName(selectedPurchase.supplier_id)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Mas'ul</p>
                  <p className="font-medium">{getUserName(selectedPurchase.received_by)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Holat</p>
                  <p className="font-medium">{getStatusLabel(selectedPurchase.status)}</p>
                </div>
                {selectedPurchase.notes && (
                  <div className="col-span-2">
                    <p className="text-sm text-muted-foreground">Izoh</p>
                    <p className="font-medium">{selectedPurchase.notes}</p>
                  </div>
                )}
              </div>

              {/* Mahsulotlar ro'yxati */}
              <div>
                <h3 className="font-semibold mb-3">Xarid qilingan mahsulotlar</h3>
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-muted">
                      <tr>
                        <th className="text-left p-3 text-sm font-medium">Mahsulot</th>
                        <th className="text-center p-3 text-sm font-medium">Miqdor</th>
                        <th className="text-right p-3 text-sm font-medium">Xarid narxi</th>
                        <th className="text-right p-3 text-sm font-medium">Jami</th>
                      </tr>
                    </thead>
                    <tbody>
                      {purchaseItems.map((item) => (
                        <tr key={item.id} className="border-t">
                          <td className="p-3">{item.product_name}</td>
                          <td className="p-3 text-center">{item.qty}</td>
                          <td className="p-3 text-right">
                            {(item.cost_price / 100).toLocaleString()} so'm
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
                  <span>Jami summa:</span>
                  <span className="text-primary">
                    {(selectedPurchase.total / 100).toLocaleString()} so'm
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
