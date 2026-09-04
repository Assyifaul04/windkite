// app/(landing)/user/dashboard/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  MapPin,
  Cloud,
  Image as ImageIcon,
  Sparkle,
  Plus,
  Trash,
  ArrowClockwise,
  Wind,
  Compass
} from "@phosphor-icons/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { id } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Loader2 } from "lucide-react";
import Link from "next/link";

// Interfaces
interface DashboardStats {
  totalLocations: number;
  totalWeatherLogs: number;
  totalDesigns: number;
}

interface Location {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  isPublic: boolean;
  createdAt: string;
}

interface WeatherLog {
  id: string;
  windSpeed: number;
  windDirection: number;
  temperature: number;
  humidity: number;
  kiteSuitability: string;
  timestamp: string;
  location: { name: string };
}

interface KiteDesign {
  id: string;
  prompt: string;
  imageUrl: string;
  category: string;
  isPublic: boolean;
  createdAt: string;
}

export default function UserDashboardPage() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalLocations: 0,
    totalWeatherLogs: 0,
    totalDesigns: 0,
  });
  const [locations, setLocations] = useState<Location[]>([]);
  const [weatherLogs, setWeatherLogs] = useState<WeatherLog[]>([]);
  const [designs, setDesigns] = useState<KiteDesign[]>([]);

  // Dialog states
  const [isLocationDialogOpen, setIsLocationDialogOpen] = useState(false);
  const [isWeatherDialogOpen, setIsWeatherDialogOpen] = useState(false);
  const [isDesignDialogOpen, setIsDesignDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [deleteType, setDeleteType] = useState<"location" | "weather" | "design">("location");

  // Form states
  const [locationForm, setLocationForm] = useState({
    name: "",
    latitude: "",
    longitude: "",
    isPublic: false,
  });
  const [weatherForm, setWeatherForm] = useState({
    locationId: "",
    windSpeed: "",
    windDirection: "",
    temperature: "",
    humidity: "",
  });
  const [designForm, setDesignForm] = useState({
    prompt: "",
    category: "SAMPUL" as "KERANGKA" | "SAMPUL",
    isPublic: false,
  });
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/user/dashboard");
      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
        setLocations(data.locations || []);
        setWeatherLogs(data.weatherLogs || []);
        setDesigns(data.designs || []);
      }
    } catch (error) {
      console.error("Error fetching dashboard:", error);
      toast.error("Gagal memuat data dashboard");
    } finally {
      setLoading(false);
    }
  };

  // CRUD Functions
  const handleCreateLocation = async () => {
    try {
      const response = await fetch("/api/user/locations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: locationForm.name,
          latitude: parseFloat(locationForm.latitude),
          longitude: parseFloat(locationForm.longitude),
          isPublic: locationForm.isPublic,
        }),
      });

      if (response.ok) {
        toast.success("Lokasi berhasil ditambahkan");
        setIsLocationDialogOpen(false);
        setLocationForm({ name: "", latitude: "", longitude: "", isPublic: false });
        await fetchDashboardData();
      } else {
        const error = await response.json();
        toast.error(error.error || "Gagal menambah lokasi");
      }
    } catch (error) {
      console.error("Error creating location:", error);
      toast.error("Terjadi kesalahan");
    }
  };

  const handleCreateWeather = async () => {
    try {
      const response = await fetch("/api/user/weather-logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          locationId: weatherForm.locationId,
          windSpeed: parseFloat(weatherForm.windSpeed),
          windDirection: parseFloat(weatherForm.windDirection),
          temperature: parseFloat(weatherForm.temperature),
          humidity: parseFloat(weatherForm.humidity),
        }),
      });

      if (response.ok) {
        toast.success("Data cuaca berhasil ditambahkan");
        setIsWeatherDialogOpen(false);
        setWeatherForm({ locationId: "", windSpeed: "", windDirection: "", temperature: "", humidity: "" });
        await fetchDashboardData();
      } else {
        const error = await response.json();
        toast.error(error.error || "Gagal menambah data cuaca");
      }
    } catch (error) {
      console.error("Error creating weather log:", error);
      toast.error("Terjadi kesalahan");
    }
  };

  const handleCreateDesign = async () => {
    if (!designForm.prompt) {
      toast.error("Masukkan prompt terlebih dahulu");
      return;
    }

    setGenerating(true);
    try {
      const response = await fetch("/api/user/designs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(designForm),
      });

      if (response.ok) {
        toast.success("Desain berhasil digenerate!");
        setIsDesignDialogOpen(false);
        setDesignForm({ prompt: "", category: "SAMPUL", isPublic: false });
        await fetchDashboardData();
      } else {
        const error = await response.json();
        toast.error(error.error || "Gagal generate desain");
      }
    } catch (error) {
      console.error("Error creating design:", error);
      toast.error("Terjadi kesalahan");
    } finally {
      setGenerating(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedItem) return;

    let url = "";
    switch (deleteType) {
      case "location":
        url = `/api/user/locations/${selectedItem.id}`;
        break;
      case "weather":
        url = `/api/user/weather-logs/${selectedItem.id}`;
        break;
      case "design":
        url = `/api/user/designs/${selectedItem.id}`;
        break;
    }

    try {
      const response = await fetch(url, { method: "DELETE" });

      if (response.ok) {
        toast.success("Berhasil dihapus");
        setIsDeleteDialogOpen(false);
        await fetchDashboardData();
      } else {
        toast.error("Gagal menghapus");
      }
    } catch (error) {
      console.error("Error deleting:", error);
      toast.error("Terjadi kesalahan");
    }
  };

  // Fixed: Properly typed Select onChange handlers
  const handleLocationSelect = (value: string | null) => {
    setWeatherForm({ ...weatherForm, locationId: value || "" });
  };

  const handleDesignCategorySelect = (value: string | null) => {
    setDesignForm({ ...designForm, category: value as "KERANGKA" | "SAMPUL" || "SAMPUL" });
  };

  const getSuitabilityBadge = (suitability: string) => {
    const colors: Record<string, string> = {
      TIDAK_LAYAK: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
      RINGAN: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
      BERAT: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
      SEMUA: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
    };
    const labels: Record<string, string> = {
      TIDAK_LAYAK: "Tidak Layak",
      RINGAN: "Layak Ringan",
      BERAT: "Layak Berat",
      SEMUA: "Layak Semua",
    };
    return <Badge className={colors[suitability] || "bg-gray-100"}>{labels[suitability] || suitability}</Badge>;
  };

  if (loading) {
    return (
      <div className="space-y-3 sm:space-y-4">
        <div className="h-8 sm:h-10 w-32 sm:w-48 bg-slate-200 dark:bg-slate-800 animate-pulse rounded" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 sm:h-32 bg-slate-200 dark:bg-slate-800 animate-pulse rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3 sm:space-y-4 w-full">
      {/* Welcome Section - Responsive */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4 p-3 sm:p-4 bg-gradient-to-r from-sky-50 to-blue-50 dark:from-sky-950/20 dark:to-blue-950/20 rounded-lg border">
        <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto">
          <Avatar className="h-10 w-10 sm:h-12 sm:w-12 border-2 border-sky-200 flex-shrink-0">
            <AvatarImage src={session?.user?.image || ""} />
            <AvatarFallback className="bg-sky-100 text-sky-700 text-base sm:text-lg">
              {session?.user?.name?.charAt(0).toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <h2 className="text-base sm:text-lg font-semibold truncate">
              Selamat datang, {session?.user?.name || "User"}! 👋
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground truncate">
              Kelola aktivitas layangan Anda di sini
            </p>
          </div>
        </div>
        <Badge variant="outline" className="px-2 py-0.5 sm:px-3 sm:py-1 text-xs sm:text-sm flex-shrink-0">
          <Sparkle className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1 text-yellow-500" />
          Aktif
        </Badge>
      </div>

      {/* Stats Cards - Responsive Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-1 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium flex items-center gap-1 sm:gap-2">
              <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-emerald-500" />
              <span>Lokasi</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{stats.totalLocations || 0}</div>
            <p className="text-[10px] sm:text-xs text-muted-foreground">Lapangan tersimpan</p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-1 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium flex items-center gap-1 sm:gap-2">
              <Cloud className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-500" />
              <span>Data Cuaca</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{stats.totalWeatherLogs || 0}</div>
            <p className="text-[10px] sm:text-xs text-muted-foreground">Data tercatat</p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow sm:col-span-2 lg:col-span-1">
          <CardHeader className="pb-1 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium flex items-center gap-1 sm:gap-2">
              <ImageIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-pink-500" />
              <span>Desain AI</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{stats.totalDesigns || 0}</div>
            <p className="text-[10px] sm:text-xs text-muted-foreground">Desain dibuat</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions - Responsive Wrap */}
      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
        <Button onClick={() => setIsLocationDialogOpen(true)} size="sm" className="gap-1 sm:gap-2 text-xs sm:text-sm h-7 sm:h-9 px-2 sm:px-3">
          <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
          <span>Tambah Lokasi</span>
        </Button>
        <Button onClick={() => setIsWeatherDialogOpen(true)} size="sm" variant="outline" className="gap-1 sm:gap-2 text-xs sm:text-sm h-7 sm:h-9 px-2 sm:px-3">
          <Wind className="h-3 w-3 sm:h-4 sm:w-4" />
          <span>Catat Cuaca</span>
        </Button>
        <Button onClick={() => setIsDesignDialogOpen(true)} size="sm" variant="outline" className="gap-1 sm:gap-2 text-xs sm:text-sm h-7 sm:h-9 px-2 sm:px-3">
          <Sparkle className="h-3 w-3 sm:h-4 sm:w-4" />
          <span>Generate Desain</span>
        </Button>
        <Button variant="outline" size="sm" onClick={fetchDashboardData} className="gap-1 sm:gap-2 ml-auto text-xs sm:text-sm h-7 sm:h-9 px-2 sm:px-3">
          <ArrowClockwise className="h-3 w-3 sm:h-4 sm:w-4" />
          <span className="hidden xs:inline">Refresh</span>
        </Button>
      </div>

      {/* Recent Items Grid - Responsive */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
        {/* Recent Locations */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between py-2 sm:py-3">
            <CardTitle className="text-xs sm:text-sm font-medium flex items-center gap-1 sm:gap-2">
              <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-emerald-500" />
              Lokasi Terbaru
            </CardTitle>
            {locations.length > 0 && (
              <Link 
                href="/user/locations" 
                className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background hover:bg-accent hover:text-accent-foreground h-6 sm:h-7 px-1.5 sm:px-2 text-xs"
              >
                Lihat semua
              </Link>
            )}
          </CardHeader>
          <CardContent className="pt-0">
            {locations.length === 0 ? (
              <div className="text-center py-3 sm:py-4 text-xs sm:text-sm text-muted-foreground">
                <MapPin className="h-6 w-6 sm:h-8 sm:w-8 mx-auto mb-1 sm:mb-2 text-muted-foreground/50" />
                Belum ada lokasi
              </div>
            ) : (
              <ul className="space-y-1.5 sm:space-y-2">
                {locations.slice(0, 3).map((loc) => (
                  <li key={loc.id} className="flex items-center justify-between text-xs sm:text-sm p-1.5 sm:p-2 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-lg transition-colors">
                    <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                      <MapPin className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-emerald-500 flex-shrink-0" />
                      <span className="truncate">{loc.name}</span>
                    </div>
                    <span className="text-muted-foreground text-[10px] sm:text-xs whitespace-nowrap ml-2">
                      {formatDistanceToNow(new Date(loc.createdAt), { addSuffix: true, locale: id })}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Recent Weather */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between py-2 sm:py-3">
            <CardTitle className="text-xs sm:text-sm font-medium flex items-center gap-1 sm:gap-2">
              <Cloud className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-500" />
              Cuaca Terbaru
            </CardTitle>
            {weatherLogs.length > 0 && (
              <Link 
                href="/user/weather" 
                className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background hover:bg-accent hover:text-accent-foreground h-6 sm:h-7 px-1.5 sm:px-2 text-xs"
              >
                Lihat semua
              </Link>
            )}
          </CardHeader>
          <CardContent className="pt-0">
            {weatherLogs.length === 0 ? (
              <div className="text-center py-3 sm:py-4 text-xs sm:text-sm text-muted-foreground">
                <Cloud className="h-6 w-6 sm:h-8 sm:w-8 mx-auto mb-1 sm:mb-2 text-muted-foreground/50" />
                Belum ada data cuaca
              </div>
            ) : (
              <ul className="space-y-1.5 sm:space-y-2">
                {weatherLogs.slice(0, 3).map((log) => (
                  <li key={log.id} className="flex flex-wrap items-center justify-between gap-1 text-xs sm:text-sm p-1.5 sm:p-2 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-lg transition-colors">
                    <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                      <Compass className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-blue-500 flex-shrink-0" />
                      <span className="truncate">{log.location?.name || "Unknown"}</span>
                      <span className="text-muted-foreground text-[10px] sm:text-xs whitespace-nowrap">
                        {log.windSpeed} km/h
                      </span>
                    </div>
                    {getSuitabilityBadge(log.kiteSuitability)}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Designs - Responsive Grid */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between py-2 sm:py-3">
          <CardTitle className="text-xs sm:text-sm font-medium flex items-center gap-1 sm:gap-2">
            <ImageIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-pink-500" />
            Desain Terbaru
          </CardTitle>
          {designs.length > 0 && (
            <Link 
              href="/user/designs" 
              className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background hover:bg-accent hover:text-accent-foreground h-6 sm:h-7 px-1.5 sm:px-2 text-xs"
            >
              Lihat semua
            </Link>
          )}
        </CardHeader>
        <CardContent className="pt-0">
          {designs.length === 0 ? (
            <div className="text-center py-3 sm:py-4 text-xs sm:text-sm text-muted-foreground">
              <ImageIcon className="h-6 w-6 sm:h-8 sm:w-8 mx-auto mb-1 sm:mb-2 text-muted-foreground/50" />
              Belum ada desain
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3">
              {designs.slice(0, 4).map((design) => (
                <div key={design.id} className="group relative aspect-square bg-slate-100 dark:bg-slate-800 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                  {design.imageUrl ? (
                    <img
                      src={design.imageUrl}
                      alt={design.prompt}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <ImageIcon className="h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground/50" />
                    </div>
                  )}
                  <Badge className="absolute top-1 left-1 text-[8px] sm:text-[10px] px-1 sm:px-1.5">
                    {design.category === "KERANGKA" ? "Kerangka" : "Sampul"}
                  </Badge>
                  {design.isPublic && (
                    <Badge variant="secondary" className="absolute top-1 right-1 text-[8px] sm:text-[10px] px-1 sm:px-1.5">
                      Publik
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Location Dialog */}
      <Dialog open={isLocationDialogOpen} onOpenChange={setIsLocationDialogOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Tambah Lokasi</DialogTitle>
            <DialogDescription>Tambahkan lokasi lapangan layangan baru</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nama Lokasi</Label>
              <Input
                id="name"
                placeholder="Contoh: Lapangan Banteng"
                value={locationForm.name}
                onChange={(e) => setLocationForm({ ...locationForm, name: e.target.value })}
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
                  value={locationForm.latitude}
                  onChange={(e) => setLocationForm({ ...locationForm, latitude: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="longitude">Longitude</Label>
                <Input
                  id="longitude"
                  type="number"
                  step="0.000001"
                  placeholder="106.800000"
                  value={locationForm.longitude}
                  onChange={(e) => setLocationForm({ ...locationForm, longitude: e.target.value })}
                />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Publik</Label>
                <p className="text-sm text-muted-foreground">Lokasi dapat dilihat semua pengguna</p>
              </div>
              <Switch
                checked={locationForm.isPublic}
                onCheckedChange={(checked) => setLocationForm({ ...locationForm, isPublic: checked })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsLocationDialogOpen(false)}>Batal</Button>
            <Button onClick={handleCreateLocation}>Tambah</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Weather Dialog - Fixed Select onChange */}
      <Dialog open={isWeatherDialogOpen} onOpenChange={setIsWeatherDialogOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Catat Data Cuaca</DialogTitle>
            <DialogDescription>Tambahkan data cuaca untuk lokasi</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="locationId">Lokasi</Label>
              <Select
                value={weatherForm.locationId}
                onValueChange={handleLocationSelect}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih lokasi" />
                </SelectTrigger>
                <SelectContent>
                  {locations.map((loc) => (
                    <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="windSpeed">Kecepatan Angin (km/h)</Label>
                <Input
                  id="windSpeed"
                  type="number"
                  placeholder="25"
                  value={weatherForm.windSpeed}
                  onChange={(e) => setWeatherForm({ ...weatherForm, windSpeed: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="windDirection">Arah Angin (°)</Label>
                <Input
                  id="windDirection"
                  type="number"
                  placeholder="180"
                  value={weatherForm.windDirection}
                  onChange={(e) => setWeatherForm({ ...weatherForm, windDirection: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="temperature">Suhu (°C)</Label>
                <Input
                  id="temperature"
                  type="number"
                  placeholder="28"
                  value={weatherForm.temperature}
                  onChange={(e) => setWeatherForm({ ...weatherForm, temperature: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="humidity">Kelembaban (%)</Label>
                <Input
                  id="humidity"
                  type="number"
                  placeholder="70"
                  value={weatherForm.humidity}
                  onChange={(e) => setWeatherForm({ ...weatherForm, humidity: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsWeatherDialogOpen(false)}>Batal</Button>
            <Button onClick={handleCreateWeather}>Simpan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Design Dialog - Fixed Select onChange */}
      <Dialog open={isDesignDialogOpen} onOpenChange={setIsDesignDialogOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Generate Desain AI</DialogTitle>
            <DialogDescription>Buat desain layangan dengan AI</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="prompt">Prompt</Label>
              <Textarea
                id="prompt"
                placeholder="Contoh: Layangan tradisional dengan motif batik..."
                value={designForm.prompt}
                onChange={(e) => setDesignForm({ ...designForm, prompt: e.target.value })}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Kategori</Label>
              <Select
                value={designForm.category}
                onValueChange={handleDesignCategorySelect}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="KERANGKA">Kerangka</SelectItem>
                  <SelectItem value="SAMPUL">Sampul</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Publik</Label>
                <p className="text-sm text-muted-foreground">Tampilkan di galeri publik</p>
              </div>
              <Switch
                checked={designForm.isPublic}
                onCheckedChange={(checked) => setDesignForm({ ...designForm, isPublic: checked })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDesignDialogOpen(false)}>Batal</Button>
            <Button onClick={handleCreateDesign} disabled={generating || !designForm.prompt}>
              {generating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkle className="mr-2 h-4 w-4" />
                  Generate
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-600">Hapus Data</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus data ini? Tindakan ini tidak dapat dibatalkan.
            </DialogDescription>
          </DialogHeader>
          {selectedItem && (
            <div className="py-4">
              <div className="p-3 bg-red-50 dark:bg-red-950/20 rounded-lg">
                <p className="font-medium">
                  {deleteType === "location" && selectedItem.name}
                  {deleteType === "weather" && `${selectedItem.location?.name || "Unknown"} - ${selectedItem.windSpeed} km/h`}
                  {deleteType === "design" && selectedItem.prompt}
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Batal</Button>
            <Button variant="destructive" onClick={handleDelete}>Hapus</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}