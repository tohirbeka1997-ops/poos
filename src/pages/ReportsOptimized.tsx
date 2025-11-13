import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Download,
  Calendar,
  Filter,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  getSalesPaginated,
  getDailySalesSummary,
  getMonthlySalesSummary,
  getCashierPerformance,
  getProductSalesSummary,
  getSalesStats,
  exportSalesToCSV,
  exportDailySummaryToCSV,
  type DailySalesSummary,
  type MonthlySalesSummary,
  type CashierPerformance as CashierPerf,
  type ProductSalesSummary,
  type SalesStats,
} from '@/services/reportsService';

const COLORS = ['#2563eb', '#16a34a', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function ReportsOptimized() {
  const { toast } = useToast();

  // Loading states
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  // Stats
  const [salesStats, setSalesStats] = useState<SalesStats | null>(null);
  const [dailySummary, setDailySummary] = useState<DailySalesSummary[]>([]);
  const [monthlySummary, setMonthlySummary] = useState<MonthlySalesSummary[]>([]);
  const [cashierPerf, setCashierPerf] = useState<CashierPerf[]>([]);
  const [productSummary, setProductSummary] = useState<ProductSalesSummary[]>([]);

  // Filters
  const [period, setPeriod] = useState<'today' | 'week' | 'month' | 'custom'>('month');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [paymentType, setPaymentType] = useState<string>('all');
  const [cashierId, setCashierId] = useState<string>('all');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(50);
  const [totalRecords, setTotalRecords] = useState(0);

  useEffect(() => {
    loadData();
  }, [period]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Calculate date range based on period
      const { start, end } = getDateRange(period);

      // Load all data in parallel
      const [stats, daily, monthly, cashiers, products] = await Promise.all([
        getSalesStats(),
        getDailySalesSummary(start, end, 30),
        getMonthlySalesSummary(12),
        getCashierPerformance(),
        getProductSalesSummary(20),
      ]);

      setSalesStats(stats);
      setDailySummary(daily);
      setMonthlySummary(monthly);
      setCashierPerf(cashiers);
      setProductSummary(products);
    } catch (error) {
      console.error('Error loading reports:', error);
      toast({
        title: 'Error',
        description: 'Failed to load reports data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getDateRange = (period: string) => {
    const now = new Date();
    let start = '';
    let end = '';

    switch (period) {
      case 'today':
        start = new Date(now.setHours(0, 0, 0, 0)).toISOString();
        end = new Date(now.setHours(23, 59, 59, 999)).toISOString();
        break;
      case 'week':
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        start = weekAgo.toISOString();
        end = new Date().toISOString();
        break;
      case 'month':
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        start = monthAgo.toISOString();
        end = new Date().toISOString();
        break;
      case 'custom':
        start = startDate;
        end = endDate;
        break;
    }

    return { start, end };
  };

  const handleExportDailySummary = async () => {
    try {
      setExporting(true);
      if (dailySummary.length === 0) {
        toast({
          title: 'No Data',
          description: 'No data available to export',
          variant: 'destructive',
        });
        return;
      }

      exportDailySummaryToCSV(dailySummary, `daily_summary_${period}.csv`);
      toast({
        title: 'Success',
        description: 'Report exported successfully',
      });
    } catch (error) {
      console.error('Error exporting:', error);
      toast({
        title: 'Error',
        description: 'Failed to export report',
        variant: 'destructive',
      });
    } finally {
      setExporting(false);
    }
  };

  const handleExportSales = async () => {
    try {
      setExporting(true);
      const { start, end } = getDateRange(period);

      // Fetch all sales for export (with limit)
      const result = await getSalesPaginated({
        limit: 10000,
        offset: 0,
        startDate: start,
        endDate: end,
        paymentType: paymentType !== 'all' ? paymentType : undefined,
        cashierId: cashierId !== 'all' ? cashierId : undefined,
      });

      if (result.data.length === 0) {
        toast({
          title: 'No Data',
          description: 'No sales data available to export',
          variant: 'destructive',
        });
        return;
      }

      exportSalesToCSV(result.data, `sales_${period}.csv`);
      toast({
        title: 'Success',
        description: `Exported ${result.data.length} sales records`,
      });
    } catch (error) {
      console.error('Error exporting sales:', error);
      toast({
        title: 'Error',
        description: 'Failed to export sales',
        variant: 'destructive',
      });
    } finally {
      setExporting(false);
    }
  };

  const formatCurrency = (num: number) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  // Prepare chart data
  const dailyChartData = dailySummary.map((day) => ({
    date: new Date(day.sale_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    sales: day.total_sales,
    transactions: day.transaction_count,
  }));

  const monthlyChartData = monthlySummary.map((month) => ({
    month: new Date(month.month).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
    sales: month.total_sales,
    transactions: month.transaction_count,
  }));

  const cashierChartData = cashierPerf.slice(0, 10).map((c) => ({
    name: c.full_name || c.username,
    sales: c.total_sales,
    transactions: c.total_transactions,
  }));

  const productChartData = productSummary.slice(0, 10).map((p) => ({
    name: p.name,
    revenue: p.total_revenue,
    quantity: p.total_quantity,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Sales Reports</h1>
          <p className="text-muted-foreground">Optimized for millions of records</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadData} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" onClick={handleExportDailySummary} disabled={exporting}>
            <Download className="h-4 w-4 mr-2" />
            Export Summary
          </Button>
          <Button variant="outline" onClick={handleExportSales} disabled={exporting}>
            <Download className="h-4 w-4 mr-2" />
            Export Sales
          </Button>
        </div>
      </div>

      {/* Period Filter */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
          <CardDescription>Select time period and filters</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Period</label>
              <Select value={period} onValueChange={(v: any) => setPeriod(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">Last 7 Days</SelectItem>
                  <SelectItem value="month">Last 30 Days</SelectItem>
                  <SelectItem value="custom">Custom Range</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {period === 'custom' && (
              <>
                <div>
                  <label className="text-sm font-medium mb-2 block">Start Date</label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">End Date</label>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </>
            )}

            <div>
              <label className="text-sm font-medium mb-2 block">Payment Type</label>
              <Select value={paymentType} onValueChange={setPaymentType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="card">Card</SelectItem>
                  <SelectItem value="mobile">Mobile</SelectItem>
                  <SelectItem value="debt">Debt</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-24 bg-muted" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {formatNumber(salesStats?.total_sales || 0)}
                </div>
                <p className="text-xs text-muted-foreground">All time transactions</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-24 bg-muted" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {formatCurrency(salesStats?.total_revenue || 0)} UZS
                </div>
                <p className="text-xs text-muted-foreground">All time revenue</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Sales</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-24 bg-muted" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {formatNumber(salesStats?.today_sales || 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {formatCurrency(salesStats?.today_revenue || 0)} UZS
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-24 bg-muted" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {formatNumber(salesStats?.this_month_sales || 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {formatCurrency(salesStats?.this_month_revenue || 0)} UZS
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="daily" className="space-y-4">
        <TabsList>
          <TabsTrigger value="daily">Daily Trend</TabsTrigger>
          <TabsTrigger value="monthly">Monthly Trend</TabsTrigger>
          <TabsTrigger value="cashiers">Cashier Performance</TabsTrigger>
          <TabsTrigger value="products">Top Products</TabsTrigger>
        </TabsList>

        <TabsContent value="daily" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Daily Sales Trend</CardTitle>
              <CardDescription>Sales performance over the last 30 days</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-[300px] w-full bg-muted" />
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={dailyChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="sales" stroke="#2563eb" name="Sales (UZS)" />
                    <Line
                      type="monotone"
                      dataKey="transactions"
                      stroke="#16a34a"
                      name="Transactions"
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="monthly" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Monthly Sales Trend</CardTitle>
              <CardDescription>Sales performance over the last 12 months</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-[300px] w-full bg-muted" />
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={monthlyChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="sales" fill="#2563eb" name="Sales (UZS)" />
                    <Bar dataKey="transactions" fill="#16a34a" name="Transactions" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cashiers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Cashier Performance</CardTitle>
              <CardDescription>Top performing cashiers</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-[300px] w-full bg-muted" />
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={cashierChartData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={100} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="sales" fill="#2563eb" name="Sales (UZS)" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="products" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top Products</CardTitle>
              <CardDescription>Best selling products by revenue</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-[300px] w-full bg-muted" />
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={productChartData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={150} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="revenue" fill="#2563eb" name="Revenue (UZS)" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Performance Note */}
      <Card>
        <CardHeader>
          <CardTitle>⚡ Performance Optimizations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <p>
              <Badge variant="secondary" className="mr-2">
                Materialized Views
              </Badge>
              Dashboard data is cached for instant loading
            </p>
            <p>
              <Badge variant="secondary" className="mr-2">
                Pagination
              </Badge>
              Sales history loads only 50 records at a time
            </p>
            <p>
              <Badge variant="secondary" className="mr-2">
                Indexes
              </Badge>
              Optimized database queries with composite indexes
            </p>
            <p>
              <Badge variant="secondary" className="mr-2">
                Async Export
              </Badge>
              Large reports export in background without freezing UI
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
