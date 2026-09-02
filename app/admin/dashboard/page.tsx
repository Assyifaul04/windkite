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
  Clock
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
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

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
    userName: string | null;
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
  };
  chartData: {
    date: string;
    users: number;
    locations: number;
    designs: number;
  }[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

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
        throw new Error('Failed to fetch dashboard data');
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
    const styles: Record<string, string> = {
      CREATE_LOCATION: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
      UPDATE_LOCATION: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
      DELETE_LOCATION: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
      CREATE_WEATHER: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300',
      CREATE_DESIGN: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300',
      UPDATE_DESIGN: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
      DELETE_DESIGN: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
    };
    return styles[action] || 'bg-gray-100 text-gray-700 dark:bg-gray-800/50 dark:text-gray-300';
  };

  const getActionLabel = (action: string) => {
    const labels: Record<string, string> = {
      CREATE_LOCATION: '📍 Lokasi Baru',
      UPDATE_LOCATION: '📝 Update Lokasi',
      DELETE_LOCATION: '🗑️ Hapus Lokasi',
      CREATE_WEATHER: '🌤️ Data Cuaca',
      CREATE_DESIGN: '🎨 Desain AI',
      UPDATE_DESIGN: '✏️ Update Desain',
      DELETE_DESIGN: '🗑️ Hapus Desain',
    };
    return labels[action] || action;
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

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Dashboard Admin</h1>
          <p className="text-sm text-muted-foreground">
            Overview platform WindKite
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setTimeRange('7d')}>
            7 Hari
          </Button>
          <Button variant="outline" size="sm" onClick={() => setTimeRange('30d')}>
            30 Hari
          </Button>
          <Button variant="outline" size="sm" onClick={() => setTimeRange('90d')}>
            90 Hari
          </Button>
          <Button variant="outline" size="sm" onClick={fetchDashboardData}>
            <Activity className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Pengguna</CardTitle>
            <Users className="h-4 w-4 text-sky-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalAdmins} Admin • {stats.totalUsers - stats.totalAdmins} User
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Lokasi</CardTitle>
            <MapPin className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalLocations}</div>
            <p className="text-xs text-muted-foreground">
              {stats.chartData[stats.chartData.length - 1]?.locations || 0} baru
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Data Cuaca</CardTitle>
            <Cloud className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalWeatherLogs}</div>
            <p className="text-xs text-muted-foreground">
              Rata-rata {stats.weatherStats.avgWindSpeed} km/h
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Desain AI</CardTitle>
            <ImageIcon className="h-4 w-4 text-pink-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalDesigns}</div>
            <p className="text-xs text-muted-foreground">
              {stats.designStats.publicDesigns} publik • {stats.designStats.privateDesigns} privat
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Statistik Pertumbuhan</CardTitle>
          <CardDescription>
            Perkembangan pengguna, lokasi, dan desain AI
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Area 
                  type="monotone" 
                  dataKey="users" 
                  stackId="1"
                  stroke="#3b82f6" 
                  fill="#3b82f6" 
                  fillOpacity={0.3}
                  name="Pengguna"
                />
                <Area 
                  type="monotone" 
                  dataKey="locations" 
                  stackId="1"
                  stroke="#10b981" 
                  fill="#10b981" 
                  fillOpacity={0.3}
                  name="Lokasi"
                />
                <Area 
                  type="monotone" 
                  dataKey="designs" 
                  stackId="1"
                  stroke="#ec4899" 
                  fill="#ec4899" 
                  fillOpacity={0.3}
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
          <CardHeader>
            <CardTitle>Statistik Cuaca</CardTitle>
            <CardDescription>Data angin dan suhu terkini</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-sky-50 dark:bg-sky-950/20 rounded-lg">
                <div className="flex items-center justify-between">
                  <Wind className="h-5 w-5 text-sky-500" />
                  <span className="text-sm text-muted-foreground">Kecepatan</span>
                </div>
                <div className="mt-2">
                  <div className="text-2xl font-bold">{stats.weatherStats.avgWindSpeed} km/h</div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-green-500">↑ {stats.weatherStats.maxWindSpeed}</span>
                    <span className="text-red-500">↓ {stats.weatherStats.minWindSpeed}</span>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 rounded-lg">
                <div className="flex items-center justify-between">
                  <Compass className="h-5 w-5 text-emerald-500" />
                  <span className="text-sm text-muted-foreground">Arah</span>
                </div>
                <div className="mt-2">
                  <div className="text-2xl font-bold">{stats.weatherStats.windDirection}</div>
                  <div className="text-sm text-muted-foreground">
                    {stats.weatherStats.avgTemperature}°C rata-rata
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Design Stats */}
        <Card>
          <CardHeader>
            <CardTitle>Statistik Desain AI</CardTitle>
            <CardDescription>Distribusi desain berdasarkan kategori</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-pink-50 dark:bg-pink-950/20 rounded-lg">
                <div className="flex items-center justify-between">
                  <Image className="h-5 w-5 text-pink-500" />
                  <span className="text-sm text-muted-foreground">Kerangka</span>
                </div>
                <div className="mt-2 text-2xl font-bold">{stats.designStats.totalFrames}</div>
              </div>

              <div className="p-4 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
                <div className="flex items-center justify-between">
                  <Image className="h-5 w-5 text-purple-500" />
                  <span className="text-sm text-muted-foreground">Sampul</span>
                </div>
                <div className="mt-2 text-2xl font-bold">{stats.designStats.totalCovers}</div>
              </div>
            </div>

            <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
              <div className="flex items-center justify-between text-sm">
                <span>Publik</span>
                <span className="font-medium">{stats.designStats.publicDesigns}</span>
              </div>
              <div className="flex items-center justify-between text-sm mt-1">
                <span>Privat</span>
                <span className="font-medium">{stats.designStats.privateDesigns}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Aktivitas Terbaru</CardTitle>
          <CardDescription>
            Aktivitas terbaru dari semua pengguna
          </CardDescription>
        </CardHeader>
        <CardContent>
          {stats.recentActivities.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Belum ada aktivitas
            </div>
          ) : (
            <div className="space-y-4">
              {stats.recentActivities.slice(0, 10).map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-center gap-4 p-3 border rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                >
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={activity.userImage || ''} />
                    <AvatarFallback>
                      {activity.userName?.charAt(0).toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm">
                        {activity.userName || 'Pengguna tidak dikenal'}
                      </span>
                      <Badge className={getActionBadge(activity.action)}>
                        {getActionLabel(activity.action)}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {activity.details}
                    </p>
                  </div>

                  <div className="text-xs text-muted-foreground whitespace-nowrap">
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
        <CardHeader>
          <CardTitle>Pengguna Terbaru</CardTitle>
          <CardDescription>
            Daftar pengguna yang baru bergabung
          </CardDescription>
        </CardHeader>
        <CardContent>
          {stats.recentUsers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Belum ada pengguna baru
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Pengguna</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Bergabung</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.recentUsers.slice(0, 5).map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={user.image || ''} />
                          <AvatarFallback>
                            {user.name?.charAt(0).toUpperCase() || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{user.name || 'Tidak ada nama'}</span>
                      </div>
                    </TableCell>
                    <TableCell>{user.email || '-'}</TableCell>
                    <TableCell>
                      {format(new Date(user.createdAt), 'dd MMM yyyy', { locale: id })}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
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