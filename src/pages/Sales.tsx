import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Receipt, Search, Eye, DollarSign, TrendingUp, Calendar } from 'lucide-react';
import type { Sale, SaleItem, Profile } from '@/types/types';
import { getSales, getSaleItems, getProfiles } from '@/db/api';

export default function Sales() {
  const { toast } = useToast();
  
  const [sales, setSales] = useState<Sale[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [saleItems, setSaleItems] = useState<SaleItem[]>([]);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [salesData, profilesData] = await Promise.all([
        getSales(1, 100),
        getProfiles(),
      ]);
      setSales(salesData);
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

  const handleViewDetails = async (sale: Sale) => {
    setIsLoading(true);
    try {
      const items = await getSaleItems(sale.id);
      setSaleItems(items);
      setSelectedSale(sale);
      setIsDetailsOpen(true);
    } catch (error) {
      console.error('Sotuv ma\'lumotlarini yuklashda xato:', error);
      toast({
        title: 'Xato',
        description: 'Sotuv ma\'lumotlarini yuklashda xatolik yuz berdi',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
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
      mobile: 'Mobil',
      partial: 'Qisman',
      debt: 'Qarzga',
    };
    return labels[type] || type;
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      completed: 'Yakunlangan',
      refunded: 'Qaytarilgan',
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

  const filterSalesByDate = (sale: Sale) => {
    if (dateFilter === 'all') return true;
    
    const saleDate = new Date(sale.created_at);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (dateFilter === 'today') {
      return saleDate >= today;
    } else if (dateFilter === 'week') {
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);
      return saleDate >= weekAgo;
    } else if (dateFilter === 'month') {
      const monthAgo = new Date(today);
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      return saleDate >= monthAgo;
    }
    return true;
  };

  const filteredSales = sales.filter(sale => {
    const matchesSearch = 
      sale.receipt_no.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesPayment = 
      paymentFilter === 'all' || 
      sale.payment_type === paymentFilter;
    
    const matchesStatus = 
      statusFilter === 'all' || 
      sale.status === statusFilter;
    
    const matchesDate = filterSalesByDate(sale);
    
    return matchesSearch && matchesPayment && matchesStatus && matchesDate;
  });

  // Statistika hisoblash
  const todaySales = sales.filter(sale => {
    const saleDate = new Date(sale.created_at);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return saleDate >= today && sale.status === 'completed';
  });

  const weekSales = sales.filter(sale => {
    const saleDate = new Date(sale.created_at);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    return saleDate >= weekAgo && sale.status === 'completed';
  });

  const monthSales = sales.filter(sale => {
    const saleDate = new Date(sale.created_at);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const monthAgo = new Date(today);
    monthAgo.setMonth(monthAgo.getMonth() - 1);
    return saleDate >= monthAgo && sale.status === 'completed';
  });

  const todayTotal = todaySales.reduce((sum, sale) => sum + sale.total, 0);
  const weekTotal = weekSales.reduce((sum, sale) => sum + sale.total, 0);
  const monthTotal = monthSales.reduce((sum, sale) => sum + sale.total, 0);

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Receipt className="w-8 h-8" />
          Sotuvlar
        </h1>
      </div>

      {/* Statistika */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Bugungi sotuv
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-primary">
              {(todayTotal / 100).toLocaleString()} so'm
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {todaySales.length} ta sotuv
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Haftalik sotuv
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-success">
              {(weekTotal / 100).toLocaleString()} so'm
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {weekSales.length} ta sotuv
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Oylik sotuv
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-warning">
              {(monthTotal / 100).toLocaleString()} so'm
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {monthSales.length} ta sotuv
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Qidiruv va filtrlar */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Chek raqami..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

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

            <Select value={paymentFilter} onValueChange={setPaymentFilter}>
              <SelectTrigger>
                <SelectValue placeholder="To'lov turi" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Barcha to'lovlar</SelectItem>
                <SelectItem value="cash">Naqd</SelectItem>
                <SelectItem value="card">Karta</SelectItem>
                <SelectItem value="mobile">Mobil</SelectItem>
                <SelectItem value="partial">Qisman</SelectItem>
                <SelectItem value="debt">Qarzga</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Holat" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Barcha holatlar</SelectItem>
                <SelectItem value="completed">Yakunlangan</SelectItem>
                <SelectItem value="refunded">Qaytarilgan</SelectItem>
                <SelectItem value="cancelled">Bekor qilingan</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Sotuvlar jadvali */}
      <Card>
        <CardHeader>
          <CardTitle>
            Sotuvlar ro'yxati ({filteredSales.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredSales.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Receipt className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Sotuvlar topilmadi</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-medium">Chek №</th>
                    <th className="text-left p-3 font-medium">Sana/Vaqt</th>
                    <th className="text-left p-3 font-medium">Kassir</th>
                    <th className="text-right p-3 font-medium">Jami</th>
                    <th className="text-center p-3 font-medium">To'lov</th>
                    <th className="text-center p-3 font-medium">Holat</th>
                    <th className="text-center p-3 font-medium">Amallar</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSales.map((sale) => (
                    <tr key={sale.id} className="border-b hover:bg-accent">
                      <td className="p-3">
                        <p className="font-medium">{sale.receipt_no}</p>
                      </td>
                      <td className="p-3 text-sm">
                        {formatDate(sale.created_at)}
                      </td>
                      <td className="p-3 text-sm">
                        {getCashierName(sale.cashier_id)}
                      </td>
                      <td className="p-3 text-right">
                        <div>
                          <p className="font-bold">
                            {(sale.total / 100).toLocaleString()} so'm
                          </p>
                          {sale.debt_amount > 0 && (
                            <p className="text-xs text-destructive">
                              Qarz: {(sale.debt_amount / 100).toLocaleString()} so'm
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="p-3 text-center">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                          {getPaymentTypeLabel(sale.payment_type)}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          sale.status === 'completed'
                            ? 'bg-success/10 text-success'
                            : sale.status === 'refunded'
                            ? 'bg-warning/10 text-warning'
                            : 'bg-destructive/10 text-destructive'
                        }`}>
                          {getStatusLabel(sale.status)}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleViewDetails(sale)}
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

      {/* Batafsil modal */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Sotuv tafsilotlari</DialogTitle>
          </DialogHeader>
          
          {selectedSale && (
            <div className="space-y-6">
              {/* Asosiy ma'lumotlar */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Chek raqami</p>
                  <p className="font-medium">{selectedSale.receipt_no}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Sana/Vaqt</p>
                  <p className="font-medium">{formatDate(selectedSale.created_at)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Kassir</p>
                  <p className="font-medium">{getCashierName(selectedSale.cashier_id)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">To'lov turi</p>
                  <p className="font-medium">{getPaymentTypeLabel(selectedSale.payment_type)}</p>
                </div>
              </div>

              {/* Mahsulotlar ro'yxati */}
              <div>
                <h3 className="font-semibold mb-3">Mahsulotlar</h3>
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
                      {saleItems.map((item) => (
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

              {/* Hisob-kitob */}
              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Jami:</span>
                  <span className="font-medium">
                    {(selectedSale.subtotal / 100).toLocaleString()} so'm
                  </span>
                </div>
                {selectedSale.discount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Chegirma:</span>
                    <span className="font-medium text-destructive">
                      -{(selectedSale.discount / 100).toLocaleString()} so'm
                    </span>
                  </div>
                )}
                {selectedSale.tax > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Soliq:</span>
                    <span className="font-medium">
                      {(selectedSale.tax / 100).toLocaleString()} so'm
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold border-t pt-2">
                  <span>Umumiy:</span>
                  <span className="text-primary">
                    {(selectedSale.total / 100).toLocaleString()} so'm
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Qabul qilingan:</span>
                  <span className="font-medium">
                    {(selectedSale.received_amount / 100).toLocaleString()} so'm
                  </span>
                </div>
                {selectedSale.change_amount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Qaytim:</span>
                    <span className="font-medium text-success">
                      {(selectedSale.change_amount / 100).toLocaleString()} so'm
                    </span>
                  </div>
                )}
                {selectedSale.debt_amount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Qarz:</span>
                    <span className="font-medium text-destructive">
                      {(selectedSale.debt_amount / 100).toLocaleString()} so'm
                    </span>
                  </div>
                )}
              </div>

              {/* Amallar */}
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setIsDetailsOpen(false)}>
                  Yopish
                </Button>
                <Button variant="outline">
                  Chekni chop etish
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
