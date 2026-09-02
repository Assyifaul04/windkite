// app/admin/weather-logs/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { 
  Cloud, 
  Wind, 
  Thermometer, 
  Droplets, 
  Compass,
  Search,
  Calendar,
  Download,
  RefreshCw,
  Eye,
  Trash2,
  MoreVertical,
  Filter,
  ArrowUpDown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

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
  };
  user: {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
  } | null;
}

export default function WeatherLogsPage() {
  const [logs, setLogs] = useState<WeatherLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const [selectedLog, setSelectedLog] = useState<WeatherLog | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [locations, setLocations] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    fetchLocations();
    fetchLogs();
  }, []);

  const fetchLocations = async () => {
    try {
      const response = await fetch('/api/admin/locations');
      const data = await response.json();
      setLocations(data.map((l: any) => ({ id: l.id, name: l.name })));
    } catch (error) {
      console.error('Error fetching locations:', error);
    }
  };

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const url = selectedLocation === 'all' 
        ? '/api/admin/weather-logs'
        : `/api/admin/weather-logs?locationId=${selectedLocation}`;
      
      const response = await fetch(url);
      
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
    }
  };

  const handleDelete = async () => {
    if (!selectedLog) return;
    
    try {
      const response = await fetch(`/api/admin/weather-logs/${selectedLog.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Data cuaca berhasil dihapus');
        fetchLogs();
        setIsDeleteDialogOpen(false);
      } else {
        toast.error('Gagal menghapus data cuaca');
      }
    } catch (error) {
      console.error('Error deleting weather log:', error);
      toast.error('Terjadi kesalahan');
    }
  };

  const handleExport = () => {
    toast.success('Data cuaca berhasil diekspor');
  };

  const getKiteSuitabilityBadge = (suitability: string) => {
    const colors: Record<string, string> = {
      TIDAK_LAYAK: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
      RINGAN: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
      BERAT: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
      SEMUA: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
    };
    const labels: Record<string, string> = {
      TIDAK_LAYAK: 'Tidak Layak',
      RINGAN: 'Layak Ringan',
      BERAT: 'Layak Berat',
      SEMUA: 'Layak Semua',
    };
    return (
      <Badge className={colors[suitability] || 'bg-gray-100'}>
        {labels[suitability] || suitability}
      </Badge>
    );
  };

  const filteredLogs = logs.filter(log => 
    log.location.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.user?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="h-10 w-48 bg-slate-200 dark:bg-slate-800 animate-pulse rounded" />
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
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Data Cuaca</h1>
          <p className="text-sm text-muted-foreground">
            Histori data cuaca dari semua lokasi
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button variant="outline" onClick={fetchLogs}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Data</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{logs.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Rata-rata Kecepatan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {logs.length > 0 
                ? Math.round(logs.reduce((acc, l) => acc + l.windSpeed, 0) / logs.length) 
                : 0} km/h
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Rata-rata Suhu</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {logs.filter(l => l.temperature !== null).length > 0
                ? Math.round(logs.filter(l => l.temperature !== null).reduce((acc, l) => acc + (l.temperature || 0), 0) / logs.filter(l => l.temperature !== null).length)
                : 0}°C
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Lokasi Terbanyak</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold truncate" title={logs.length > 0 ? logs[0]?.location.name : '-'}>
              {logs.length > 0 ? logs[0]?.location.name : '-'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari lokasi atau pengguna..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={selectedLocation} onValueChange={setSelectedLocation}>
          <SelectTrigger className="w-48">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Filter lokasi" />
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
        <Button variant="outline" onClick={fetchLogs}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Terapkan Filter
        </Button>
      </div>

      {/* Weather Logs Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Lokasi</TableHead>
              <TableHead>Kecepatan</TableHead>
              <TableHead>Hembusan</TableHead>
              <TableHead>Arah</TableHead>
              <TableHead>Suhu</TableHead>
              <TableHead>Kelembaban</TableHead>
              <TableHead>Kelayakan</TableHead>
              <TableHead>Pengguna</TableHead>
              <TableHead>Waktu</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredLogs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                  Tidak ada data cuaca ditemukan
                </TableCell>
              </TableRow>
            ) : (
              filteredLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Cloud className="h-4 w-4 text-blue-500" />
                      <span className="font-medium">{log.location.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Wind className="h-4 w-4 text-sky-500" />
                      <span>{log.windSpeed} km/h</span>
                    </div>
                  </TableCell>
                  <TableCell>{log.windGust} km/h</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Compass className="h-4 w-4 text-emerald-500" />
                      <span>{log.windDirection}°</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {log.temperature !== null ? (
                      <div className="flex items-center gap-1">
                        <Thermometer className="h-4 w-4 text-red-500" />
                        <span>{log.temperature}°C</span>
                      </div>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell>
                    {log.humidity !== null ? (
                      <div className="flex items-center gap-1">
                        <Droplets className="h-4 w-4 text-blue-400" />
                        <span>{log.humidity}%</span>
                      </div>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell>{getKiteSuitabilityBadge(log.kiteSuitability)}</TableCell>
                  <TableCell>
                    {log.user ? (
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={log.user.image || ''} />
                          <AvatarFallback>
                            {log.user.name?.charAt(0).toUpperCase() || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm">{log.user.name}</span>
                      </div>
                    ) : (
                      <Badge variant="secondary" className="text-xs">System</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-sm whitespace-nowrap">
                    {format(new Date(log.timestamp), 'dd/MM HH:mm')}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Aksi</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => {
                          setSelectedLog(log);
                          setIsViewDialogOpen(true);
                        }}>
                          <Eye className="mr-2 h-4 w-4" />
                          Detail
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          className="text-red-600"
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

      {/* View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Detail Data Cuaca</DialogTitle>
            <DialogDescription>
              Informasi lengkap data cuaca
            </DialogDescription>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Lokasi</p>
                  <p className="font-medium">{selectedLog.location.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Waktu</p>
                  <p className="font-medium">
                    {format(new Date(selectedLog.timestamp), 'dd MMM yyyy HH:mm', { locale: id })}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                <div>
                  <Wind className="h-4 w-4 text-sky-500 mb-1" />
                  <p className="text-sm text-muted-foreground">Kecepatan Angin</p>
                  <p className="text-lg font-bold">{selectedLog.windSpeed} km/h</p>
                </div>
                <div>
                  <Wind className="h-4 w-4 text-orange-500 mb-1" />
                  <p className="text-sm text-muted-foreground">Hembusan Angin</p>
                  <p className="text-lg font-bold">{selectedLog.windGust} km/h</p>
                </div>
                <div>
                  <Compass className="h-4 w-4 text-emerald-500 mb-1" />
                  <p className="text-sm text-muted-foreground">Arah Angin</p>
                  <p className="text-lg font-bold">{selectedLog.windDirection}°</p>
                </div>
                <div>
                  {selectedLog.temperature !== null && (
                    <>
                      <Thermometer className="h-4 w-4 text-red-500 mb-1" />
                      <p className="text-sm text-muted-foreground">Suhu</p>
                      <p className="text-lg font-bold">{selectedLog.temperature}°C</p>
                    </>
                  )}
                </div>
              </div>

              <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                <p className="text-sm text-muted-foreground">Kelayakan Layangan</p>
                <div className="mt-1">{getKiteSuitabilityBadge(selectedLog.kiteSuitability)}</div>
              </div>

              {selectedLog.user && (
                <div className="border-t pt-4">
                  <p className="text-sm text-muted-foreground">Dicatat oleh</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={selectedLog.user.image || ''} />
                      <AvatarFallback>
                        {selectedLog.user.name?.charAt(0).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <span>{selectedLog.user.name}</span>
                    <span className="text-sm text-muted-foreground">({selectedLog.user.email})</span>
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
              Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-600">Hapus Data Cuaca</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus data cuaca ini?
            </DialogDescription>
          </DialogHeader>
          {selectedLog && (
            <div className="py-4">
              <div className="p-3 bg-red-50 dark:bg-red-950/20 rounded-lg">
                <div className="flex items-center gap-3">
                  <Cloud className="h-5 w-5 text-red-500" />
                  <div>
                    <p className="font-medium">{selectedLog.location.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(selectedLog.timestamp), 'dd MMM yyyy HH:mm', { locale: id })}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Batal
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              <Trash2 className="mr-2 h-4 w-4" />
              Hapus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}