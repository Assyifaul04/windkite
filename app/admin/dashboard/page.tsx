// app/admin/dashboard/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { 
  Users, 
  MapPin, 
  Cloud, 
  Image as ImageIcon,
  TrendingUp,
  TrendingDown,
  Activity,
  Wind,
  Compass,
  Calendar,
  ArrowUp,
  ArrowDown,
  Shield,
  UserPlus,
  Image,
  BarChart3,
  Eye,
  Clock,
  AlertCircle,
  CheckCircle,
  Loader2,
  XCircle,
  FrameIcon,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { format, formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';
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
  Legend,
} from 'recharts';
import Link from 'next/link';

interface DashboardStats {
  totalUsers: number;
  totalAdmins: number;
  totalLocations: number;
  totalWeatherLogs: number;
  totalDesigns: number;
  recentUsers: Array<{
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
    createdAt: string;
  }>;
  recentActivities: Array<{
    id: string;
    userId: string;
    userName: string;
    userImage: string | null;
    action: string;
    details: string;
    timestamp: string;
  }>;
  weatherStats: {
    avgWindSpeed: number;
    maxWindSpeed: number;
    minWindSpeed: number;
    avgTemperature: number;
    windDirection: string;
  };
  designStats: {
    totalFrames: number;
    totalCovers: number;
    publicDesigns: number;
    privateDesigns: number;
    pending: number;
    processing: number;
    completed: number;
    failed: number;
  };
  chartData: {
    date: string;
    users: number;
    locations: number;
    designs: number;
  }[];
}

const COLORS = ['#3b82f6', '#10b981', '#ec4899', '#f59e0b', '#ef4444', '#8b5cf6'];

const statusConfig = {
  PENDING: { label: 'Pending', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' },
  PROCESSING: { label: 'Processing', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
  COMPLETED: { label: 'Completed', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' },
  FAILED: { label: 'Failed', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' },
};

const actionConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  CREATE_LOCATION: { 
    label: 'Lokasi Baru', 
    color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
    icon: <MapPin className="h-3 w-3" />
  },
  CREATE_WEATHER: { 
    label: 'Data Cuaca', 
    color: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300',
    icon: <Cloud className="h-3 w-3" />
  },
  CREATE_DESIGN: { 
    label: 'Desain Baru', 
    color: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300',
    icon: <ImageIcon className="h-3 w-3" />
  },
  CREATE_FRAME: { 
    label: 'Frame Baru', 
    color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
    icon: <FrameIcon className="h-3 w-3" />
  },
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7d');

  useEffect(() => {
    fetchDashboardData();
  }, [timeRange]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/dashboard?range=${timeRange}`);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch dashboard data');
      }
      
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error fetching dashboard:', error);
      toast.error('Gagal memuat data dashboard');
    } finally {
      setLoading(false);
    }
  };

  const getActionBadge = (action: string) => {
    return actionConfig[action]?.color || 'bg-gray-100 text-gray-700 dark:bg-gray-800/50 dark:text-gray-300';
  };

  const getActionLabel = (action: string) => {
    return actionConfig[action]?.label || action;
  };

  const getActionIcon = (action: string) => {
    return actionConfig[action]?.icon || null;
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
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
        <div className="h-[300px] bg-slate-200 dark:bg-slate-800 animate-pulse rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="h-[300px] bg-slate-200 dark:bg-slate-800 animate-pulse rounded-lg" />
          <div className="h-[300px] bg-slate-200 dark:bg-slate-800 animate-pulse rounded-lg" />
        </div>
      </div>
    );
  }

  if (!stats) return null;

  // Prepare pie chart data
  const statusData = [
    { name: 'Pending', value: stats.designStats.pending, color: '#f59e0b' },
    { name: 'Processing', value: stats.designStats.processing, color: '#3b82f6' },
    { name: 'Completed', value: stats.designStats.completed, color: '#10b981' },
    { name: 'Failed', value: stats.designStats.failed, color: '#ef4444' },
  ].filter(item => item.value > 0);

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Dashboard Admin</h1>
          <p className="text-sm text-muted-foreground">
            Overview platform WindKite
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5">
            <Button 
              variant={timeRange === '7d' ? 'default' : 'ghost'} 
              size="sm"
              className="h-7 text-xs"
              onClick={() => setTimeRange('7d')}
            >
              7 Hari
            </Button>
            <Button 
              variant={timeRange === '30d' ? 'default' : 'ghost'} 
              size="sm"
              className="h-7 text-xs"
              onClick={() => setTimeRange('30d')}
            >
              30 Hari
            </Button>
            <Button 
              variant={timeRange === '90d' ? 'default' : 'ghost'} 
              size="sm"
              className="h-7 text-xs"
              onClick={() => setTimeRange('90d')}
            >
              90 Hari
            </Button>
          </div>
          <Button variant="outline" size="sm" onClick={fetchDashboardData} className="h-7">
            <Activity className="mr-1 h-3 w-3" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-1">
            <CardTitle className="text-xs font-medium text-muted-foreground">Total Pengguna</CardTitle>
            <Users className="h-4 w-4 text-sky-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <p className="text-[10px] text-muted-foreground">
              {stats.totalAdmins} Admin • {stats.totalUsers - stats.totalAdmins} User
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-1">
            <CardTitle className="text-xs font-medium text-muted-foreground">Lokasi</CardTitle>
            <MapPin className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalLocations}</div>
            <p className="text-[10px] text-muted-foreground">
              {stats.chartData[stats.chartData.length - 1]?.locations || 0} total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-1">
            <CardTitle className="text-xs font-medium text-muted-foreground">Data Cuaca</CardTitle>
            <Cloud className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalWeatherLogs}</div>
            <p className="text-[10px] text-muted-foreground">
              Rata-rata {stats.weatherStats.avgWindSpeed} km/h
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-1">
            <CardTitle className="text-xs font-medium text-muted-foreground">Desain</CardTitle>
            <ImageIcon className="h-4 w-4 text-pink-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalDesigns}</div>
            <p className="text-[10px] text-muted-foreground">
              {stats.designStats.publicDesigns} publik • {stats.designStats.privateDesigns} privat
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Statistik Pertumbuhan</CardTitle>
          <CardDescription className="text-xs">
            Perkembangan pengguna, lokasi, dan desain
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.chartData}>
                <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Area 
                  type="monotone" 
                  dataKey="users" 
                  stackId="1"
                  stroke="#3b82f6" 
                  fill="#3b82f6" 
                  fillOpacity={0.2}
                  name="Pengguna"
                />
                <Area 
                  type="monotone" 
                  dataKey="locations" 
                  stackId="1"
                  stroke="#10b981" 
                  fill="#10b981" 
                  fillOpacity={0.2}
                  name="Lokasi"
                />
                <Area 
                  type="monotone" 
                  dataKey="designs" 
                  stackId="1"
                  stroke="#ec4899" 
                  fill="#ec4899" 
                  fillOpacity={0.2}
                  name="Desain"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Weather & Design Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Weather Stats */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Statistik Cuaca</CardTitle>
            <CardDescription className="text-xs">Data angin dan suhu terkini</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-sky-50 dark:bg-sky-950/20 rounded-lg">
                <div className="flex items-center justify-between">
                  <Wind className="h-4 w-4 text-sky-500" />
                  <span className="text-[10px] text-muted-foreground">Kecepatan</span>
                </div>
                <div className="mt-1">
                  <div className="text-xl font-bold">{stats.weatherStats.avgWindSpeed} km/h</div>
                  <div className="flex items-center gap-2 text-[10px]">
                    <span className="text-green-500">↑ {stats.weatherStats.maxWindSpeed}</span>
                    <span className="text-red-500">↓ {stats.weatherStats.minWindSpeed}</span>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 rounded-lg">
                <div className="flex items-center justify-between">
                  <Compass className="h-4 w-4 text-emerald-500" />
                  <span className="text-[10px] text-muted-foreground">Arah</span>
                </div>
                <div className="mt-1">
                  <div className="text-xl font-bold">{stats.weatherStats.windDirection}</div>
                  <div className="text-[10px] text-muted-foreground">
                    {stats.weatherStats.avgTemperature}°C rata-rata
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Design Stats */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Statistik Desain</CardTitle>
            <CardDescription className="text-xs">Distribusi desain berdasarkan kategori</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-pink-50 dark:bg-pink-950/20 rounded-lg">
                <div className="flex items-center justify-between">
                  <FrameIcon className="h-4 w-4 text-pink-500" />
                  <span className="text-[10px] text-muted-foreground">Kerangka</span>
                </div>
                <div className="mt-1 text-xl font-bold">{stats.designStats.totalFrames}</div>
              </div>

              <div className="p-3 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
                <div className="flex items-center justify-between">
                  <ImageIcon className="h-4 w-4 text-purple-500" />
                  <span className="text-[10px] text-muted-foreground">Sampul</span>
                </div>
                <div className="mt-1 text-xl font-bold">{stats.designStats.totalCovers}</div>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-1 text-[10px]">
              <div className="flex items-center justify-between p-1.5 bg-slate-50 dark:bg-slate-800/50 rounded">
                <span className="text-muted-foreground">Publik</span>
                <span className="font-medium">{stats.designStats.publicDesigns}</span>
              </div>
              <div className="flex items-center justify-between p-1.5 bg-slate-50 dark:bg-slate-800/50 rounded">
                <span className="text-muted-foreground">Privat</span>
                <span className="font-medium">{stats.designStats.privateDesigns}</span>
              </div>
            </div>

            {/* Status Distribution */}
            {statusData.length > 0 && (
              <div className="mt-3">
                <p className="text-[10px] text-muted-foreground mb-1">Status Desain</p>
                <div className="flex gap-1 h-2">
                  {statusData.map((item, index) => (
                    <div
                      key={item.name}
                      className="rounded-full"
                      style={{
                        width: `${(item.value / stats.totalDesigns) * 100}%`,
                        backgroundColor: item.color,
                      }}
                    />
                  ))}
                </div>
                <div className="flex flex-wrap gap-2 mt-1">
                  {statusData.map((item) => (
                    <span key={item.name} className="flex items-center gap-1 text-[9px] text-muted-foreground">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                      {item.name}: {item.value}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm">Aktivitas Terbaru</CardTitle>
              <CardDescription className="text-xs">
                Aktivitas terbaru dari semua pengguna
              </CardDescription>
            </div>
            <Link href="/admin/activity">
              <Button variant="ghost" size="sm" className="h-7 text-xs">
                Lihat Semua
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {stats.recentActivities.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              Belum ada aktivitas
            </div>
          ) : (
            <div className="divide-y divide-slate-200 dark:divide-slate-800">
              {stats.recentActivities.slice(0, 8).map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-center gap-3 p-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={activity.userImage || ''} />
                    <AvatarFallback className="text-xs">
                      {activity.userName?.charAt(0).toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm truncate max-w-[120px]">
                        {activity.userName || 'Unknown'}
                      </span>
                      <Badge className={`${getActionBadge(activity.action)} text-[9px] px-1.5 py-0`}>
                        {getActionIcon(activity.action)}
                        {getActionLabel(activity.action)}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {activity.details}
                    </p>
                  </div>

                  <div className="text-[10px] text-muted-foreground whitespace-nowrap">
                    {formatDistanceToNow(new Date(activity.timestamp), {
                      addSuffix: true,
                      locale: id,
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Users */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm">Pengguna Terbaru</CardTitle>
              <CardDescription className="text-xs">
                Daftar pengguna yang baru bergabung
              </CardDescription>
            </div>
            <Link href="/admin/users">
              <Button variant="ghost" size="sm" className="h-7 text-xs">
                Lihat Semua
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {stats.recentUsers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              Belum ada pengguna baru
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Pengguna</TableHead>
                  <TableHead className="text-xs">Email</TableHead>
                  <TableHead className="text-xs">Bergabung</TableHead>
                  <TableHead className="text-right text-xs">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.recentUsers.slice(0, 5).map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={user.image || ''} />
                          <AvatarFallback className="text-[10px]">
                            {user.name?.charAt(0).toUpperCase() || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium truncate max-w-[100px]">
                          {user.name || 'Tidak ada nama'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{user.email || '-'}</TableCell>
                    <TableCell className="text-sm">
                      {format(new Date(user.createdAt), 'dd MMM yyyy', { locale: id })}
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/admin/users/${user.id}`}>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                          <Eye className="h-3 w-3" />
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}