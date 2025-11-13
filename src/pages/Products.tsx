import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Package, Plus, Search, Edit, Trash2, AlertTriangle } from 'lucide-react';
import type { Product, Category } from '@/types/types';
import { getProducts, createProduct, updateProduct, deleteProduct, getCategories, createCategory } from '@/db/api';
import { Textarea } from '@/components/ui/textarea';

export default function Products() {
  const { toast } = useToast();
  
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    barcode: '',
    category_id: '',
    unit: 'dona',
    sale_price: '',
    cost_price: '',
    tax_rate: '12',
    stock: '0',
    min_stock: '0',
    is_active: true,
  });

  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryDesc, setNewCategoryDesc] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [productsData, categoriesData] = await Promise.all([
        getProducts(1, 100),
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
    }
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) {
      toast({
        title: 'Xato',
        description: 'Kategoriya nomini kiriting',
        variant: 'destructive',
      });
      return;
    }

    try {
      await createCategory({
        name: newCategoryName,
        description: newCategoryDesc || null,
      });
      
      toast({
        title: 'Muvaffaqiyatli!',
        description: 'Kategoriya yaratildi',
      });
      
      setNewCategoryName('');
      setNewCategoryDesc('');
      setIsCategoryDialogOpen(false);
      await loadData();
    } catch (error) {
      console.error('Kategoriya yaratishda xato:', error);
      toast({
        title: 'Xato',
        description: 'Kategoriya yaratishda xatolik yuz berdi',
        variant: 'destructive',
      });
    }
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast({
        title: 'Xato',
        description: 'Mahsulot nomini kiriting',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.sale_price || Number(formData.sale_price) <= 0) {
      toast({
        title: 'Xato',
        description: 'Sotuv narxini kiriting',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      const productData = {
        name: formData.name,
        sku: formData.sku || null,
        barcode: formData.barcode || null,
        category_id: formData.category_id ? Number(formData.category_id) : null,
        unit: formData.unit,
        sale_price: Math.round(Number(formData.sale_price) * 100),
        cost_price: formData.cost_price ? Math.round(Number(formData.cost_price) * 100) : null,
        tax_rate: Number(formData.tax_rate),
        stock: Number(formData.stock),
        min_stock: Number(formData.min_stock),
        is_active: formData.is_active,
      };

      if (editingProduct) {
        await updateProduct(editingProduct.id, productData);
        toast({
          title: 'Muvaffaqiyatli!',
          description: 'Mahsulot yangilandi',
        });
      } else {
        await createProduct(productData);
        toast({
          title: 'Muvaffaqiyatli!',
          description: 'Mahsulot qo\'shildi',
        });
      }

      setIsDialogOpen(false);
      resetForm();
      await loadData();
    } catch (error) {
      console.error('Mahsulot saqlashda xato:', error);
      toast({
        title: 'Xato',
        description: 'Mahsulot saqlashda xatolik yuz berdi',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      sku: product.sku || '',
      barcode: product.barcode || '',
      category_id: product.category_id?.toString() || '',
      unit: product.unit,
      sale_price: (product.sale_price / 100).toString(),
      cost_price: product.cost_price ? (product.cost_price / 100).toString() : '',
      tax_rate: product.tax_rate.toString(),
      stock: product.stock.toString(),
      min_stock: product.min_stock.toString(),
      is_active: product.is_active,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Mahsulotni o\'chirmoqchimisiz?')) return;

    try {
      await deleteProduct(id);
      toast({
        title: 'Muvaffaqiyatli!',
        description: 'Mahsulot o\'chirildi',
      });
      await loadData();
    } catch (error) {
      console.error('Mahsulotni o\'chirishda xato:', error);
      toast({
        title: 'Xato',
        description: 'Mahsulotni o\'chirishda xatolik yuz berdi',
        variant: 'destructive',
      });
    }
  };

  const resetForm = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      sku: '',
      barcode: '',
      category_id: '',
      unit: 'dona',
      sale_price: '',
      cost_price: '',
      tax_rate: '12',
      stock: '0',
      min_stock: '0',
      is_active: true,
    });
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = 
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.sku?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.barcode?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = 
      selectedCategory === 'all' || 
      product.category_id?.toString() === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Package className="w-8 h-8" />
          Mahsulotlar
        </h1>
        
        <div className="flex gap-2">
          <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                Kategoriya
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Yangi kategoriya</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="categoryName">Kategoriya nomi *</Label>
                  <Input
                    id="categoryName"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="Masalan: Ichimliklar"
                  />
                </div>
                <div>
                  <Label htmlFor="categoryDesc">Tavsif</Label>
                  <Textarea
                    id="categoryDesc"
                    value={newCategoryDesc}
                    onChange={(e) => setNewCategoryDesc(e.target.value)}
                    placeholder="Kategoriya haqida qisqacha..."
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCategoryDialogOpen(false)}>
                  Bekor qilish
                </Button>
                <Button onClick={handleCreateCategory}>
                  Saqlash
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Yangi mahsulot
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingProduct ? 'Mahsulotni tahrirlash' : 'Yangi mahsulot qo\'shish'}
                </DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label htmlFor="name">Mahsulot nomi *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Masalan: Coca Cola 1.5L"
                  />
                </div>

                <div>
                  <Label htmlFor="sku">SKU kodi</Label>
                  <Input
                    id="sku"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    placeholder="P-0001"
                  />
                </div>

                <div>
                  <Label htmlFor="barcode">Shtrix-kod</Label>
                  <Input
                    id="barcode"
                    value={formData.barcode}
                    onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                    placeholder="1234567890123"
                  />
                </div>

                <div>
                  <Label htmlFor="category">Kategoriya</Label>
                  <Select value={formData.category_id} onValueChange={(value) => setFormData({ ...formData, category_id: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Kategoriya tanlang" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Kategoriyasiz</SelectItem>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id.toString()}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="unit">O'lchov birligi</Label>
                  <Select value={formData.unit} onValueChange={(value) => setFormData({ ...formData, unit: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dona">Dona</SelectItem>
                      <SelectItem value="kg">Kilogramm</SelectItem>
                      <SelectItem value="litr">Litr</SelectItem>
                      <SelectItem value="quti">Quti</SelectItem>
                      <SelectItem value="paket">Paket</SelectItem>
                      <SelectItem value="metr">Metr</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="sale_price">Sotuv narxi (so'm) *</Label>
                  <Input
                    id="sale_price"
                    type="number"
                    value={formData.sale_price}
                    onChange={(e) => setFormData({ ...formData, sale_price: e.target.value })}
                    placeholder="10000"
                  />
                </div>

                <div>
                  <Label htmlFor="cost_price">Tannarx (so'm)</Label>
                  <Input
                    id="cost_price"
                    type="number"
                    value={formData.cost_price}
                    onChange={(e) => setFormData({ ...formData, cost_price: e.target.value })}
                    placeholder="8000"
                  />
                </div>

                <div>
                  <Label htmlFor="tax_rate">Soliq (%)</Label>
                  <Input
                    id="tax_rate"
                    type="number"
                    value={formData.tax_rate}
                    onChange={(e) => setFormData({ ...formData, tax_rate: e.target.value })}
                    placeholder="12"
                  />
                </div>

                <div>
                  <Label htmlFor="stock">Zaxira</Label>
                  <Input
                    id="stock"
                    type="number"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    placeholder="0"
                  />
                </div>

                <div>
                  <Label htmlFor="min_stock">Minimal zaxira</Label>
                  <Input
                    id="min_stock"
                    type="number"
                    value={formData.min_stock}
                    onChange={(e) => setFormData({ ...formData, min_stock: e.target.value })}
                    placeholder="5"
                  />
                </div>

                <div className="col-span-2 flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <Label htmlFor="is_active" className="cursor-pointer">Faol</Label>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => {
                  setIsDialogOpen(false);
                  resetForm();
                }}>
                  Bekor qilish
                </Button>
                <Button onClick={handleSubmit} disabled={isLoading}>
                  {isLoading ? 'Yuklanmoqda...' : 'Saqlash'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Qidiruv va filtrlar */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Mahsulot nomi, SKU yoki shtrix-kod..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Kategoriya" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Barcha kategoriyalar</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id.toString()}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Mahsulotlar jadvali */}
      <Card>
        <CardHeader>
          <CardTitle>
            Mahsulotlar ro'yxati ({filteredProducts.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredProducts.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Mahsulotlar topilmadi</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-medium">Nomi</th>
                    <th className="text-left p-3 font-medium">SKU</th>
                    <th className="text-left p-3 font-medium">Shtrix-kod</th>
                    <th className="text-left p-3 font-medium">Kategoriya</th>
                    <th className="text-right p-3 font-medium">Narx</th>
                    <th className="text-right p-3 font-medium">Zaxira</th>
                    <th className="text-center p-3 font-medium">Holat</th>
                    <th className="text-center p-3 font-medium">Amallar</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((product) => (
                    <tr key={product.id} className="border-b hover:bg-accent">
                      <td className="p-3">
                        <div>
                          <p className="font-medium">{product.name}</p>
                          <p className="text-sm text-muted-foreground">{product.unit}</p>
                        </div>
                      </td>
                      <td className="p-3 text-sm">{product.sku || '-'}</td>
                      <td className="p-3 text-sm">{product.barcode || '-'}</td>
                      <td className="p-3 text-sm">
                        {categories.find(c => c.id === product.category_id)?.name || '-'}
                      </td>
                      <td className="p-3 text-right">
                        <div>
                          <p className="font-medium">{(product.sale_price / 100).toLocaleString()} so'm</p>
                          {product.cost_price && (
                            <p className="text-xs text-muted-foreground">
                              Tannarx: {(product.cost_price / 100).toLocaleString()}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {product.stock <= product.min_stock && (
                            <AlertTriangle className="w-4 h-4 text-warning" />
                          )}
                          <span className={product.stock <= product.min_stock ? 'text-warning font-medium' : ''}>
                            {product.stock}
                          </span>
                        </div>
                      </td>
                      <td className="p-3 text-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          product.is_active
                            ? 'bg-success text-success-foreground'
                            : 'bg-muted text-muted-foreground'
                        }`}>
                          {product.is_active ? 'Faol' : 'Nofaol'}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(product)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(product.id)}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
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
    </div>
  );
}
