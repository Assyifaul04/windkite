// app/admin/weather-logs/page.tsx
'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { format, formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';
import {
  Cloud,
  Wind,
  Thermometer,
  Droplets,
  Eye,
  Trash2,
  RefreshCw,
  Search,
  MoreVertical,
  Loader2,
  Calendar,
  MapPin,
  Compass,
  Filter,
  AlertCircle,
  CheckCircle,
  XCircle,
} from 'lucide-react';

interface WeatherLog {
  id: string;
  windSpeed: number;
  windGust: number;
  windDirection: number;
  temperature: number | null;
  humidity: number | null;
  kiteSuitability: string;
  timestamp: string;
  location: {
    id: string;
    name: string;
    latitude: number;
    longitude: number;
  };
  user: {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
  } | null;
}

const suitabilityConfig = {
  TIDAK_LAYAK: { 
    label: 'Tidak Layak', 
    color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
    icon: XCircle
  },
  RINGAN: { 
    label: 'Layak Ringan', 
    color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    icon: AlertCircle
  },
  BERAT: { 
    label: 'Layak Berat', 
    color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
    icon: AlertCircle
  },
  SEMUA: { 
    label: 'Layak Semua', 
    color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
    icon: CheckCircle
  },
};

export default function WeatherLogsPage() {
  const [logs, setLogs] = useState<WeatherLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterLocation, setFilterLocation] = useState('all');
  const [filterSuitability, setFilterSuitability] = useState('all');
  const [locations, setLocations] = useState<{ id: string; name: string }[]>([]);
  const [selectedLog, setSelectedLog] = useState<WeatherLog | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    fetchLocations();
    fetchLogs();
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [search, filterLocation, filterSuitability]);

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

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        search,
        locationId: filterLocation,
        suitability: filterSuitability,
      });
      const response = await fetch(`/api/admin/weather-logs?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch weather logs');
      }
      
      const data = await response.json();
      setLogs(data);
    } catch (error) {
      console.error('Error fetching weather logs:', error);
      toast.error('Gagal memuat data cuaca');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchLogs();
  };

  const handleDelete = async () => {
    if (!selectedLog) return;
    
    try {
      setIsDeleting(true);
      const response = await fetch(`/api/admin/weather-logs/${selectedLog.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Data cuaca berhasil dihapus');
        fetchLogs();
        setIsDeleteDialogOpen(false);
        setSelectedLog(null);
      } else {
        toast.error('Gagal menghapus data cuaca');
      }
    } catch (error) {
      console.error('Error deleting weather log:', error);
      toast.error('Terjadi kesalahan');
    } finally {
      setIsDeleting(false);
    }
  };

  const getSuitabilityBadge = (suitability: string) => {
    const config = suitabilityConfig[suitability as keyof typeof suitabilityConfig] || suitabilityConfig.TIDAK_LAYAK;
    const Icon = config.icon;
    return (
      <Badge className={`${config.color} flex items-center gap-1`}>
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const getWindDirection = (degrees: number) => {
    const directions = ['Utara', 'Timur Laut', 'Timur', 'Tenggara', 'Selatan', 'Barat Daya', 'Barat', 'Barat Laut'];
    const index = Math.round(degrees / 45) % 8;
    return directions[index];
  };

  // PERBAIKAN: Handler untuk Select dengan tipe string | null
  const handleFilterLocationChange = (value: string | null) => {
    setFilterLocation(value || 'all');
  };

  const handleFilterSuitabilityChange = (value: string | null) => {
    setFilterSuitability(value || 'all');
  };

  // Hitung statistik
  const totalLogs = logs.length;
  const avgWindSpeed = totalLogs > 0 
    ? (logs.reduce((acc, l) => acc + l.windSpeed, 0) / totalLogs).toFixed(1) 
    : 0;
  const avgTemperature = totalLogs > 0 
    ? (logs.reduce((acc, l) => acc + (l.temperature || 0), 0) / totalLogs).toFixed(1) 
    : 0;
  const avgHumidity = totalLogs > 0 
    ? (logs.reduce((acc, l) => acc + (l.humidity || 0), 0) / totalLogs).toFixed(1) 
    : 0;

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
        <div className="h-12 w-full bg-slate-200 dark:bg-slate-800 animate-pulse rounded" />
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-16 w-full bg-slate-200 dark:bg-slate-800 animate-pulse rounded" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Cloud className="h-6 w-6 text-sky-500" />
            Data Cuaca
          </h1>
          <p className="text-sm text-muted-foreground">
            Riwayat data cuaca dan kelayakan layangan dari semua lokasi
          </p>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleRefresh} 
          disabled={isRefreshing}
          className="gap-2"
        >
          {isRefreshing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          {isRefreshing ? 'Memuat...' : 'Refresh'}
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <Cloud className="h-3 w-3 text-sky-500" />
              Total Data
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-bold">{totalLogs}</span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <Wind className="h-3 w-3 text-blue-500" />
              Rata-rata Kecepatan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-bold">{avgWindSpeed} km/h</span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <Thermometer className="h-3 w-3 text-red-500" />
              Rata-rata Suhu
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-bold">{avgTemperature}°C</span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <Droplets className="h-3 w-3 text-blue-400" />
              Rata-rata Kelembaban
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-bold">{avgHumidity}%</span>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari lokasi atau pengguna..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 text-sm"
          />
        </div>
        {/* PERBAIKAN: Handler dengan tipe string | null */}
        <Select value={filterLocation} onValueChange={handleFilterLocationChange}>
          <SelectTrigger className="w-48 h-9 text-sm">
            <MapPin className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Semua Lokasi" />
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
        {/* PERBAIKAN: Handler dengan tipe string | null */}
        <Select value={filterSuitability} onValueChange={handleFilterSuitabilityChange}>
          <SelectTrigger className="w-48 h-9 text-sm">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Semua Kelayakan" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Kelayakan</SelectItem>
            <SelectItem value="TIDAK_LAYAK">❌ Tidak Layak</SelectItem>
            <SelectItem value="RINGAN">⚠️ Layak Ringan</SelectItem>
            <SelectItem value="BERAT">⚠️ Layak Berat</SelectItem>
            <SelectItem value="SEMUA">✅ Layak Semua</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Logs Table */}
      <div className="border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs whitespace-nowrap">Lokasi</TableHead>
                <TableHead className="text-xs whitespace-nowrap">Kecepatan</TableHead>
                <TableHead className="text-xs whitespace-nowrap">Hembusan</TableHead>
                <TableHead className="text-xs whitespace-nowrap">Arah</TableHead>
                <TableHead className="text-xs whitespace-nowrap">Suhu</TableHead>
                <TableHead className="text-xs whitespace-nowrap">Kelembaban</TableHead>
                <TableHead className="text-xs whitespace-nowrap">Kelayakan</TableHead>
                <TableHead className="text-xs whitespace-nowrap">Waktu</TableHead>
                <TableHead className="text-xs text-right whitespace-nowrap">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-12 text-muted-foreground">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                        <Cloud className="h-8 w-8 text-muted-foreground/50" />
                      </div>
                      <p className="font-medium">Belum ada data cuaca</p>
                      <p className="text-sm max-w-md text-center">
                        Data cuaca akan muncul setelah Anda menjalankan update cuaca 
                        dari halaman Settings → Weather API
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log) => (
                  <TableRow key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                        <span className="font-medium truncate max-w-[120px]" title={log.location.name}>
                          {log.location.name}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Wind className="h-3 w-3 text-sky-500 flex-shrink-0" />
                        <span className="font-mono text-sm">{log.windSpeed}</span>
                        <span className="text-xs text-muted-foreground">km/h</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-sm">{log.windGust}</span>
                      <span className="text-xs text-muted-foreground ml-0.5">km/h</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Compass className="h-3 w-3 text-emerald-500 flex-shrink-0" />
                        <span className="text-sm">{getWindDirection(log.windDirection)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {log.temperature !== null ? (
                        <div className="flex items-center gap-1">
                          <Thermometer className="h-3 w-3 text-red-500 flex-shrink-0" />
                          <span className="text-sm">{log.temperature}°C</span>
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {log.humidity !== null ? (
                        <div className="flex items-center gap-1">
                          <Droplets className="h-3 w-3 text-blue-400 flex-shrink-0" />
                          <span className="text-sm">{log.humidity}%</span>
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>{getSuitabilityBadge(log.kiteSuitability)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                      {formatDistanceToNow(new Date(log.timestamp), { addSuffix: true, locale: id })}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger>
                          <Button 
                            variant="ghost" 
                            className="h-8 w-8 p-0" 
                            type="button"
                          >
                            <MoreVertical className="h-4 w-4" />
                            <span className="sr-only">Open menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                            Aksi
                          </div>
                          <DropdownMenuItem onClick={() => {
                            setSelectedLog(log);
                            setIsDetailDialogOpen(true);
                          }}>
                            <Eye className="mr-2 h-4 w-4" />
                            Detail
                          </DropdownMenuItem>
                          <div className="h-px bg-border my-1" />
                          <DropdownMenuItem 
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                            onClick={() => {
                              setSelectedLog(log);
                              setIsDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Hapus
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Detail Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Cloud className="h-5 w-5 text-sky-500" />
              Detail Data Cuaca
            </DialogTitle>
            <DialogDescription>
              Informasi lengkap data cuaca dan kelayakan layangan
            </DialogDescription>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                  <p className="text-xs text-muted-foreground">Lokasi</p>
                  <p className="font-medium flex items-center gap-1 mt-0.5">
                    <MapPin className="h-4 w-4 text-emerald-500" />
                    {selectedLog.location.name}
                  </p>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                  <p className="text-xs text-muted-foreground">Waktu</p>
                  <p className="font-medium flex items-center gap-1 mt-0.5">
                    <Calendar className="h-4 w-4 text-blue-500" />
                    {format(new Date(selectedLog.timestamp), 'dd MMM yyyy HH:mm', { locale: id })}
                  </p>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                  <p className="text-xs text-muted-foreground">Kecepatan Angin</p>
                  <p className="font-medium flex items-center gap-1 mt-0.5">
                    <Wind className="h-4 w-4 text-sky-500" />
                    {selectedLog.windSpeed} km/h
                  </p>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                  <p className="text-xs text-muted-foreground">Hembusan Angin</p>
                  <p className="font-medium">{selectedLog.windGust} km/h</p>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                  <p className="text-xs text-muted-foreground">Arah Angin</p>
                  <p className="font-medium flex items-center gap-1 mt-0.5">
                    <Compass className="h-4 w-4 text-emerald-500" />
                    {getWindDirection(selectedLog.windDirection)} ({selectedLog.windDirection}°)
                  </p>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                  <p className="text-xs text-muted-foreground">Kelayakan</p>
                  <div className="mt-0.5">{getSuitabilityBadge(selectedLog.kiteSuitability)}</div>
                </div>
                {selectedLog.temperature !== null && (
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                    <p className="text-xs text-muted-foreground">Suhu</p>
                    <p className="font-medium flex items-center gap-1 mt-0.5">
                      <Thermometer className="h-4 w-4 text-red-500" />
                      {selectedLog.temperature}°C
                    </p>
                  </div>
                )}
                {selectedLog.humidity !== null && (
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                    <p className="text-xs text-muted-foreground">Kelembaban</p>
                    <p className="font-medium flex items-center gap-1 mt-0.5">
                      <Droplets className="h-4 w-4 text-blue-400" />
                      {selectedLog.humidity}%
                    </p>
                  </div>
                )}
                {selectedLog.user && (
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg col-span-2">
                    <p className="text-xs text-muted-foreground">Pengguna</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={selectedLog.user.image || ''} />
                        <AvatarFallback className="text-xs">
                          {selectedLog.user.name?.charAt(0).toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{selectedLog.user.name || 'Unknown'}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDetailDialogOpen(false)}>
              Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-600 flex items-center gap-2">
              <Trash2 className="h-5 w-5" />
              Hapus Data Cuaca
            </DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus data cuaca ini? Tindakan ini tidak dapat dibatalkan.
            </DialogDescription>
          </DialogHeader>
          {selectedLog && (
            <div className="py-4">
              <div className="p-3 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-800">
                <div className="flex items-center gap-3">
                  <Cloud className="h-5 w-5 text-red-500 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium truncate">{selectedLog.location.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(selectedLog.timestamp), 'dd MMM yyyy HH:mm', { locale: id })}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Kecepatan: {selectedLog.windSpeed} km/h • 
                      Kelayakan: {suitabilityConfig[selectedLog.kiteSuitability as keyof typeof suitabilityConfig]?.label || selectedLog.kiteSuitability}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Batal
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting} className="gap-2">
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Menghapus...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4" />
                  Hapus
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}