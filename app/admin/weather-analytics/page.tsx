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
import { Calendar, Download, RefreshCw, Wind, Thermometer, Droplets, Compass } from 'lucide-react';
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
  Scatter,
  ScatterChart,
  ZAxis,
} from 'recharts';

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
  };
}

export default function WeatherAnalyticsPage() {
  const [data, setData] = useState<WeatherAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30d');
  const [locationId, setLocationId] = useState('all');
  const [locations, setLocations] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    fetchLocations();
  }, []);

  useEffect(() => {
    if (locations.length > 0) {
      fetchAnalytics();
    }
  }, [period, locationId]);

  const fetchLocations = async () => {
    try {
      const response = await fetch('/api/admin/locations');
      const data = await response.json();
      setLocations(data.map((l: any) => ({ id: l.id, name: l.name })));
    } catch (error) {
      console.error('Error fetching locations:', error);
    }
  };

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const url = `/api/admin/weather-analytics?period=${period}&locationId=${locationId}`;
      const response = await fetch(url);
      
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
    }
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <div key={i} className="h-[300px] bg-slate-200 dark:bg-slate-800 animate-pulse rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Analitik Cuaca</h1>
          <p className="text-sm text-muted-foreground">
            Analisis mendalam data cuaca dan angin
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Periode" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">7 Hari</SelectItem>
              <SelectItem value="30d">30 Hari</SelectItem>
              <SelectItem value="90d">90 Hari</SelectItem>
            </SelectContent>
          </Select>
          <Select value={locationId} onValueChange={setLocationId}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Pilih lokasi" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Lokasi</SelectItem>
              {locations.map((loc) => (
                <SelectItem key={loc.id} value={loc.id}>
                  {loc.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={fetchAnalytics}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Rata-rata Kecepatan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Wind className="h-4 w-4 text-sky-500" />
              <span className="text-2xl font-bold">{data.statistics.avgWindSpeed} km/h</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Kecepatan Maks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Wind className="h-4 w-4 text-orange-500" />
              <span className="text-2xl font-bold">{data.statistics.maxWindSpeed} km/h</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Rata-rata Suhu</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Thermometer className="h-4 w-4 text-red-500" />
              <span className="text-2xl font-bold">{data.statistics.avgTemperature}°C</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Data</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-blue-500" />
              <span className="text-2xl font-bold">{data.statistics.totalLogs}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Wind Speed Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Kecepatan & Hembusan Angin</CardTitle>
          <CardDescription>Perbandingan kecepatan dan hembusan angin per hari</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={data.windSpeedData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="windSpeed" fill="#3b82f6" name="Kecepatan" />
                <Line type="monotone" dataKey="windGust" stroke="#f59e0b" name="Hembusan" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Temperature & Humidity Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Suhu & Kelembaban</CardTitle>
          <CardDescription>Tren suhu dan kelembaban udara</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.temperatureData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Area 
                  type="monotone" 
                  dataKey="temperature" 
                  stroke="#ef4444" 
                  fill="#ef4444" 
                  fillOpacity={0.2}
                  yAxisId="left"
                  name="Suhu"
                />
                <Area 
                  type="monotone" 
                  dataKey="humidity" 
                  stroke="#3b82f6" 
                  fill="#3b82f6" 
                  fillOpacity={0.2}
                  yAxisId="right"
                  name="Kelembaban"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Kite Suitability Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Distribusi Kelayakan Layangan</CardTitle>
          <CardDescription>Analisis kelayakan berdasarkan data cuaca</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {data.kiteSuitabilityData.map((item) => (
              <div key={item.name} className="p-4 border rounded-lg text-center">
                <div className="text-2xl font-bold">{item.value}</div>
                <div className="text-sm text-muted-foreground">{item.name}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}