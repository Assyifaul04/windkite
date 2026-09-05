// app/admin/wind-rose/page.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
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
import { Compass, RefreshCw, Download, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';

interface WindData {
  direction: number;
  speed: number;
  count: number;
}

interface Location {
  id: string;
  name: string;
}

const DIRECTION_LABELS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
const DIRECTION_ANGLES = [0, 45, 90, 135, 180, 225, 270, 315];
const SPEED_COLORS = ['#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe'];
const SPEED_LABELS = ['0-10 km/h', '11-20 km/h', '21-30 km/h', '30+ km/h'];

export default function WindRosePage() {
  const [data, setData] = useState<WindData[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30d');
  const [locationId, setLocationId] = useState('all');
  const [locations, setLocations] = useState<Location[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    fetchLocations();
  }, []);

  useEffect(() => {
    fetchWindRose();
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

  const fetchWindRose = async () => {
    try {
      setLoading(true);
      setRefreshing(false);
      const url = `/api/admin/wind-rose?period=${period}&locationId=${locationId}`;
      console.log('🌹 Fetching wind rose:', url);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch wind rose data');
      }
      
      const result = await response.json();
      console.log('🌹 Wind rose data:', result);
      setData(result);
    } catch (error) {
      console.error('Error fetching wind rose:', error);
      toast.error('Gagal memuat data wind rose');
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchWindRose();
  };

  // PERBAIKAN: Handler dengan tipe string | null
  const handlePeriodChange = (value: string | null) => {
    setPeriod(value || '30d');
  };

  const handleLocationChange = (value: string | null) => {
    setLocationId(value || 'all');
  };

  useEffect(() => {
    if (data.length > 0 && !loading) {
      drawWindRose();
    }
  }, [data, loading]);

  const drawWindRose = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size for retina display
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const maxRadius = Math.min(width, height) / 2 - 80;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Find max count for scaling
    const maxCount = Math.max(...data.map(d => d.count), 1);

    // Draw concentric circles
    for (let i = 1; i <= 4; i++) {
      const radius = (maxRadius / 4) * i;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.3)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.stroke();
      ctx.setLineDash([]);

      // Label percentage
      const percentage = Math.round((i / 4) * 100);
      ctx.fillStyle = 'rgba(148, 163, 184, 0.6)';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${percentage}%`, centerX + 8, centerY - radius);
    }

    // Draw direction lines
    DIRECTION_ANGLES.forEach((angle, i) => {
      const rad = (angle * Math.PI) / 180;
      const x = centerX + Math.sin(rad) * maxRadius;
      const y = centerY - Math.cos(rad) * maxRadius;
      
      // Line from center
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(x, y);
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.2)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Direction label
      const labelX = centerX + Math.sin(rad) * (maxRadius + 25);
      const labelY = centerY - Math.cos(rad) * (maxRadius + 25);
      ctx.fillStyle = '#64748b';
      ctx.font = '13px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(DIRECTION_LABELS[i], labelX, labelY);
    });

    // Draw wind data bars
    data.forEach((item) => {
      const rad = (item.direction * Math.PI) / 180;
      const radius = (item.count / maxCount) * maxRadius;
      
      if (radius < 1) return;

      // Determine color based on speed
      const speedIndex = Math.min(Math.floor(item.speed / 10), 3);
      const color = SPEED_COLORS[speedIndex] || SPEED_COLORS[0];

      // Draw bar
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      const endX = centerX + Math.sin(rad) * radius;
      const endY = centerY - Math.cos(rad) * radius;
      ctx.lineTo(endX, endY);
      ctx.strokeStyle = color;
      ctx.lineWidth = 14;
      ctx.lineCap = 'round';
      ctx.stroke();

      // Draw arrow head
      const arrowSize = 8;
      const arrowX = centerX + Math.sin(rad) * radius;
      const arrowY = centerY - Math.cos(rad) * radius;
      
      ctx.beginPath();
      ctx.moveTo(arrowX, arrowY);
      ctx.lineTo(
        arrowX - arrowSize * Math.sin(rad - 0.4),
        arrowY + arrowSize * Math.cos(rad - 0.4)
      );
      ctx.lineTo(
        arrowX - arrowSize * Math.sin(rad + 0.4),
        arrowY + arrowSize * Math.cos(rad + 0.4)
      );
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();
    });

    // Draw center circle
    const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, 12);
    gradient.addColorStop(0, '#f8fafc');
    gradient.addColorStop(1, '#e2e8f0');
    ctx.beginPath();
    ctx.arc(centerX, centerY, 12, 0, 2 * Math.PI);
    ctx.fillStyle = gradient;
    ctx.fill();
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Draw compass needle
    const needleLength = 18;
    ctx.beginPath();
    ctx.moveTo(centerX, centerY - needleLength);
    ctx.lineTo(centerX - 5, centerY + 5);
    ctx.lineTo(centerX + 5, centerY + 5);
    ctx.closePath();
    ctx.fillStyle = '#ef4444';
    ctx.fill();

    // Legend
    const legendX = width - 180;
    const legendY = 20;
    ctx.font = '11px sans-serif';
    ctx.fillStyle = '#475569';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('Kecepatan Angin', legendX, legendY);
    
    SPEED_LABELS.forEach((label, i) => {
      const y = legendY + 25 + i * 24;
      ctx.fillStyle = SPEED_COLORS[i];
      ctx.fillRect(legendX, y, 16, 16);
      ctx.fillStyle = '#64748b';
      ctx.font = '10px sans-serif';
      ctx.fillText(label, legendX + 22, y + 1);
    });

    // Info text
    ctx.fillStyle = 'rgba(148, 163, 184, 0.5)';
    ctx.font = '9px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText(`Total: ${data.reduce((acc, d) => acc + d.count, 0)} data points`, centerX, height - 10);
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      toast.error('Canvas tidak tersedia');
      return;
    }
    
    try {
      const link = document.createElement('a');
      link.download = `wind-rose-${format(new Date(), 'yyyy-MM-dd')}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      toast.success('Gambar berhasil diunduh');
    } catch (error) {
      console.error('Error downloading image:', error);
      toast.error('Gagal mengunduh gambar');
    }
  };

  const totalData = data.reduce((acc, d) => acc + d.count, 0);
  const dominantDirection = data.length > 0 
    ? data.reduce((a, b) => a.count > b.count ? a : b).direction 
    : 0;
  const avgSpeed = data.length > 0
    ? Math.round(data.reduce((acc, d) => acc + d.speed * d.count, 0) / totalData)
    : 0;
  const maxSpeed = data.length > 0 ? Math.max(...data.map(d => d.speed)) : 0;

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
        <div className="h-[500px] bg-slate-200 dark:bg-slate-800 animate-pulse rounded-lg" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Compass className="h-6 w-6 text-emerald-500" />
            Wind Rose
          </h1>
          <p className="text-sm text-muted-foreground">
            Visualisasi arah dan kecepatan angin
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* PERBAIKAN: Select dengan handler yang benar */}
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
          
          <Button variant="outline" size="sm" onClick={handleDownload} className="h-9 gap-1">
            <Download className="h-4 w-4" />
            Download
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-1">
            <CardTitle className="text-xs font-medium text-muted-foreground">Total Data</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between">
              <span className="text-xl font-bold">{totalData}</span>
              <span className="text-xs text-muted-foreground">points</span>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-emerald-500">
          <CardHeader className="pb-1">
            <CardTitle className="text-xs font-medium text-muted-foreground">Arah Dominan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Compass className="h-4 w-4 text-emerald-500" />
              <span className="text-xl font-bold">{dominantDirection}°</span>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="pb-1">
            <CardTitle className="text-xs font-medium text-muted-foreground">Kecepatan Rata-rata</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between">
              <span className="text-xl font-bold">{avgSpeed}</span>
              <span className="text-xs text-muted-foreground">km/h</span>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-red-500">
          <CardHeader className="pb-1">
            <CardTitle className="text-xs font-medium text-muted-foreground">Kecepatan Maks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between">
              <span className="text-xl font-bold">{maxSpeed}</span>
              <span className="text-xs text-muted-foreground">km/h</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Wind Rose Chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Compass className="h-4 w-4 text-emerald-500" />
            Wind Rose Diagram
          </CardTitle>
          <CardDescription className="text-xs">
            Distribusi arah dan kecepatan angin
            {locationId !== 'all' && locations.find(l => l.id === locationId) && (
              <span className="font-medium text-foreground ml-1">
                - {locations.find(l => l.id === locationId)?.name}
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <canvas
            ref={canvasRef}
            width={600}
            height={600}
            className="w-full max-w-[600px] h-auto bg-white dark:bg-slate-900 rounded-lg"
            style={{ aspectRatio: '1/1' }}
          />
        </CardContent>
      </Card>

      {/* Data Table */}
      {data.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Compass className="h-4 w-4 text-emerald-500" />
              Detail Data Arah Angin
            </CardTitle>
            <CardDescription className="text-xs">
              Data lengkap per arah angin
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground">Arah</th>
                    <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground">Kecepatan Rata-rata</th>
                    <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground">Jumlah Data</th>
                    <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground">Persentase</th>
                  </tr>
                </thead>
                <tbody>
                  {data
                    .sort((a, b) => b.count - a.count)
                    .map((item, index) => {
                      const percentage = totalData > 0 ? ((item.count / totalData) * 100).toFixed(1) : 0;
                      const speedIndex = Math.min(Math.floor(item.speed / 10), 3);
                      const color = SPEED_COLORS[speedIndex] || SPEED_COLORS[0];
                      
                      return (
                        <tr key={index} className="border-b last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                          <td className="py-2 px-3">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                              <span className="font-medium">{item.direction}°</span>
                            </div>
                          </td>
                          <td className="py-2 px-3">{item.speed} km/h</td>
                          <td className="py-2 px-3">{item.count}</td>
                          <td className="py-2 px-3">
                            <div className="flex items-center gap-2">
                              <div className="w-16 bg-slate-200 dark:bg-slate-700 rounded-full h-1.5">
                                <div 
                                  className="h-1.5 rounded-full" 
                                  style={{ 
                                    width: `${percentage}%`,
                                    backgroundColor: color 
                                  }} 
                                />
                              </div>
                              <span className="text-xs text-muted-foreground">{percentage}%</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {data.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="flex flex-col items-center gap-3">
              <Compass className="h-12 w-12 text-muted-foreground/50" />
              <p className="font-medium">Belum ada data angin</p>
              <p className="text-sm text-muted-foreground">
                Data angin akan muncul setelah ada data cuaca yang tersimpan
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}