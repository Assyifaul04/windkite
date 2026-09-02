// app/admin/locations/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { 
  MapPin, 
  Plus, 
  Edit, 
  Trash2, 
  Globe, 
  Lock,
  Search,
  Filter,
  Eye,
  Cloud,
  Wind,
  Thermometer,
  Droplets,
  MoreVertical,
  RefreshCw
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

interface Location {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  isPublic: boolean;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
  };
  weatherLogs: {
    id: string;
    windSpeed: number;
    windDirection: number;
    temperature: number | null;
    humidity: number | null;
    timestamp: string;
    kiteSuitability: string;
  }[];
  _count?: {
    weatherLogs: number;
  };
}

export default function LocationsPage() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');
  const [filterPublic, setFilterPublic] = useState<'all' | 'public' | 'private'>('all');

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    latitude: '',
    longitude: '',
    isPublic: false,
  });

  useEffect(() => {
    fetchLocations();
  }, []);

  const fetchLocations = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/locations');
      
      if (!response.ok) {
        throw new Error('Failed to fetch locations');
      }
      
      const data = await response.json();
      setLocations(data);
    } catch (error) {
      console.error('Error fetching locations:', error);
      toast.error('Gagal memuat data lokasi');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const url = dialogMode === 'create' 
        ? '/api/admin/locations' 
        : `/api/admin/locations/${selectedLocation?.id}`;
      
      const method = dialogMode === 'create' ? 'POST' : 'PATCH';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          latitude: parseFloat(formData.latitude),
          longitude: parseFloat(formData.longitude),
          isPublic: formData.isPublic,
        }),
      });

      if (response.ok) {
        toast.success(dialogMode === 'create' ? 'Lokasi berhasil ditambahkan' : 'Lokasi berhasil diupdate');
        fetchLocations();
        setIsDialogOpen(false);
        resetForm();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Gagal menyimpan lokasi');
      }
    } catch (error) {
      console.error('Error saving location:', error);
      toast.error('Terjadi kesalahan');
    }
  };

  const handleDelete = async () => {
    if (!selectedLocation) return;
    
    try {
      const response = await fetch(`/api/admin/locations/${selectedLocation.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Lokasi berhasil dihapus');
        fetchLocations();
        setIsDeleteDialogOpen(false);
      } else {
        toast.error('Gagal menghapus lokasi');
      }
    } catch (error) {
      console.error('Error deleting location:', error);
      toast.error('Terjadi kesalahan');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      latitude: '',
      longitude: '',
      isPublic: false,
    });
    setSelectedLocation(null);
  };

  const openEditDialog = (location: Location) => {
    setSelectedLocation(location);
    setFormData({
      name: location.name,
      latitude: location.latitude.toString(),
      longitude: location.longitude.toString(),
      isPublic: location.isPublic,
    });
    setDialogMode('edit');
    setIsDialogOpen(true);
  };

  const openCreateDialog = () => {
    resetForm();
    setDialogMode('create');
    setIsDialogOpen(true);
  };

  const filteredLocations = locations.filter(location => {
    const matchesSearch = location.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterPublic === 'all' 
      ? true 
      : filterPublic === 'public' 
        ? location.isPublic 
        : !location.isPublic;
    return matchesSearch && matchesFilter;
  });

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
          <h1 className="text-2xl font-bold">Manajemen Lokasi</h1>
          <p className="text-sm text-muted-foreground">
            Kelola semua lokasi lapangan layangan
          </p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="mr-2 h-4 w-4" />
          Tambah Lokasi
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari lokasi..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filterPublic} onValueChange={(value: any) => setFilterPublic(value)}>
          <SelectTrigger className="w-40">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Filter" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua</SelectItem>
            <SelectItem value="public">Publik</SelectItem>
            <SelectItem value="private">Privat</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={fetchLocations}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Lokasi</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{locations.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Publik</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {locations.filter(l => l.isPublic).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Privat</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {locations.filter(l => !l.isPublic).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Data Cuaca</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {locations.reduce((acc, l) => acc + (l._count?.weatherLogs || 0), 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Locations Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama Lokasi</TableHead>
              <TableHead>Koordinat</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Pemilik</TableHead>
              <TableHead>Data Cuaca</TableHead>
              <TableHead>Dibuat</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredLocations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  Tidak ada lokasi ditemukan
                </TableCell>
              </TableRow>
            ) : (
              filteredLocations.map((location) => (
                <TableRow key={location.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-emerald-500" />
                      <span className="font-medium">{location.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div>{location.latitude.toFixed(6)}</div>
                      <div className="text-muted-foreground">{location.longitude.toFixed(6)}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {location.isPublic ? (
                      <Badge variant="default" className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                        <Globe className="mr-1 h-3 w-3" />
                        Publik
                      </Badge>
                    ) : (
                      <Badge variant="secondary">
                        <Lock className="mr-1 h-3 w-3" />
                        Privat
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={location.user?.image || ''} />
                        <AvatarFallback>
                          {location.user?.name?.charAt(0).toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm">
                        {location.user?.name || 'Tidak diketahui'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Cloud className="h-4 w-4 text-blue-500" />
                      <span>{location._count?.weatherLogs || 0}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">
                    {format(new Date(location.createdAt), 'dd MMM yyyy', { locale: id })}
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
                          setSelectedLocation(location);
                          setIsViewDialogOpen(true);
                        }}>
                          <Eye className="mr-2 h-4 w-4" />
                          Detail
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openEditDialog(location)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          className="text-red-600"
                          onClick={() => {
                            setSelectedLocation(location);
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

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {dialogMode === 'create' ? 'Tambah Lokasi Baru' : 'Edit Lokasi'}
            </DialogTitle>
            <DialogDescription>
              {dialogMode === 'create' 
                ? 'Tambahkan lokasi lapangan layangan baru' 
                : 'Edit informasi lokasi'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nama Lokasi</Label>
                <Input
                  id="name"
                  placeholder="Contoh: Lapangan Banteng"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="latitude">Latitude</Label>
                  <Input
                    id="latitude"
                    type="number"
                    step="0.000001"
                    placeholder="-6.200000"
                    value={formData.latitude}
                    onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="longitude">Longitude</Label>
                  <Input
                    id="longitude"
                    type="number"
                    step="0.000001"
                    placeholder="106.800000"
                    value={formData.longitude}
                    onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="isPublic">Publik</Label>
                  <p className="text-sm text-muted-foreground">
                    Lokasi publik dapat dilihat oleh semua pengguna
                  </p>
                </div>
                <Switch
                  id="isPublic"
                  checked={formData.isPublic}
                  onCheckedChange={(checked) => setFormData({ ...formData, isPublic: checked })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setIsDialogOpen(false)}>
                Batal
              </Button>
              <Button type="submit">
                {dialogMode === 'create' ? 'Tambah' : 'Simpan'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detail Lokasi</DialogTitle>
            <DialogDescription>
              Informasi lengkap lokasi dan data cuaca terbaru
            </DialogDescription>
          </DialogHeader>
          {selectedLocation && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Nama</p>
                  <p className="font-medium">{selectedLocation.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <div className="mt-1">
                    {selectedLocation.isPublic ? (
                      <Badge variant="default" className="bg-emerald-100 text-emerald-700">
                        <Globe className="mr-1 h-3 w-3" />
                        Publik
                      </Badge>
                    ) : (
                      <Badge variant="secondary">
                        <Lock className="mr-1 h-3 w-3" />
                        Privat
                      </Badge>
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Latitude</p>
                  <p>{selectedLocation.latitude.toFixed(6)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Longitude</p>
                  <p>{selectedLocation.longitude.toFixed(6)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Pemilik</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={selectedLocation.user?.image || ''} />
                      <AvatarFallback>
                        {selectedLocation.user?.name?.charAt(0).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <span>{selectedLocation.user?.name || 'Tidak diketahui'}</span>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Dibuat</p>
                  <p>
                    {format(new Date(selectedLocation.createdAt), 'dd MMMM yyyy HH:mm', { locale: id })}
                  </p>
                </div>
              </div>

              {selectedLocation.weatherLogs.length > 0 && (
                <div className="border-t pt-4">
                  <h3 className="font-medium mb-3">Data Cuaca Terbaru</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="p-3 bg-sky-50 dark:bg-sky-950/20 rounded-lg">
                      <Wind className="h-4 w-4 text-sky-500 mb-1" />
                      <p className="text-sm text-muted-foreground">Kecepatan</p>
                      <p className="font-semibold">{selectedLocation.weatherLogs[0]?.windSpeed} km/h</p>
                    </div>
                    <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 rounded-lg">
                      <MapPin className="h-4 w-4 text-emerald-500 mb-1" />
                      <p className="text-sm text-muted-foreground">Arah</p>
                      <p className="font-semibold">{selectedLocation.weatherLogs[0]?.windDirection}°</p>
                    </div>
                    {selectedLocation.weatherLogs[0]?.temperature && (
                      <div className="p-3 bg-red-50 dark:bg-red-950/20 rounded-lg">
                        <Thermometer className="h-4 w-4 text-red-500 mb-1" />
                        <p className="text-sm text-muted-foreground">Suhu</p>
                        <p className="font-semibold">{selectedLocation.weatherLogs[0]?.temperature}°C</p>
                      </div>
                    )}
                    {selectedLocation.weatherLogs[0]?.humidity && (
                      <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                        <Droplets className="h-4 w-4 text-blue-500 mb-1" />
                        <p className="text-sm text-muted-foreground">Kelembaban</p>
                        <p className="font-semibold">{selectedLocation.weatherLogs[0]?.humidity}%</p>
                      </div>
                    )}
                  </div>
                  <div className="mt-3">
                    <p className="text-sm text-muted-foreground">Kelayakan Layangan</p>
                    <div className="mt-1">
                      {getKiteSuitabilityBadge(selectedLocation.weatherLogs[0]?.kiteSuitability || 'TIDAK_LAYAK')}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Terakhir update: {format(new Date(selectedLocation.weatherLogs[0]?.timestamp || new Date()), 'dd MMM yyyy HH:mm', { locale: id })}
                  </p>
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
            <DialogTitle className="text-red-600">Hapus Lokasi</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus lokasi ini? Semua data cuaca terkait juga akan dihapus.
            </DialogDescription>
          </DialogHeader>
          {selectedLocation && (
            <div className="py-4">
              <div className="p-3 bg-red-50 dark:bg-red-950/20 rounded-lg">
                <div className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-red-500" />
                  <div>
                    <p className="font-medium">{selectedLocation.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedLocation.weatherLogs.length} data cuaca akan dihapus
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