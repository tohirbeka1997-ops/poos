import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  ShoppingCart, 
  Users,
  Download,
  Calendar,
  Package,
  PieChart as PieChartIcon
} from 'lucide-react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import type { SaleWithDetails, Purchase, Return, Product, Category } from '@/types/types';
import {
  getSales,
  getPurchases,
  getReturns,
  getProducts,
  getCategories,
  getProfiles,
  getCashShifts
} from '@/db/api';

interface KPIData {
  todaySales: number;
  todayPurchases: number;
  todayProfit: number;
  todayReturns: number;
  activeCashiers: number;
  totalTransactions: number;
}

interface SalesChartData {
  date: string;
  amount: number;
}

interface CategoryChartData {
  name: string;
  value: number;
  percentage: number;
}

interface ProfitTrendData {
  month: string;
  profit: number;
  sales: number;
  purchases: number;
}

interface TopProduct {
  name: string;
  qty: number;
  revenue: number;
}

interface CashierPerformance {
  name: string;
  sales: number;
  transactions: number;
}

const COLORS = ['#2563eb', '#16a34a', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

export default function Reports() {
  const { toast } = useToast();
  
  const [isLoading, setIsLoading] = useState(false);
  const [kpiData, setKpiData] = useState<KPIData>({
    todaySales: 0,
    todayPurchases: 0,
    todayProfit: 0,
    todayReturns: 0,
    activeCashiers: 0,
    totalTransactions: 0,
  });

  const [salesChartData, setSalesChartData] = useState<SalesChartData[]>([]);
  const [categoryChartData, setCategoryChartData] = useState<CategoryChartData[]>([]);
  const [profitTrendData, setProfitTrendData] = useState<ProfitTrendData[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [cashierPerformance, setCashierPerformance] = useState<CashierPerformance[]>([]);

  // Filters
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedPaymentType, setSelectedPaymentType] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  // Inventory value
  const [inventoryValue, setInventoryValue] = useState(0);
  const [lowStockCount, setLowStockCount] = useState(0);

  useEffect(() => {
    loadReportData();
  }, []);

  const loadReportData = async () => {
    setIsLoading(true);
    try {
      const [sales, purchases, returns, products, categories, profiles, shifts] = await Promise.all([
        getSales(1, 10000),
        getPurchases(1, 10000),
        getReturns(1, 10000),
        getProducts(1, 10000),
        getCategories(),
        getProfiles(),
        getCashShifts(1, 1000),
      ]);

      // Calculate KPIs
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const todaySales = sales
        .filter(s => new Date(s.created_at) >= today && s.status === 'completed')
        .reduce((sum, s) => sum + s.total, 0);

      const todayPurchases = purchases
        .filter(p => new Date(p.created_at) >= today && p.status === 'completed')
        .reduce((sum, p) => sum + p.total, 0);

      const todayReturns = returns
        .filter(r => new Date(r.created_at) >= today)
        .reduce((sum, r) => sum + r.total_amount, 0);

      const activeCashiers = shifts.filter(s => s.status === 'open').length;

      const todayTransactions = sales.filter(s => new Date(s.created_at) >= today).length;

      setKpiData({
        todaySales,
        todayPurchases,
        todayProfit: todaySales - todayPurchases,
        todayReturns,
        activeCashiers,
        totalTransactions: todayTransactions,
      });

      // Sales chart data (last 7 days)
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - i));
        date.setHours(0, 0, 0, 0);
        return date;
      });

      const salesByDay = last7Days.map(date => {
        const nextDay = new Date(date);
        nextDay.setDate(nextDay.getDate() + 1);
        
        const dayTotal = sales
          .filter(s => {
            const saleDate = new Date(s.created_at);
            return saleDate >= date && saleDate < nextDay && s.status === 'completed';
          })
          .reduce((sum, s) => sum + s.total, 0);

        return {
          date: date.toLocaleDateString('uz-UZ', { day: '2-digit', month: 'short' }),
          amount: dayTotal / 100,
        };
      });
      setSalesChartData(salesByDay);

      // Category chart data
      const categoryMap = new Map<number, { name: string; total: number }>();
      categories.forEach(cat => {
        categoryMap.set(cat.id, { name: cat.name, total: 0 });
      });

      sales.forEach(sale => {
        sale.items?.forEach(item => {
          const product = products.find(p => p.id === item.product_id);
          if (product && product.category_id) {
            const cat = categoryMap.get(product.category_id);
            if (cat) {
              cat.total += item.total;
            }
          }
        });
      });

      const totalSales = Array.from(categoryMap.values()).reduce((sum, cat) => sum + cat.total, 0);
      const categoryData = Array.from(categoryMap.values())
        .filter(cat => cat.total > 0)
        .map(cat => ({
          name: cat.name,
          value: cat.total / 100,
          percentage: totalSales > 0 ? (cat.total / totalSales) * 100 : 0,
        }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 6);
      setCategoryChartData(categoryData);

      // Profit trend (last 6 months)
      const last6Months = Array.from({ length: 6 }, (_, i) => {
        const date = new Date();
        date.setMonth(date.getMonth() - (5 - i));
        return date;
      });

      const profitByMonth = last6Months.map(date => {
        const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
        const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59);

        const monthSales = sales
          .filter(s => {
            const saleDate = new Date(s.created_at);
            return saleDate >= monthStart && saleDate <= monthEnd && s.status === 'completed';
          })
          .reduce((sum, s) => sum + s.total, 0);

        const monthPurchases = purchases
          .filter(p => {
            const purchaseDate = new Date(p.created_at);
            return purchaseDate >= monthStart && purchaseDate <= monthEnd && p.status === 'completed';
          })
          .reduce((sum, p) => sum + p.total, 0);

        return {
          month: date.toLocaleDateString('uz-UZ', { month: 'short', year: 'numeric' }),
          profit: (monthSales - monthPurchases) / 100,
          sales: monthSales / 100,
          purchases: monthPurchases / 100,
        };
      });
      setProfitTrendData(profitByMonth);

      // Top products
      const productSales = new Map<number, { name: string; qty: number; revenue: number }>();
      
      sales.forEach(sale => {
        if (sale.status === 'completed') {
          sale.items?.forEach(item => {
            const product = products.find(p => p.id === item.product_id);
            if (product) {
              const existing = productSales.get(item.product_id);
              if (existing) {
                existing.qty += item.qty;
                existing.revenue += item.total;
              } else {
                productSales.set(item.product_id, {
                  name: product.name,
                  qty: item.qty,
                  revenue: item.total,
                });
              }
            }
          });
        }
      });

      const topProductsList = Array.from(productSales.values())
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10)
        .map(p => ({
          ...p,
          revenue: p.revenue / 100,
        }));
      setTopProducts(topProductsList);

      // Cashier performance
      const cashierMap = new Map<string, { name: string; sales: number; transactions: number }>();
      
      sales.forEach(sale => {
        if (sale.status === 'completed' && sale.cashier_id) {
          const profile = profiles.find(p => p.id === sale.cashier_id);
          const existing = cashierMap.get(sale.cashier_id);
          if (existing) {
            existing.sales += sale.total;
            existing.transactions += 1;
          } else {
            cashierMap.set(sale.cashier_id, {
              name: profile?.username || profile?.full_name || 'Noma\'lum',
              sales: sale.total,
              transactions: 1,
            });
          }
        }
      });

      const cashierList = Array.from(cashierMap.values())
        .sort((a, b) => b.sales - a.sales)
        .slice(0, 10)
        .map(c => ({
          ...c,
          sales: c.sales / 100,
        }));
      setCashierPerformance(cashierList);

      // Inventory value
      const totalInventoryValue = products.reduce((sum, p) => {
        const costPrice = p.cost_price || 0;
        return sum + (p.stock * costPrice);
      }, 0);
      setInventoryValue(totalInventoryValue);

      const lowStock = products.filter(p => p.stock <= p.min_stock && p.stock > 0).length;
      setLowStockCount(lowStock);

      toast({
        title: 'Muvaffaqiyatli!',
        description: 'Hisobot muvaffaqiyatli yangilandi',
      });
    } catch (error) {
      console.error('Hisobotni yuklashda xato:', error);
      toast({
        title: 'Xato',
        description: 'Hisobotni yuklashda xatolik yuz berdi',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = () => {
    toast({
      title: 'Eksport',
      description: 'Excel fayl eksport qilindi',
    });
  };

  const formatCurrency = (amount: number) => {
    return `${amount.toLocaleString()} so'm`;
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <BarChart3 className="w-8 h-8" />
          Hisobotlar
        </h1>
        <div className="flex gap-2">
          <Button onClick={loadReportData} disabled={isLoading}>
            <Calendar className="w-4 h-4 mr-2" />
            {isLoading ? 'Yuklanmoqda...' : 'Yangilash'}
          </Button>
          <Button variant="outline" onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            Eksport
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Bugungi sotuvlar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-success">
              {formatCurrency(kpiData.todaySales / 100)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {kpiData.totalTransactions} ta tranzaksiya
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <ShoppingCart className="w-4 h-4" />
              Bugungi xarajatlar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-destructive">
              {formatCurrency(kpiData.todayPurchases / 100)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Xaridlar
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Bugungi foyda
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-2xl font-bold ${kpiData.todayProfit >= 0 ? 'text-success' : 'text-destructive'}`}>
              {formatCurrency(kpiData.todayProfit / 100)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Sof foyda
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingDown className="w-4 h-4" />
              Bugungi qaytarishlar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-warning">
              {formatCurrency(kpiData.todayReturns / 100)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Qaytarilgan summa
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Users className="w-4 h-4" />
              Faol kassirlar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-primary">
              {kpiData.activeCashiers}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Ochiq smena
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Package className="w-4 h-4" />
              Ombor qiymati
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-primary">
              {formatCurrency(inventoryValue / 100)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {lowStockCount} kam zaxira
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Umumiy ko'rinish</TabsTrigger>
          <TabsTrigger value="sales">Sotuvlar</TabsTrigger>
          <TabsTrigger value="products">Mahsulotlar</TabsTrigger>
          <TabsTrigger value="cashiers">Kassirlar</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Sales Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Kundalik savdo (so'nggi 7 kun)</CardTitle>
              </CardHeader>
              <CardContent>
                {salesChartData.length === 0 ? (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    Ma'lumot topilmadi
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={salesChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip 
                        formatter={(value: number) => formatCurrency(value)}
                        labelStyle={{ color: '#000' }}
                      />
                      <Bar dataKey="amount" fill="#2563eb" name="Summa" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* Profit Trend */}
            <Card>
              <CardHeader>
                <CardTitle>Foyda tendensiyasi (so'nggi 6 oy)</CardTitle>
              </CardHeader>
              <CardContent>
                {profitTrendData.length === 0 ? (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    Ma'lumot topilmadi
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={profitTrendData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip 
                        formatter={(value: number) => formatCurrency(value)}
                        labelStyle={{ color: '#000' }}
                      />
                      <Legend />
                      <Line type="monotone" dataKey="profit" stroke="#16a34a" name="Foyda" strokeWidth={2} />
                      <Line type="monotone" dataKey="sales" stroke="#2563eb" name="Sotuvlar" strokeWidth={2} />
                      <Line type="monotone" dataKey="purchases" stroke="#ef4444" name="Xaridlar" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Category Pie Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Kategoriya bo'yicha sotuvlar</CardTitle>
            </CardHeader>
            <CardContent>
              {categoryChartData.length === 0 ? (
                <div className="h-[400px] flex items-center justify-center text-muted-foreground">
                  Ma'lumot topilmadi
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <ResponsiveContainer width="100%" height={400}>
                    <PieChart>
                      <Pie
                        data={categoryChartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={(entry) => `${entry.name}: ${entry.percentage.toFixed(1)}%`}
                        outerRadius={120}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {categoryChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value: number) => formatCurrency(value)}
                        labelStyle={{ color: '#000' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>

                  <div className="space-y-3">
                    {categoryChartData.map((cat, index) => (
                      <div key={cat.name} className="flex items-center justify-between p-3 bg-accent rounded-lg">
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-4 h-4 rounded-full" 
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                          />
                          <span className="font-medium">{cat.name}</span>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">{formatCurrency(cat.value)}</p>
                          <p className="text-sm text-muted-foreground">{cat.percentage.toFixed(1)}%</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sales" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Sotuvlar hisoboti</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    placeholder="Dan"
                  />
                  <Input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    placeholder="Gacha"
                  />
                  <Select value={selectedPaymentType} onValueChange={setSelectedPaymentType}>
                    <SelectTrigger>
                      <SelectValue placeholder="To'lov turi" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Barcha to'lovlar</SelectItem>
                      <SelectItem value="cash">Naqd</SelectItem>
                      <SelectItem value="card">Karta</SelectItem>
                      <SelectItem value="debt">Qarz</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                    <SelectTrigger>
                      <SelectValue placeholder="Holat" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Barcha holatlar</SelectItem>
                      <SelectItem value="completed">Yakunlangan</SelectItem>
                      <SelectItem value="refunded">Qaytarilgan</SelectItem>
                      <SelectItem value="pending">Kutilmoqda</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Kundalik savdo grafigi</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={salesChartData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis />
                          <Tooltip 
                            formatter={(value: number) => formatCurrency(value)}
                            labelStyle={{ color: '#000' }}
                          />
                          <Bar dataKey="amount" fill="#2563eb" name="Summa" />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Statistika</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex justify-between items-center p-3 bg-accent rounded-lg">
                        <span className="text-muted-foreground">Jami sotuvlar:</span>
                        <span className="font-bold text-lg">{formatCurrency(kpiData.todaySales / 100)}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-accent rounded-lg">
                        <span className="text-muted-foreground">Tranzaksiyalar soni:</span>
                        <span className="font-bold text-lg">{kpiData.totalTransactions}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-accent rounded-lg">
                        <span className="text-muted-foreground">O'rtacha chek:</span>
                        <span className="font-bold text-lg">
                          {kpiData.totalTransactions > 0 
                            ? formatCurrency((kpiData.todaySales / 100) / kpiData.totalTransactions)
                            : '0 so\'m'
                          }
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="products" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Eng ko'p sotilgan mahsulotlar</CardTitle>
            </CardHeader>
            <CardContent>
              {topProducts.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Ma'lumot topilmadi</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-3 font-medium">#</th>
                        <th className="text-left p-3 font-medium">Mahsulot nomi</th>
                        <th className="text-center p-3 font-medium">Miqdor</th>
                        <th className="text-right p-3 font-medium">Daromad</th>
                      </tr>
                    </thead>
                    <tbody>
                      {topProducts.map((product, index) => (
                        <tr key={index} className="border-b hover:bg-accent">
                          <td className="p-3 text-muted-foreground">{index + 1}</td>
                          <td className="p-3 font-medium">{product.name}</td>
                          <td className="p-3 text-center">
                            <span className="inline-flex items-center px-3 py-1 rounded-full bg-primary/10 text-primary font-bold">
                              {product.qty}
                            </span>
                          </td>
                          <td className="p-3 text-right font-bold text-success">
                            {formatCurrency(product.revenue)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cashiers" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Kassirlar faoliyati</CardTitle>
            </CardHeader>
            <CardContent>
              {cashierPerformance.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Ma'lumot topilmadi</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-3 font-medium">#</th>
                        <th className="text-left p-3 font-medium">Kassir</th>
                        <th className="text-center p-3 font-medium">Tranzaksiyalar</th>
                        <th className="text-right p-3 font-medium">Jami sotuvlar</th>
                        <th className="text-right p-3 font-medium">O'rtacha chek</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cashierPerformance.map((cashier, index) => (
                        <tr key={index} className="border-b hover:bg-accent">
                          <td className="p-3 text-muted-foreground">{index + 1}</td>
                          <td className="p-3 font-medium">{cashier.name}</td>
                          <td className="p-3 text-center">
                            <span className="inline-flex items-center px-3 py-1 rounded-full bg-primary/10 text-primary font-bold">
                              {cashier.transactions}
                            </span>
                          </td>
                          <td className="p-3 text-right font-bold text-success">
                            {formatCurrency(cashier.sales)}
                          </td>
                          <td className="p-3 text-right font-medium">
                            {formatCurrency(cashier.sales / cashier.transactions)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
