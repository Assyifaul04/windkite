// app/admin/system/database/page.tsx
'use client';

import { useState, useEffect } from 'react';
import {
  Database,
  Server,
  Activity,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  HardDrive,
  Cpu,
  MemoryStick,
  Network,
  Table as TableIcon, // ← Ubah ini
  Layers,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Link,
  Key,
  Users,
  MapPin,
  Cloud,
  Image as ImageIcon,
  GitBranch,
  Calendar,
  ArrowUp,
  ArrowDown,
  Info
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,          // ← Ini dari @/components/ui/table
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from 'recharts';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

interface DatabaseStatus {
  connection: {
    status: 'connected' | 'disconnected' | 'error';
    latency: number;
    lastCheck: string;
  };
  stats: {
    totalTables: number;
    totalRecords: number;
    totalSize: string;
    totalSizeBytes: number;
  };
  tables: {
    name: string;
    count: number;
    size: string;
    lastUpdated: string;
  }[];
  performance: {
    queriesPerSecond: number;
    averageQueryTime: number;
    cacheHitRate: number;
    connections: number;
    maxConnections: number;
  };
  health: {
    status: 'healthy' | 'degraded' | 'critical';
    issues: string[];
    warnings: string[];
  };
  trends: {
    date: string;
    queries: number;
    connections: number;
    responseTime: number;
  }[];
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function DatabaseStatusPage() {
  const [status, setStatus] = useState<DatabaseStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    fetchStatus();
    
    let interval: NodeJS.Timeout;
    if (autoRefresh) {
      interval = setInterval(fetchStatus, 30000); // Refresh every 30 seconds
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh]);

  const fetchStatus = async () => {
    try {
      const response = await fetch('/api/admin/system/database');
      
      if (!response.ok) {
        throw new Error('Failed to fetch database status');
      }
      
      const data = await response.json();
      setStatus(data);
    } catch (error) {
      console.error('Error fetching database status:', error);
      toast.error('Gagal memuat status database');
    } finally {
      setLoading(false);
    }
  };

  const getHealthBadge = (status: string) => {
    const styles: Record<string, string> = {
      healthy: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
      degraded: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
      critical: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
    };
    const labels: Record<string, string> = {
      healthy: 'Sehat',
      degraded: 'Menurun',
      critical: 'Kritis',
    };
    return <Badge className={styles[status]}>{labels[status]}</Badge>;
  };

  const getConnectionBadge = (status: string) => {
    const styles: Record<string, string> = {
      connected: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
      disconnected: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
      error: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
    };
    const labels: Record<string, string> = {
      connected: 'Terhubung',
      disconnected: 'Terputus',
      error: 'Error',
    };
    return <Badge className={styles[status]}>{labels[status]}</Badge>;
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="h-10 w-48 bg-slate-200 dark:bg-slate-800 animate-pulse rounded" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-slate-200 dark:bg-slate-800 animate-pulse rounded-lg" />
          ))}
        </div>
        <div className="h-[300px] bg-slate-200 dark:bg-slate-800 animate-pulse rounded-lg" />
        <div className="h-[200px] bg-slate-200 dark:bg-slate-800 animate-pulse rounded-lg" />
      </div>
    );
  }

  if (!status) return null;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Status Database</h1>
          <p className="text-sm text-muted-foreground">
            Kesehatan dan metrik database
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={autoRefresh ? 'default' : 'outline'}
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            {autoRefresh ? 'Auto Refresh On' : 'Auto Refresh Off'}
          </Button>
          <Button variant="outline" onClick={fetchStatus}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Connection Status */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Koneksi Database</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6 flex-wrap">
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5 text-sky-500" />
              <span className="font-medium">Status:</span>
              {getConnectionBadge(status.connection.status)}
            </div>
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-emerald-500" />
              <span className="font-medium">Latensi:</span>
              <span>{status.connection.latency}ms</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-slate-500" />
              <span className="font-medium">Terakhir cek:</span>
              <span>
                {format(new Date(status.connection.lastCheck), 'dd MMM yyyy HH:mm:ss', { locale: id })}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {status.connection.status === 'connected' ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500" />
              )}
              <span className="text-sm text-muted-foreground">
                {status.connection.status === 'connected' ? 'Database siap digunakan' : 'Masalah koneksi'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Tabel</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <TableIcon className="h-4 w-4 text-blue-500" /> {/* ← Gunakan TableIcon */}
              <span className="text-2xl font-bold">{status.stats.totalTables}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Records</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-emerald-500" />
              <span className="text-2xl font-bold">
                {status.stats.totalRecords.toLocaleString()}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Size</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <HardDrive className="h-4 w-4 text-orange-500" />
              <span className="text-2xl font-bold">{status.stats.totalSize}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Health Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {getHealthBadge(status.health.status)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Queries/Second</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{status.performance.queriesPerSecond}</div>
            <Progress value={status.performance.queriesPerSecond / 10 * 100} className="h-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Avg Query Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{status.performance.averageQueryTime}ms</div>
            <p className="text-xs text-muted-foreground">Rata-rata waktu query</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Cache Hit Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{status.performance.cacheHitRate}%</div>
            <Progress value={status.performance.cacheHitRate} className="h-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Connections</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {status.performance.connections} / {status.performance.maxConnections}
            </div>
            <Progress 
              value={(status.performance.connections / status.performance.maxConnections) * 100} 
              className="h-2" 
            />
          </CardContent>
        </Card>
      </div>

      {/* Performance Trends */}
      <Card>
        <CardHeader>
          <CardTitle>Trend Kinerja</CardTitle>
          <CardDescription>Query, koneksi, dan waktu respons</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={status.trends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Area 
                  type="monotone" 
                  dataKey="queries" 
                  stroke="#3b82f6" 
                  fill="#3b82f6" 
                  fillOpacity={0.2}
                  yAxisId="left"
                  name="Queries"
                />
                <Area 
                  type="monotone" 
                  dataKey="connections" 
                  stroke="#10b981" 
                  fill="#10b981" 
                  fillOpacity={0.2}
                  yAxisId="right"
                  name="Connections"
                />
                <Area 
                  type="monotone" 
                  dataKey="responseTime" 
                  stroke="#f59e0b" 
                  fill="#f59e0b" 
                  fillOpacity={0.2}
                  yAxisId="right"
                  name="Response Time"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Table Details */}
      <Card>
        <CardHeader>
          <CardTitle>Detail Tabel</CardTitle>
          <CardDescription>Informasi setiap tabel di database</CardDescription>
        </CardHeader>
        <CardContent>
          <Table> {/* ← Ini dari @/components/ui/table */}
            <TableHeader>
              <TableRow>
                <TableHead>Nama Tabel</TableHead>
                <TableHead>Records</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Last Updated</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {status.tables.map((table) => (
                <TableRow key={table.name}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <TableIcon className="h-4 w-4 text-blue-500" /> {/* ← Gunakan TableIcon */}
                      <span className="font-mono text-sm">{table.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>{table.count.toLocaleString()}</TableCell>
                  <TableCell>{table.size}</TableCell>
                  <TableCell>
                    {format(new Date(table.lastUpdated), 'dd MMM yyyy HH:mm', { locale: id })}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Health Issues */}
      {(status.health.issues.length > 0 || status.health.warnings.length > 0) && (
        <Card className="border-yellow-200 dark:border-yellow-800">
          <CardHeader>
            <CardTitle className="text-yellow-600 dark:text-yellow-400">
              <AlertCircle className="inline mr-2 h-5 w-5" />
              Health Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            {status.health.issues.length > 0 && (
              <div className="space-y-2 mb-4">
                <p className="font-medium text-red-600 dark:text-red-400">Issues:</p>
                {status.health.issues.map((issue, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
                    <XCircle className="h-4 w-4" />
                    <span>{issue}</span>
                  </div>
                ))}
              </div>
            )}
            {status.health.warnings.length > 0 && (
              <div className="space-y-2">
                <p className="font-medium text-yellow-600 dark:text-yellow-400">Warnings:</p>
                {status.health.warnings.map((warning, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-yellow-600 dark:text-yellow-400">
                    <AlertCircle className="h-4 w-4" />
                    <span>{warning}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}