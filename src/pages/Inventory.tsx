import { useState, useEffect } from 'react';
import { useAuth } from 'miaoda-auth-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Package, AlertTriangle, TrendingUp, TrendingDown, History, Edit } from 'lucide-react';
import type { Product, Category, StockMove } from '@/types/types';
import { 
  getProducts,
  getCategories,
  getStockMoves,
  createStockMove,
  updateProduct
} from '@/db/api';

type StockStatus = 'all' | 'normal' | 'low' | 'out';

export default function Inventory() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<StockStatus>('all');
  const [isLoading, setIsLoading] = useState(false);

  // Manual adjustment dialog
  const [isAdjustDialogOpen, setIsAdjustDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [adjustmentQty, setAdjustmentQty] = useState<number>(0);
  const [adjustmentType, setAdjustmentType] = useState<'in' | 'out'>('in');
  const [adjustmentNote, setAdjustmentNote] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Stock movements dialog
  const [isMovementsDialogOpen, setIsMovementsDialogOpen] = useState(false);
  const [stockMoves, setStockMoves] = useState<StockMove[]>([]);
  const [movementsProduct, setMovementsProduct] = useState<Product | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [productsData, categoriesData] = await Promise.all([
        getProducts(1, 1000),
        getCategories(),
      ]);
      setProducts(productsData);
      setCategories(categoriesData);
    } catch (error) {
      console.error('Ma\'lumotlarni yuklashda xato:', error);
      toast({
        title: 'Xato',
        description: 'Ma\'lumotlarni yuklashda xatolik yuz berdi',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStockStatus = (product: Product): 'normal' | 'low' | 'out' => {
    if (product.stock === 0) return 'out';
    if (product.stock <= product.min_stock) return 'low';
    return 'normal';
  };

  const getStockStatusLabel = (status: 'normal' | 'low' | 'out'): string => {
    const labels = {
      normal: 'Normal',
      low: 'Kam zaxira',
      out: 'Tugagan',
    };
    return labels[status];
  };

  const getCategoryName = (categoryId: number | null): string => {
    if (!categoryId) return 'Kategoriyasiz';
    const category = categories.find(c => c.id === categoryId);
    return category?.name || 'Noma\'lum';
  };

  const filteredProducts = products.filter(product => {
    // Search filter
    const matchesSearch = 
      searchQuery.trim() === '' ||
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.sku?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.barcode?.toLowerCase().includes(searchQuery.toLowerCase());

    // Category filter
    const matchesCategory = 
      categoryFilter === 'all' || 
      product.category_id?.toString() === categoryFilter;

    // Status filter
    const status = getStockStatus(product);
    const matchesStatus = 
      statusFilter === 'all' || 
      status === statusFilter;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Statistics
  const totalStockValue = products.reduce((sum, p) => {
    const costPrice = p.cost_price || 0;
    return sum + (p.stock * costPrice);
  }, 0);

  const lowStockCount = products.filter(p => getStockStatus(p) === 'low').length;
  const outOfStockCount = products.filter(p => getStockStatus(p) === 'out').length;

  const handleOpenAdjustDialog = (product: Product) => {
    setSelectedProduct(product);
    setAdjustmentQty(0);
    setAdjustmentType('in');
    setAdjustmentNote('');
    setIsAdjustDialogOpen(true);
  };

  const handleManualAdjustment = async () => {
    if (!user || !selectedProduct) return;

    if (adjustmentQty <= 0) {
      toast({
        title: 'Xato',
        description: 'Miqdor 0 dan katta bo\'lishi kerak',
        variant: 'destructive',
      });
      return;
    }

    if (adjustmentType === 'out' && adjustmentQty > selectedProduct.stock) {
      toast({
        title: 'Xato',
        description: 'Omborda yetarli mahsulot yo\'q',
        variant: 'destructive',
      });
      return;
    }

    if (!adjustmentNote.trim()) {
      toast({
        title: 'Xato',
        description: 'Sabab yozilishi shart',
        variant: 'destructive',
      });
      return;
    }

    setIsProcessing(true);

    try {
      // Calculate new stock
      const newStock = adjustmentType === 'in' 
        ? selectedProduct.stock + adjustmentQty
        : selectedProduct.stock - adjustmentQty;

      // Update product stock
      await updateProduct(selectedProduct.id, {
        stock: newStock,
      });

      // Create stock move record
      await createStockMove({
        product_id: selectedProduct.id,
        type: adjustmentType,
        qty: adjustmentQty,
        ref_type: 'manual',
        ref_id: null,
        notes: adjustmentNote.trim(),
        created_by: user.id,
      });

      toast({
        title: 'Muvaffaqiyatli!',
        description: 'Zaxira muvaffaqiyatli yangilandi',
      });

      // Refresh data
      await loadData();
      setIsAdjustDialogOpen(false);
      setSelectedProduct(null);
      setAdjustmentQty(0);
      setAdjustmentNote('');
    } catch (error) {
      console.error('Zaxirani yangilashda xato:', error);
      toast({
        title: 'Xato',
        description: 'Zaxirani yangilashda xatolik yuz berdi',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleViewMovements = async (product: Product) => {
    setMovementsProduct(product);
    setIsLoading(true);
    try {
      const moves = await getStockMoves(product.id, 1, 100);
      setStockMoves(moves);
      setIsMovementsDialogOpen(true);
    } catch (error) {
      console.error('Harakatlarni yuklashda xato:', error);
      toast({
        title: 'Xato',
        description: 'Harakatlarni yuklashda xatolik yuz berdi',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getMovementTypeLabel = (type: string): string => {
    const labels: Record<string, string> = {
      in: 'Kirim',
      out: 'Chiqim',
      adjustment: 'Tuzatish',
    };
    return labels[type] || type;
  };

  const getRefTypeLabel = (refType: string | null): string => {
    if (!refType) return '-';
    const labels: Record<string, string> = {
      purchase: 'Xarid',
      sale: 'Sotuv',
      return: 'Qaytarish',
      manual: 'Qo\'lda o\'zgartirish',
      correction: 'Tuzatish',
    };
    return labels[refType] || refType;
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

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Package className="w-8 h-8" />
          Ombor
        </h1>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Jami mahsulotlar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-primary">
              {products.length}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Barcha mahsulotlar
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Ombor qiymati
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-success">
              {(totalStockValue / 100).toLocaleString()} so'm
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Jami tannarx
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Kam zaxira
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-warning">
              {lowStockCount}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Mahsulotlar
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Tugagan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-destructive">
              {outOfStockCount}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Mahsulotlar
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              placeholder="Qidirish: nom, SKU, shtrix-kod..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Kategoriya" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Barcha kategoriyalar</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category.id} value={category.id.toString()}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StockStatus)}>
              <SelectTrigger>
                <SelectValue placeholder="Holat" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Barcha holatlar</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="low">Kam zaxira</SelectItem>
                <SelectItem value="out">Tugagan</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Products table */}
      <Card>
        <CardHeader>
          <CardTitle>
            Mahsulotlar ro'yxati ({filteredProducts.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>Yuklanmoqda...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Mahsulotlar topilmadi</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-medium">Mahsulot</th>
                    <th className="text-left p-3 font-medium">SKU</th>
                    <th className="text-left p-3 font-medium">Kategoriya</th>
                    <th className="text-right p-3 font-medium">Tannarx</th>
                    <th className="text-right p-3 font-medium">Sotuv narxi</th>
                    <th className="text-center p-3 font-medium">Zaxira</th>
                    <th className="text-center p-3 font-medium">Min. zaxira</th>
                    <th className="text-center p-3 font-medium">Holat</th>
                    <th className="text-center p-3 font-medium">Amallar</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((product) => {
                    const status = getStockStatus(product);
                    return (
                      <tr key={product.id} className="border-b hover:bg-accent">
                        <td className="p-3">
                          <p className="font-medium">{product.name}</p>
                          {product.barcode && (
                            <p className="text-sm text-muted-foreground">
                              Shtrix-kod: {product.barcode}
                            </p>
                          )}
                        </td>
                        <td className="p-3 text-sm">
                          {product.sku || '-'}
                        </td>
                        <td className="p-3 text-sm">
                          {getCategoryName(product.category_id)}
                        </td>
                        <td className="p-3 text-right text-sm">
                          {product.cost_price 
                            ? `${(product.cost_price / 100).toLocaleString()} so'm`
                            : '-'
                          }
                        </td>
                        <td className="p-3 text-right font-medium">
                          {(product.sale_price / 100).toLocaleString()} so'm
                        </td>
                        <td className="p-3 text-center">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold ${
                            status === 'out'
                              ? 'bg-destructive/10 text-destructive'
                              : status === 'low'
                              ? 'bg-warning/10 text-warning'
                              : 'bg-success/10 text-success'
                          }`}>
                            {product.stock}
                          </span>
                        </td>
                        <td className="p-3 text-center text-sm">
                          {product.min_stock}
                        </td>
                        <td className="p-3 text-center">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            status === 'out'
                              ? 'bg-destructive/10 text-destructive'
                              : status === 'low'
                              ? 'bg-warning/10 text-warning'
                              : 'bg-success/10 text-success'
                          }`}>
                            {status === 'low' && <AlertTriangle className="w-3 h-3" />}
                            {getStockStatusLabel(status)}
                          </span>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center justify-center gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleOpenAdjustDialog(product)}
                              title="Zaxirani tahrirlash"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleViewMovements(product)}
                              title="Harakatlar tarixi"
                            >
                              <History className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Manual adjustment dialog */}
      <Dialog open={isAdjustDialogOpen} onOpenChange={setIsAdjustDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Zaxirani tahrirlash</DialogTitle>
          </DialogHeader>
          
          {selectedProduct && (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Mahsulot</p>
                <p className="font-medium">{selectedProduct.name}</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Joriy zaxira</p>
                <p className="text-2xl font-bold text-primary">
                  {selectedProduct.stock}
                </p>
              </div>

              <div className="space-y-2">
                <Label>Harakat turi *</Label>
                <Select value={adjustmentType} onValueChange={(v) => setAdjustmentType(v as 'in' | 'out')}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="in">
                      <span className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-success" />
                        Kirim
                      </span>
                    </SelectItem>
                    <SelectItem value="out">
                      <span className="flex items-center gap-2">
                        <TrendingDown className="w-4 h-4 text-destructive" />
                        Chiqim
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Miqdor *</Label>
                <Input
                  type="number"
                  min="1"
                  value={adjustmentQty || ''}
                  onChange={(e) => setAdjustmentQty(Number(e.target.value))}
                  placeholder="Miqdorni kiriting"
                />
              </div>

              <div className="space-y-2">
                <Label>Sabab *</Label>
                <Input
                  placeholder="Masalan: Inventarizatsiya, Yo'qotish, Tekshirish..."
                  value={adjustmentNote}
                  onChange={(e) => setAdjustmentNote(e.target.value)}
                />
              </div>

              {adjustmentQty > 0 && (
                <div className="p-4 bg-primary/5 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Yangi zaxira:</p>
                  <p className="text-2xl font-bold text-primary">
                    {adjustmentType === 'in' 
                      ? selectedProduct.stock + adjustmentQty
                      : selectedProduct.stock - adjustmentQty
                    }
                  </p>
                </div>
              )}

              <div className="flex gap-2 justify-end">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setIsAdjustDialogOpen(false);
                    setSelectedProduct(null);
                    setAdjustmentQty(0);
                    setAdjustmentNote('');
                  }}
                >
                  Bekor qilish
                </Button>
                <Button 
                  onClick={handleManualAdjustment}
                  disabled={isProcessing || adjustmentQty <= 0 || !adjustmentNote.trim()}
                >
                  {isProcessing ? 'Yuklanmoqda...' : 'Saqlash'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Stock movements dialog */}
      <Dialog open={isMovementsDialogOpen} onOpenChange={setIsMovementsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Zaxira harakatlari tarixi</DialogTitle>
          </DialogHeader>
          
          {movementsProduct && (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Mahsulot</p>
                <p className="font-medium text-lg">{movementsProduct.name}</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Joriy zaxira</p>
                <p className="text-2xl font-bold text-primary">
                  {movementsProduct.stock}
                </p>
              </div>

              {stockMoves.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <History className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Harakatlar topilmadi</p>
                </div>
              ) : (
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-muted">
                      <tr>
                        <th className="text-left p-3 text-sm font-medium">Sana/Vaqt</th>
                        <th className="text-center p-3 text-sm font-medium">Turi</th>
                        <th className="text-center p-3 text-sm font-medium">Miqdor</th>
                        <th className="text-left p-3 text-sm font-medium">Manba</th>
                        <th className="text-left p-3 text-sm font-medium">Izoh</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stockMoves.map((move) => (
                        <tr key={move.id} className="border-t">
                          <td className="p-3 text-sm">
                            {formatDate(move.created_at)}
                          </td>
                          <td className="p-3 text-center">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              move.type === 'in'
                                ? 'bg-success/10 text-success'
                                : move.type === 'out'
                                ? 'bg-destructive/10 text-destructive'
                                : 'bg-primary/10 text-primary'
                            }`}>
                              {move.type === 'in' ? (
                                <TrendingUp className="w-3 h-3" />
                              ) : move.type === 'out' ? (
                                <TrendingDown className="w-3 h-3" />
                              ) : null}
                              {getMovementTypeLabel(move.type)}
                            </span>
                          </td>
                          <td className="p-3 text-center font-medium">
                            {move.type === 'in' ? '+' : move.type === 'out' ? '-' : '±'}
                            {move.qty}
                          </td>
                          <td className="p-3 text-sm">
                            {getRefTypeLabel(move.ref_type)}
                            {move.ref_id && ` #${move.ref_id}`}
                          </td>
                          <td className="p-3 text-sm text-muted-foreground">
                            {move.notes || '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setIsMovementsDialogOpen(false)}>
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
