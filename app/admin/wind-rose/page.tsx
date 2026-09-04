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
import { Compass, RefreshCw, Download } from 'lucide-react';
import { toast } from 'sonner';

interface WindData {
  direction: number;
  speed: number;
  count: number;
}

interface Location {
  id: string;
  name: string;
}

export default function WindRosePage() {
  const [data, setData] = useState<WindData[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<string>('30d');
  const [locationId, setLocationId] = useState<string>('all');
  const [locations, setLocations] = useState<Location[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    fetchLocations();
  }, []);

  useEffect(() => {
    if (locations.length > 0) {
      fetchWindRose();
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

  const fetchWindRose = async () => {
    try {
      setLoading(true);
      const url = `/api/admin/wind-rose?period=${period}&locationId=${locationId}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Failed to fetch wind rose data');
      }
      
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error('Error fetching wind rose:', error);
      toast.error('Gagal memuat data wind rose');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (data.length > 0 && !loading) {
      drawWindRose();
    }
  }, [data, loading]);

  // Fixed: Properly typed onChange handlers
  const handlePeriodChange = (value: string | null) => {
    setPeriod(value || '30d');
  };

  const handleLocationChange = (value: string | null) => {
    setLocationId(value || 'all');
  };

  const drawWindRose = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const maxRadius = Math.min(width, height) / 2 - 60;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw background
    ctx.fillStyle = 'transparent';
    ctx.fillRect(0, 0, width, height);

    // Draw circles
    const maxCount = Math.max(...data.map(d => d.count), 1);
    for (let i = 1; i <= 5; i++) {
      const radius = (maxRadius / 5) * i;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Label percentage
      if (i % 2 === 0) {
        const percentage = Math.round((i / 5) * 100);
        ctx.fillStyle = '#94a3b8';
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${percentage}%`, centerX + 5, centerY - radius);
      }
    }

    // Draw direction labels
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const angles = [0, 45, 90, 135, 180, 225, 270, 315];
    
    directions.forEach((label, i) => {
      const rad = (angles[i] * Math.PI) / 180;
      const x = centerX + Math.sin(rad) * (maxRadius + 20);
      const y = centerY - Math.cos(rad) * (maxRadius + 20);
      
      ctx.fillStyle = '#64748b';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, x, y);
    });

    // Draw wind data
    const colors = ['#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe'];
    
    data.forEach((item) => {
      const rad = (item.direction * Math.PI) / 180;
      const radius = (item.count / maxCount) * maxRadius;
      
      // Draw wind bar
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      const endX = centerX + Math.sin(rad) * radius;
      const endY = centerY - Math.cos(rad) * radius;
      ctx.lineTo(endX, endY);
      
      // Color based on speed
      const speedIndex = Math.min(Math.floor(item.speed / 10), 3);
      ctx.strokeStyle = colors[speedIndex] || colors[0];
      ctx.lineWidth = 12;
      ctx.lineCap = 'round';
      ctx.stroke();

      // Draw arrow head
      const arrowSize = 10;
      const angle = rad;
      const arrowX = centerX + Math.sin(angle) * radius;
      const arrowY = centerY - Math.cos(angle) * radius;
      
      ctx.beginPath();
      ctx.moveTo(arrowX, arrowY);
      ctx.lineTo(
        arrowX - arrowSize * Math.sin(angle - 0.4),
        arrowY + arrowSize * Math.cos(angle - 0.4)
      );
      ctx.lineTo(
        arrowX - arrowSize * Math.sin(angle + 0.4),
        arrowY + arrowSize * Math.cos(angle + 0.4)
      );
      ctx.closePath();
      ctx.fillStyle = colors[speedIndex] || colors[0];
      ctx.fill();
    });

    // Draw center circle
    ctx.beginPath();
    ctx.arc(centerX, centerY, 10, 0, 2 * Math.PI);
    ctx.fillStyle = '#f1f5f9';
    ctx.fill();
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Legend
    const legendX = width - 150;
    const legendY = 20;
    ctx.font = '11px sans-serif';
    ctx.fillStyle = '#64748b';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('Kecepatan Angin (km/h)', legendX, legendY);
    
    const speeds = ['0-10', '11-20', '21-30', '30+'];
    speeds.forEach((speed, i) => {
      const y = legendY + 25 + i * 25;
      ctx.fillStyle = colors[i];
      ctx.fillRect(legendX, y, 15, 15);
      ctx.fillStyle = '#64748b';
      ctx.fillText(speed, legendX + 20, y);
    });

    // Info text
    ctx.fillStyle = '#94a3b8';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText('Arah Angin', centerX, height - 5);
  };

  // Handle download with proper type checking
  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      try {
        const link = document.createElement('a');
        link.download = 'wind-rose.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
      } catch (error) {
        console.error('Error downloading image:', error);
        toast.error('Gagal mengunduh gambar');
      }
    }
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="h-10 w-48 bg-slate-200 dark:bg-slate-800 animate-pulse rounded" />
        <div className="h-[500px] bg-slate-200 dark:bg-slate-800 animate-pulse rounded-lg" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Wind Rose</h1>
          <p className="text-sm text-muted-foreground">
            Visualisasi arah dan kecepatan angin
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* Fixed: Added proper onChange handlers */}
          <Select 
            value={period} 
            onValueChange={handlePeriodChange}
          >
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Periode" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">7 Hari</SelectItem>
              <SelectItem value="30d">30 Hari</SelectItem>
              <SelectItem value="90d">90 Hari</SelectItem>
            </SelectContent>
          </Select>
          
          <Select 
            value={locationId} 
            onValueChange={handleLocationChange}
          >
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
          
          <Button variant="outline" onClick={fetchWindRose}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          
          <Button variant="outline" onClick={handleDownload}>
            <Download className="mr-2 h-4 w-4" />
            Download
          </Button>
        </div>
      </div>

      {/* Wind Rose Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Wind Rose Diagram</CardTitle>
          <CardDescription>
            Distribusi arah dan kecepatan angin
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <canvas
            ref={canvasRef}
            width={600}
            height={600}
            className="w-full max-w-[600px] h-auto"
          />
        </CardContent>
      </Card>

      {/* Statistics */}
      {data.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Data</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {data.reduce((acc, d) => acc + d.count, 0)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Arah Dominan</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Compass className="h-4 w-4 text-emerald-500" />
                <span className="text-2xl font-bold">
                  {data.length > 0 
                    ? `${data.reduce((a, b) => a.count > b.count ? a : b).direction}°`
                    : 'N/A'}
                </span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Kecepatan Rata-rata</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {data.length > 0
                  ? Math.round(data.reduce((acc, d) => acc + d.speed * d.count, 0) / 
                      data.reduce((acc, d) => acc + d.count, 0))
                  : 0} km/h
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Kecepatan Maks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {data.length > 0 ? Math.max(...data.map(d => d.speed)) : 0} km/h
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}