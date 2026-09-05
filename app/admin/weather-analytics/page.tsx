// app/admin/weather-analytics/page.tsx
'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { 
  Calendar, 
  Download, 
  RefreshCw, 
  Wind, 
  Thermometer, 
  Droplets, 
  Compass, 
  Loader2,
  TrendingUp,
  TrendingDown,
  Minus,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ComposedChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

const COLORS = ['#ef4444', '#f59e0b', '#3b82f6', '#10b981', '#8b5cf6'];

interface WeatherAnalytics {
  windSpeedData: {
    date: string;
    windSpeed: number;
    windGust: number;
  }[];
  temperatureData: {
    date: string;
    temperature: number;
    humidity: number;
  }[];
  kiteSuitabilityData: {
    name: string;
    value: number;
  }[];
  statistics: {
    avgWindSpeed: number;
    maxWindSpeed: number;
    minWindSpeed: number;
    avgTemperature: number;
    avgHumidity: number;
    totalLogs: number;
    todayAvgWind: number;
  };
}

// ==========================================
// PERBAIKAN: colorMap ditempatkan di luar komponen
// ==========================================
const colorMap: Record<string, string> = {
  'Tidak Layak': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  'Layak Ringan': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  'Layak Berat': 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  'Layak Semua': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
};

// ==========================================
// PERBAIKAN: Fallback untuk color yang tidak dikenal
// ==========================================
const getColorClass = (name: string): string => {
  return colorMap[name] || 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
};

export default function WeatherAnalyticsPage() {
  const [data, setData] = useState<WeatherAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30d');
  const [locationId, setLocationId] = useState('all');
  const [locations, setLocations] = useState<{ id: string; name: string }[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch locations once
  useEffect(() => {
    fetchLocations();
  }, []);

  // Fetch analytics when period or location changes
  useEffect(() => {
    fetchAnalytics();
  }, [period, locationId]);

  const fetchLocations = async () => {
    try {
      const response = await fetch('/api/admin/locations');
      if (response.ok) {
        const data = await response.json();
        setLocations(data.map((l: any) => ({ id: l.id, name: l.name })));
      }
    } catch (error) {
      console.error('Error fetching locations:', error);
    }
  };

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setRefreshing(false);
      const url = `/api/admin/weather-analytics?period=${period}&locationId=${locationId}`;
      console.log('📊 Fetching analytics:', url);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch analytics');
      }
      
      const result = await response.json();
      console.log('📊 Analytics data:', result);
      setData(result);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast.error('Gagal memuat data analitik');
      // Set empty data so page doesn't hang
      setData({
        windSpeedData: [],
        temperatureData: [],
        kiteSuitabilityData: [],
        statistics: {
          avgWindSpeed: 0,
          maxWindSpeed: 0,
          minWindSpeed: 0,
          avgTemperature: 0,
          avgHumidity: 0,
          totalLogs: 0,
          todayAvgWind: 0,
        },
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchAnalytics();
  };

  const handleExport = () => {
    if (!data) return;
    
    try {
      const csvData = data.windSpeedData.map((item, index) => ({
        date: item.date,
        windSpeed: item.windSpeed,
        windGust: item.windGust,
        temperature: data.temperatureData[index]?.temperature || 0,
        humidity: data.temperatureData[index]?.humidity || 0,
      }));
      
      const headers = ['Tanggal', 'Kecepatan Angin (km/h)', 'Hembusan (km/h)', 'Suhu (°C)', 'Kelembaban (%)'];
      const csvRows = [headers.join(',')];
      
      csvData.forEach(row => {
        const values = [row.date, row.windSpeed, row.windGust, row.temperature, row.humidity];
        csvRows.push(values.join(','));
      });
      
      const csv = csvRows.join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `weather-analytics-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      
      toast.success('Data berhasil diekspor');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Gagal mengekspor data');
    }
  };

  // ==========================================
  // PERBAIKAN: Handler dengan type (string | null)
  // ==========================================
  const handlePeriodChange = (value: string | null) => {
    setPeriod(value || '30d');
  };

  const handleLocationChange = (value: string | null) => {
    setLocationId(value || 'all');
  };

  if (loading) {
    return (
      <div className="p-4 md:p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="h-8 w-48 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
            <div className="h-4 w-64 bg-slate-200 dark:bg-slate-800 rounded mt-1 animate-pulse" />
          </div>
          <div className="h-10 w-32 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-slate-200 dark:bg-slate-800 animate-pulse rounded-lg" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <div key={i} className="h-[300px] bg-slate-200 dark:bg-slate-800 animate-pulse rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (!data || data.statistics.totalLogs === 0) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4">
            <Wind className="h-8 w-8 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-semibold">Tidak Ada Data</h2>
          <p className="text-muted-foreground mt-2">
            Belum ada data cuaca yang tersedia untuk ditampilkan
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Jalankan update cuaca dari halaman Settings → Weather API
          </p>
          <Button className="mt-4" onClick={handleRefresh}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>
    );
  }

  const hasWindData = data.windSpeedData && data.windSpeedData.length > 0;
  const hasTemperatureData = data.temperatureData && data.temperatureData.length > 0;
  const hasSuitabilityData = data.kiteSuitabilityData && data.kiteSuitabilityData.length > 0;
  const totalSuitability = data.kiteSuitabilityData.reduce((acc, item) => acc + item.value, 0);

  // Get wind status
  const getWindStatus = (speed: number) => {
    if (speed < 5) return { label: 'Tenang', color: 'text-slate-500', icon: Minus };
    if (speed < 15) return { label: 'Ringan', color: 'text-blue-500', icon: TrendingUp };
    if (speed < 30) return { label: 'Sedang', color: 'text-orange-500', icon: TrendingUp };
    if (speed < 45) return { label: 'Kencang', color: 'text-red-500', icon: TrendingUp };
    return { label: 'Sangat Kencang', color: 'text-purple-500', icon: TrendingUp };
  };

  const windStatus = getWindStatus(data.statistics.avgWindSpeed);
  const WindIcon = windStatus.icon;

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Wind className="h-6 w-6 text-sky-500" />
            Analitik Cuaca
          </h1>
          <p className="text-sm text-muted-foreground">
            Analisis mendalam data cuaca dan angin
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={period} onValueChange={handlePeriodChange}>
            <SelectTrigger className="w-32 h-9 text-sm">
              <SelectValue placeholder="Periode" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">7 Hari</SelectItem>
              <SelectItem value="30d">30 Hari</SelectItem>
              <SelectItem value="90d">90 Hari</SelectItem>
            </SelectContent>
          </Select>
          <Select value={locationId} onValueChange={handleLocationChange}>
            <SelectTrigger className="w-48 h-9 text-sm">
              <SelectValue placeholder="Pilih lokasi" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">📍 Semua Lokasi</SelectItem>
              {locations.map((loc) => (
                <SelectItem key={loc.id} value={loc.id}>
                  {loc.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing} className="h-9 gap-1">
            {refreshing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport} className="h-9 gap-1">
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="border-l-4 border-l-sky-500">
          <CardHeader className="pb-1">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <Wind className="h-3 w-3 text-sky-500" />
              Rata-rata Kecepatan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between">
              <span className="text-xl font-bold">{data.statistics.avgWindSpeed}</span>
              <span className="text-xs text-muted-foreground">km/h</span>
            </div>
            <div className={`text-xs ${windStatus.color} flex items-center gap-0.5 mt-0.5`}>
              <WindIcon className="h-3 w-3" />
              {windStatus.label}
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="pb-1">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <Wind className="h-3 w-3 text-orange-500" />
              Kecepatan Maks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between">
              <span className="text-xl font-bold">{data.statistics.maxWindSpeed}</span>
              <span className="text-xs text-muted-foreground">km/h</span>
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">
              Min: {data.statistics.minWindSpeed} km/h
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-red-500">
          <CardHeader className="pb-1">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <Thermometer className="h-3 w-3 text-red-500" />
              Rata-rata Suhu
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between">
              <span className="text-xl font-bold">{data.statistics.avgTemperature}</span>
              <span className="text-xs text-muted-foreground">°C</span>
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">
              {data.statistics.avgTemperature > 25 ? '☀️ Panas' : '🌤️ Sejuk'}
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-blue-400">
          <CardHeader className="pb-1">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <Calendar className="h-3 w-3 text-blue-500" />
              Total Data
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between">
              <span className="text-xl font-bold">{data.statistics.totalLogs}</span>
              <span className="text-xs text-muted-foreground">logs</span>
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">
              Hari ini: {data.statistics.todayAvgWind} km/h
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Wind Speed Chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Wind className="h-4 w-4 text-sky-500" />
            Kecepatan & Hembusan Angin
          </CardTitle>
          <CardDescription className="text-xs">
            Perbandingan kecepatan dan hembusan angin per hari
            {locationId !== 'all' && locations.find(l => l.id === locationId) && (
              <span className="font-medium text-foreground ml-1">
                - {locations.find(l => l.id === locationId)?.name}
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[280px]">
            {hasWindData ? (
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={data.windSpeedData}>
                  <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip 
                    formatter={(value, name) => {
                      // ==========================================
                      // PERBAIKAN: Gunakan type assertion untuk name
                      // ==========================================
                      const labels: Record<string, string> = {
                        windSpeed: 'Kecepatan',
                        windGust: 'Hembusan'
                      };
                      const label = labels[name as string] || name;
                      return [`${value} km/h`, label];
                    }}
                  />
                  <Legend />
                  <Bar dataKey="windSpeed" fill="#3b82f6" name="Kecepatan" radius={[4, 4, 0, 0]} />
                  <Line type="monotone" dataKey="windGust" stroke="#f59e0b" strokeWidth={2} name="Hembusan" />
                </ComposedChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <p>Belum ada data kecepatan angin</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Temperature & Humidity Chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Thermometer className="h-4 w-4 text-red-500" />
            Suhu & Kelembaban
          </CardTitle>
          <CardDescription className="text-xs">
            Tren suhu dan kelembaban udara
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[280px]">
            {hasTemperatureData ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.temperatureData}>
                  <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                  <YAxis yAxisId="left" tick={{ fontSize: 10 }} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Legend />
                  <Area 
                    type="monotone" 
                    dataKey="temperature" 
                    stroke="#ef4444" 
                    fill="#ef4444" 
                    fillOpacity={0.2}
                    yAxisId="left"
                    name="Suhu (°C)"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="humidity" 
                    stroke="#3b82f6" 
                    fill="#3b82f6" 
                    fillOpacity={0.2}
                    yAxisId="right"
                    name="Kelembaban (%)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <p>Belum ada data suhu dan kelembaban</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Kite Suitability Distribution */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Compass className="h-4 w-4 text-emerald-500" />
              Distribusi Kelayakan Layangan
            </CardTitle>
            <CardDescription className="text-xs">
              Analisis kelayakan berdasarkan data cuaca
            </CardDescription>
          </CardHeader>
          <CardContent>
            {hasSuitabilityData ? (
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.kiteSuitabilityData}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      label={({ name, value }) => {
                        const percent = totalSuitability > 0 ? (value / totalSuitability) * 100 : 0;
                        return `${name}: ${percent.toFixed(0)}%`;
                      }}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {data.kiteSuitabilityData.map((_entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex items-center justify-center h-[250px] text-muted-foreground">
                <p>Belum ada data kelayakan</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Calendar className="h-4 w-4 text-purple-500" />
              Ringkasan Cepat
            </CardTitle>
            <CardDescription className="text-xs">
              Statistik singkat data cuaca
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Wind className="h-4 w-4 text-sky-500" />
                  <span>Min Kecepatan</span>
                </div>
                <div className="mt-1 text-lg font-bold">{data.statistics.minWindSpeed} km/h</div>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Thermometer className="h-4 w-4 text-red-500" />
                  <span>Rata-rata Suhu</span>
                </div>
                <div className="mt-1 text-lg font-bold">{data.statistics.avgTemperature}°C</div>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Droplets className="h-4 w-4 text-blue-500" />
                  <span>Rata-rata Kelembaban</span>
                </div>
                <div className="mt-1 text-lg font-bold">{data.statistics.avgHumidity}%</div>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Compass className="h-4 w-4 text-emerald-500" />
                  <span>Hari ini</span>
                </div>
                <div className="mt-1 text-lg font-bold">{data.statistics.todayAvgWind} km/h</div>
              </div>
            </div>
            
            {/* Kite Suitability Badge Summary */}
            {hasSuitabilityData && (
              <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                <p className="text-xs text-muted-foreground mb-2">Kelayakan Terbanyak</p>
                <div className="flex flex-wrap gap-2">
                  {data.kiteSuitabilityData
                    .sort((a, b) => b.value - a.value)
                    .slice(0, 3)
                    .map((item) => {
                      const percent = totalSuitability > 0 ? (item.value / totalSuitability) * 100 : 0;
                      // ==========================================
                      // PERBAIKAN: Gunakan getColorClass
                      // ==========================================
                      return (
                        <Badge key={item.name} className={`${getColorClass(item.name)} text-xs`}>
                          {item.name}: {percent.toFixed(0)}%
                        </Badge>
                      );
                    })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}