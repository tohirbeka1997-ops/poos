import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import {
  getSalesStats,
  getTableStats,
  refreshAllMaterializedViews,
  refreshDailySummary,
  archiveOldSales,
  type SalesStats,
  type TableStats,
} from '@/services/reportsService';
import {
  Database,
  RefreshCw,
  Archive,
  TrendingUp,
  ShoppingCart,
  DollarSign,
  Calendar,
  Activity,
} from 'lucide-react';

export default function SystemStatus() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const [salesStats, setSalesStats] = useState<SalesStats | null>(null);
  const [tableStats, setTableStats] = useState<TableStats[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [stats, tables] = await Promise.all([getSalesStats(), getTableStats()]);
      setSalesStats(stats);
      setTableStats(tables);
    } catch (error) {
      console.error('Error loading system status:', error);
      toast({
        title: 'Error',
        description: 'Failed to load system status',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshViews = async () => {
    try {
      setRefreshing(true);
      await refreshAllMaterializedViews();
      toast({
        title: 'Success',
        description: 'Materialized views refreshed successfully',
      });
      await loadData();
    } catch (error) {
      console.error('Error refreshing views:', error);
      toast({
        title: 'Error',
        description: 'Failed to refresh materialized views',
        variant: 'destructive',
      });
    } finally {
      setRefreshing(false);
    }
  };

  const handleRefreshDaily = async () => {
    try {
      setRefreshing(true);
      await refreshDailySummary();
      toast({
        title: 'Success',
        description: 'Daily summary refreshed successfully',
      });
      await loadData();
    } catch (error) {
      console.error('Error refreshing daily summary:', error);
      toast({
        title: 'Error',
        description: 'Failed to refresh daily summary',
        variant: 'destructive',
      });
    } finally {
      setRefreshing(false);
    }
  };

  const handleArchive = async () => {
    try {
      setArchiving(true);
      const result = await archiveOldSales(12);
      toast({
        title: 'Success',
        description: result.message,
      });
      await loadData();
    } catch (error) {
      console.error('Error archiving sales:', error);
      toast({
        title: 'Error',
        description: 'Failed to archive old sales',
        variant: 'destructive',
      });
    } finally {
      setArchiving(false);
    }
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  const formatCurrency = (num: number) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">System Status</h1>
          <p className="text-muted-foreground">Monitor database performance and statistics</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleRefreshDaily}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh Daily
          </Button>
          <Button
            variant="outline"
            onClick={handleRefreshViews}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh All Views
          </Button>
          <Button
            variant="outline"
            onClick={handleArchive}
            disabled={archiving}
          >
            <Archive className={`h-4 w-4 mr-2 ${archiving ? 'animate-spin' : ''}`} />
            Archive Old Data
          </Button>
        </div>
      </div>

      {/* Sales Statistics */}
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

      {/* Average Transaction */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Performance Metrics
          </CardTitle>
          <CardDescription>Key performance indicators</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-6 w-full bg-muted" />
              <Skeleton className="h-6 w-full bg-muted" />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Average Transaction Value</span>
                <Badge variant="secondary">
                  {formatCurrency(salesStats?.avg_transaction || 0)} UZS
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Data Range</span>
                <Badge variant="outline">
                  {salesStats?.oldest_record
                    ? new Date(salesStats.oldest_record).toLocaleDateString()
                    : 'N/A'}{' '}
                  -{' '}
                  {salesStats?.newest_record
                    ? new Date(salesStats.newest_record).toLocaleDateString()
                    : 'N/A'}
                </Badge>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Database Tables */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Database Tables
          </CardTitle>
          <CardDescription>Table sizes and record counts</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-12 w-full bg-muted" />
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {tableStats.map((table) => (
                <div
                  key={table.table_name}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div>
                    <p className="font-medium">{table.table_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatNumber(table.row_count)} records
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{table.total_size}</p>
                    <p className="text-sm text-muted-foreground">
                      Table: {table.table_size} | Indexes: {table.indexes_size}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Performance Tips */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Optimization Tips</CardTitle>
          <CardDescription>Best practices for maintaining system performance</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span>
                <strong>Refresh materialized views nightly</strong> - Run "Refresh All Views" daily
                to keep dashboard stats up-to-date
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span>
                <strong>Archive old data</strong> - Keep only 12 months of active data for optimal
                query performance
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span>
                <strong>Use date filters</strong> - Always filter reports by date range to avoid
                loading millions of records
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span>
                <strong>Monitor table sizes</strong> - If tables exceed 5GB, consider archiving or
                partitioning
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span>
                <strong>Export large reports asynchronously</strong> - Use CSV export for reports
                with thousands of records
              </span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
