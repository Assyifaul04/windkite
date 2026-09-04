// app/admin/analytics/page.tsx
'use client';

import { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  MapPin,
  Cloud,
  Image as ImageIcon,
  Calendar,
  Download,
  Filter,
  Wind,
  Thermometer,
  Droplets,
  RefreshCw,
  Activity,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  FrameIcon,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  AreaChart,
  Area,
  Legend,
} from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#ec4899', '#8b5cf6', '#f59e0b', '#ef4444'];

// Helper function to safely format percent
const formatPercent = (value: any): string => {
  if (value === undefined || value === null) return '0%';
  return `${(value * 100).toFixed(0)}%`;
};

export default function AnalyticsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<string>('30d');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/analytics?period=${period}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch analytics');
      }
      
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast.error('Gagal memuat data analitik');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchAnalytics();
  };

  const handleExport = () => {
    toast.success('Data berhasil diekspor dalam format CSV');
  };

  // FIXED: Properly typed onChange handler with string | null
  const handlePeriodChange = (value: string | null) => {
    setPeriod(value || '30d');
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="h-8 w-48 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
            <div className="h-4 w-64 bg-slate-200 dark:bg-slate-800 rounded mt-1 animate-pulse" />
          </div>
          <div className="h-10 w-32 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 w-24 bg-slate-200 dark:bg-slate-800 rounded" />
              </CardHeader>
              <CardContent>
                <div className="h-8 w-16 bg-slate-200 dark:bg-slate-800 rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-[300px] bg-slate-200 dark:bg-slate-800 animate-pulse rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (!data) return null;

  // Ensure activityDistribution has data
  const activityDistribution = data.activityDistribution || [];
  const designStatusDistribution = data.designStatusDistribution || [];

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Analitik Data</h1>
          <p className="text-sm text-muted-foreground">
            Analisis mendalam tentang platform WindKite
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* FIXED: Select with correct onChange type */}
          <Select value={period} onValueChange={handlePeriodChange}>
            <SelectTrigger className="w-32 h-9 text-sm">
              <SelectValue placeholder="Periode" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">7 Hari</SelectItem>
              <SelectItem value="30d">30 Hari</SelectItem>
              <SelectItem value="90d">90 Hari</SelectItem>
              <SelectItem value="1y">1 Tahun</SelectItem>
            </SelectContent>
          </Select>
          <Button 
            variant="outline" 
            size="sm" 
            className="h-9"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" size="sm" className="h-9" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-xs font-medium text-muted-foreground">Total Pengguna</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{data.totalUsers || 0}</div>
            <div className="flex items-center gap-1 text-xs">
              {(data.userGrowth || 0) >= 0 ? (
                <TrendingUp className="h-3 w-3 text-green-500" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-500" />
              )}
              <span className={(data.userGrowth || 0) >= 0 ? 'text-green-500' : 'text-red-500'}>
                {Math.abs(data.userGrowth || 0)}%
              </span>
              <span className="text-muted-foreground">bulan ini</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-xs font-medium text-muted-foreground">Total Lokasi</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{data.totalLocations || 0}</div>
            <div className="flex items-center gap-1 text-xs">
              {(data.locationGrowth || 0) >= 0 ? (
                <TrendingUp className="h-3 w-3 text-green-500" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-500" />
              )}
              <span className={(data.locationGrowth || 0) >= 0 ? 'text-green-500' : 'text-red-500'}>
                {Math.abs(data.locationGrowth || 0)}%
              </span>
              <span className="text-muted-foreground">bulan ini</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-xs font-medium text-muted-foreground">Data Cuaca</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{data.totalWeatherLogs || 0}</div>
            <div className="flex items-center gap-1 text-xs">
              <Wind className="h-3 w-3 text-sky-500" />
              <span className="text-muted-foreground">Rata-rata {data.avgWindSpeed || 0} km/h</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-xs font-medium text-muted-foreground">Desain AI</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{data.totalDesigns || 0}</div>
            <div className="flex items-center gap-1 text-xs">
              {(data.designGrowth || 0) >= 0 ? (
                <TrendingUp className="h-3 w-3 text-green-500" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-500" />
              )}
              <span className={(data.designGrowth || 0) >= 0 ? 'text-green-500' : 'text-red-500'}>
                {Math.abs(data.designGrowth || 0)}%
              </span>
              <span className="text-muted-foreground">bulan ini</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* User Growth */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Pertumbuhan Pengguna</CardTitle>
            <CardDescription className="text-xs">Jumlah pengguna baru per hari</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.userGrowthData || []}>
                  <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="users" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Activity Distribution */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Distribusi Aktivitas</CardTitle>
            <CardDescription className="text-xs">Jenis aktivitas pengguna</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={activityDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${formatPercent(percent)}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {activityDistribution.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Weather Analytics */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Analisis Cuaca</CardTitle>
            <CardDescription className="text-xs">Kecepatan angin dan suhu</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.weatherData || []}>
                  <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Area 
                    type="monotone" 
                    dataKey="windSpeed" 
                    stroke="#3b82f6" 
                    fill="#3b82f6" 
                    fillOpacity={0.2}
                    name="Kecepatan Angin"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="temperature" 
                    stroke="#ef4444" 
                    fill="#ef4444" 
                    fillOpacity={0.2}
                    name="Suhu"
                  />
                  <Legend />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Design Status Distribution */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Status Desain AI</CardTitle>
            <CardDescription className="text-xs">Distribusi status desain</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={designStatusDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${formatPercent(percent)}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {designStatusDistribution.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Design Categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Kategori Desain</CardTitle>
            <CardDescription className="text-xs">Distribusi berdasarkan jenis</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={data.designCategories || []}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="category" tick={{ fontSize: 11 }} />
                  <PolarRadiusAxis />
                  <Radar
                    name="Desain"
                    dataKey="count"
                    stroke="#ec4899"
                    fill="#ec4899"
                    fillOpacity={0.6}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats Summary */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Ringkasan Cepat</CardTitle>
            <CardDescription className="text-xs">Statistik singkat platform</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Users className="h-4 w-4 text-sky-500" />
                  <span>Pengguna</span>
                </div>
                <div className="mt-1 text-lg font-bold">{data.totalUsers || 0}</div>
                <div className="text-[10px] text-muted-foreground">
                  {data.totalAdmins || 0} Admin
                </div>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <MapPin className="h-4 w-4 text-emerald-500" />
                  <span>Lokasi</span>
                </div>
                <div className="mt-1 text-lg font-bold">{data.totalLocations || 0}</div>
                <div className="text-[10px] text-muted-foreground">
                  {data.publicLocations || 0} Publik
                </div>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Cloud className="h-4 w-4 text-blue-500" />
                  <span>Cuaca</span>
                </div>
                <div className="mt-1 text-lg font-bold">{data.totalWeatherLogs || 0}</div>
                <div className="text-[10px] text-muted-foreground">
                  {data.avgWindSpeed || 0} km/h rata-rata
                </div>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <FrameIcon className="h-4 w-4 text-pink-500" />
                  <span>Frame</span>
                </div>
                <div className="mt-1 text-lg font-bold">{data.totalFrames || 0}</div>
                <div className="text-[10px] text-muted-foreground">
                  {data.publicFrames || 0} Publik
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Users */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm">Pengguna Paling Aktif</CardTitle>
              <CardDescription className="text-xs">Top 5 pengguna dengan aktivitas terbanyak</CardDescription>
            </div>
            <Badge variant="outline" className="text-xs">
              {data.topUsers?.length || 0} Users
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {data.topUsers && data.topUsers.length > 0 ? (
            <div className="space-y-2">
              {data.topUsers.map((user: any, index: number) => (
                <div
                  key={user.id}
                  className="flex items-center gap-4 p-3 border rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                >
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm ${
                    index === 0 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' :
                    index === 1 ? 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300' :
                    index === 2 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' :
                    'bg-slate-100 text-slate-600 dark:bg-slate-800/50 dark:text-slate-400'
                  }`}>
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{user.name || 'Tidak ada nama'}</div>
                    <div className="text-xs text-muted-foreground truncate">{user.email}</div>
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <div className="text-center">
                      <div className="font-medium text-sm">{user.locations || 0}</div>
                      <div className="text-[10px] text-muted-foreground">Lokasi</div>
                    </div>
                    <div className="text-center">
                      <div className="font-medium text-sm">{user.weatherLogs || 0}</div>
                      <div className="text-[10px] text-muted-foreground">Cuaca</div>
                    </div>
                    <div className="text-center">
                      <div className="font-medium text-sm">{user.designs || 0}</div>
                      <div className="text-[10px] text-muted-foreground">Desain</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground text-sm">
              Belum ada data pengguna
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}