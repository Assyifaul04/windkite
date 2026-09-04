"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import {
  Cloud,
  Globe,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Save,
  TestTube,
  Eye,
  EyeOff,
  ExternalLink,
  Server,
  Clock,
  Activity,
  Database,
  Zap,
  Loader2,
  Info,
  MapPin,
  Plus,
  Trash2,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import WilayahSelector, {
  WilayahSelection,
} from "@/components/wilayah-selector";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// Dynamic import untuk WeatherMap
const WeatherMap = dynamic(() => import("@/components/weather-map"), {
  ssr: false,
  loading: () => (
    <div className="h-[400px] bg-slate-100 dark:bg-slate-800 rounded-lg animate-pulse flex items-center justify-center border border-slate-200 dark:border-slate-700">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Loading map...</p>
      </div>
    </div>
  ),
});

interface WeatherAPISettings {
  id?: string;
  provider: "openweather" | "weatherbit" | "tomorrow" | "custom";
  apiKey: string;
  apiUrl: string;
  defaultLocation: string;
  cacheDuration: number;
  autoUpdate: boolean;
  updateInterval: number;
  retryCount: number;
  timeout: number;
  createdAt?: string;
  updatedAt?: string;
}

interface WeatherStats {
  totalLogs: number;
  lastUpdate: string | null;
  successRate: number;
  totalLocations: number;
}

interface SavedLocation {
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
}

// Lokasi yang baru dipilih lewat WilayahSelector, tapi belum disimpan ke DB
interface PendingLocation {
  tempId: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  testing?: boolean;
  saving?: boolean;
  testResult?: "success" | "error" | null;
}

const PROVIDER_CONFIGS = {
  openweather: {
    label: "OpenWeatherMap",
    docs: "https://openweathermap.org/current",
    apiUrl: "https://api.openweathermap.org/data/2.5",
    description: "Provider cuaca paling populer dengan data lengkap",
  },
  weatherbit: {
    label: "WeatherBit",
    docs: "https://www.weatherbit.io/api",
    apiUrl: "https://api.weatherbit.io/v2.0",
    description: "Provider dengan data cuaca real-time dan forecast",
  },
  tomorrow: {
    label: "Tomorrow.io",
    docs: "https://docs.tomorrow.io/reference",
    apiUrl: "https://api.tomorrow.io/v4",
    description: "Provider dengan visualisasi dan analisis cuaca",
  },
  custom: {
    label: "Custom API",
    docs: "#",
    apiUrl: "https://your-api.com",
    description: "Gunakan API custom sendiri",
  },
};

export default function WeatherAPISettingsPage() {
  const [settings, setSettings] = useState<WeatherAPISettings>({
    provider: "openweather",
    apiKey: "",
    apiUrl: "https://api.openweathermap.org/data/2.5",
    defaultLocation: "",
    cacheDuration: 300,
    autoUpdate: true,
    updateInterval: 3600,
    retryCount: 3,
    timeout: 5000,
  });
  const [stats, setStats] = useState<WeatherStats | null>(null);
  const [savedLocations, setSavedLocations] = useState<SavedLocation[]>([]);
  const [pendingLocations, setPendingLocations] = useState<PendingLocation[]>(
    [],
  );
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<"success" | "error" | null>(
    null,
  );
  const [testMessage, setTestMessage] = useState("");
  const [testWeatherInfo, setTestWeatherInfo] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<
    "idle" | "testing" | "connected" | "error"
  >("idle");
  const [isMounted, setIsMounted] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<any>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedSavedLocation, setSelectedSavedLocation] =
    useState<SavedLocation | null>(null);

  // State untuk lokasi yang dipilih dari WilayahSelector
  const [wilayahSelection, setWilayahSelection] =
    useState<WilayahSelection | null>(null);

  useEffect(() => {
    setIsMounted(true);
    fetchSettings();
    fetchStats();
    fetchSavedLocations();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch("/api/admin/settings/weather-api");
      if (response.ok) {
        const data = await response.json();
        if (data) {
          setSettings((prev) => ({ ...prev, ...data }));
        }
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
      toast.error("Gagal memuat pengaturan Weather API");
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/admin/settings/weather-api/stats");
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const fetchSavedLocations = async () => {
    try {
      const response = await fetch("/api/admin/locations");
      if (response.ok) {
        const data = await response.json();
        setSavedLocations(data);
      }
    } catch (error) {
      console.error("Error fetching saved locations:", error);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/settings/weather-api", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        toast.success("Pengaturan Weather API berhasil disimpan");
        await fetchSettings();
      } else {
        const error = await response.json();
        toast.error(error.error || "Gagal menyimpan pengaturan");
      }
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error("Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  };

  const handleTest = async () => {
    if (!settings.apiKey) {
      toast.error("Masukkan API Key terlebih dahulu");
      return;
    }

    setTesting(true);
    setTestResult(null);
    setTestMessage("");
    setTestWeatherInfo("");
    setConnectionStatus("testing");

    try {
      const response = await fetch("/api/admin/settings/weather-api/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiKey: settings.apiKey,
          provider: settings.provider,
          location: settings.defaultLocation || "Jakarta",
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setTestResult("success");
        setTestMessage(data.message || "✅ Koneksi Weather API berhasil!");
        setTestWeatherInfo(data.weatherInfo || "");
        setConnectionStatus("connected");
        toast.success("✅ Koneksi Weather API berhasil!");
        await fetchStats();
      } else {
        setTestResult("error");
        setTestMessage(
          data.error || data.message || "❌ Gagal terhubung ke Weather API",
        );
        setConnectionStatus("error");
        toast.error(
          data.error || data.message || "❌ Gagal terhubung ke Weather API",
        );
      }
    } catch (error: any) {
      setTestResult("error");
      setTestMessage(error.message || "❌ Terjadi kesalahan saat testing");
      setConnectionStatus("error");
      toast.error("Terjadi kesalahan saat testing");
    } finally {
      setTesting(false);
    }
  };

  // FIXED: Properly typed handler for provider select
  const handleProviderChange = (value: string | null) => {
    if (!value) return;
    const config = PROVIDER_CONFIGS[value as keyof typeof PROVIDER_CONFIGS];
    setSettings({
      ...settings,
      provider: value as any,
      apiUrl: config?.apiUrl || "",
    });
  };

  // FIXED: Properly typed handler for default location select (if needed)
  const handleDefaultLocationChange = (value: string | null) => {
    if (value !== null) {
      setSettings({ ...settings, defaultLocation: value });
    }
  };

  // Dipanggil begitu user memilih Provinsi → Kab/Kota → Kecamatan → Desa
  const handleWilayahChange = (
    selection: WilayahSelection,
    fullAddress: string,
    coords?: { lat: number; lng: number },
  ) => {
    setWilayahSelection(selection);
    setSettings((prev) => ({ ...prev, defaultLocation: fullAddress }));

    if (!selection.village) return;

    const name = `${selection.village.name}, ${selection.district?.name || ""}, ${selection.regency?.name || ""}`;

    if (!coords) {
      toast.warning(
        "Koordinat untuk lokasi ini tidak ditemukan otomatis. Silakan tambahkan manual lewat peta di halaman Manajemen Lokasi.",
      );
      return;
    }

    // Hindari duplikat lokasi pending dengan alamat yang sama
    setPendingLocations((prev) => {
      if (prev.some((p) => p.address === fullAddress)) return prev;
      return [
        ...prev,
        {
          tempId: `pending-${Date.now()}`,
          name,
          address: fullAddress,
          latitude: coords.lat,
          longitude: coords.lng,
          testResult: null,
        },
      ];
    });

    // Marker langsung muncul & peta fly ke titik itu
    setSelectedLocation({
      name,
      lat: coords.lat,
      lng: coords.lng,
      province: selection.province?.name || "",
    });

    toast.success(`Lokasi dipilih: ${fullAddress}`);
  };

  // Test koneksi weather API khusus untuk 1 lokasi pending
  const handleTestPendingLocation = async (tempId: string) => {
    const loc = pendingLocations.find((p) => p.tempId === tempId);
    if (!loc) return;

    if (!settings.apiKey) {
      toast.error("Masukkan API Key terlebih dahulu");
      return;
    }

    setPendingLocations((prev) =>
      prev.map((p) => (p.tempId === tempId ? { ...p, testing: true } : p)),
    );

    try {
      const response = await fetch("/api/admin/settings/weather-api/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiKey: settings.apiKey,
          provider: settings.provider,
          location: loc.name,
        }),
      });

      const data = await response.json();
      const success = response.ok && data.success;

      setPendingLocations((prev) =>
        prev.map((p) =>
          p.tempId === tempId
            ? { ...p, testing: false, testResult: success ? "success" : "error" }
            : p,
        ),
      );

      if (success) {
        toast.success(data.message || `✅ Test berhasil untuk ${loc.name}`);
      } else {
        toast.error(
          data.error || data.message || `❌ Test gagal untuk ${loc.name}`,
        );
      }
    } catch (error) {
      setPendingLocations((prev) =>
        prev.map((p) =>
          p.tempId === tempId ? { ...p, testing: false, testResult: "error" } : p,
        ),
      );
      toast.error("Terjadi kesalahan saat testing lokasi");
    }
  };

  // Simpan 1 lokasi pending ke database → otomatis akan tampil di /admin/locations
  const handleSavePendingLocation = async (tempId: string) => {
    const loc = pendingLocations.find((p) => p.tempId === tempId);
    if (!loc) return;

    setPendingLocations((prev) =>
      prev.map((p) => (p.tempId === tempId ? { ...p, saving: true } : p)),
    );

    try {
      const response = await fetch("/api/admin/locations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: loc.name,
          latitude: loc.latitude,
          longitude: loc.longitude,
          isPublic: true,
        }),
      });

      if (response.ok) {
        toast.success(`Lokasi "${loc.name}" berhasil disimpan`);
        setPendingLocations((prev) => prev.filter((p) => p.tempId !== tempId));
        await fetchSavedLocations();
      } else {
        const error = await response.json();
        toast.error(error.error || "Gagal menyimpan lokasi");
        setPendingLocations((prev) =>
          prev.map((p) => (p.tempId === tempId ? { ...p, saving: false } : p)),
        );
      }
    } catch (error) {
      console.error("Error saving location:", error);
      toast.error("Terjadi kesalahan saat menyimpan lokasi");
      setPendingLocations((prev) =>
        prev.map((p) => (p.tempId === tempId ? { ...p, saving: false } : p)),
      );
    }
  };

  const handleRemovePending = (tempId: string) => {
    setPendingLocations((prev) => prev.filter((p) => p.tempId !== tempId));
    toast.info("Lokasi dibatalkan");
  };

  const handleDeleteLocation = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/locations/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Lokasi berhasil dihapus");
        await fetchSavedLocations();
        setIsDeleteDialogOpen(false);
        setSelectedSavedLocation(null);
      } else {
        toast.error("Gagal menghapus lokasi");
      }
    } catch (error) {
      console.error("Error deleting location:", error);
      toast.error("Terjadi kesalahan");
    }
  };

  const handleMapSelectLocation = (loc: any) => {
    setSelectedLocation(loc);
    // Update form with selected location
    if (loc) {
      setSettings((prev) => ({ ...prev, defaultLocation: loc.name }));
    }
  };

  const providerConfig = PROVIDER_CONFIGS[settings.provider];

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2">
            <Cloud className="h-7 w-7 text-sky-500" />
            Weather API Settings
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Konfigurasi API dan kelola lokasi cuaca
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline" className="px-3 py-1">
            <Cloud className="h-3.5 w-3.5 mr-1" />
            {providerConfig?.label || "Weather"}
          </Badge>
          <Button variant="outline" onClick={fetchSettings} size="sm">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button
            onClick={handleSave}
            disabled={loading}
            size="sm"
            className="gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Menyimpan...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Simpan Settings
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Connection Status */}
      {connectionStatus !== "idle" && (
        <Card
          className={
            connectionStatus === "connected"
              ? "border-green-200 bg-green-50 dark:bg-green-950/10"
              : connectionStatus === "error"
                ? "border-red-200 bg-red-50 dark:bg-red-950/10"
                : "border-yellow-200 bg-yellow-50 dark:bg-yellow-950/10"
          }
        >
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              {connectionStatus === "testing" && (
                <Loader2 className="h-5 w-5 animate-spin text-yellow-500" />
              )}
              {connectionStatus === "connected" && (
                <CheckCircle className="h-5 w-5 text-green-500" />
              )}
              {connectionStatus === "error" && (
                <AlertCircle className="h-5 w-5 text-red-500" />
              )}
              <span
                className={
                  connectionStatus === "connected"
                    ? "text-green-700 dark:text-green-300 font-medium"
                    : connectionStatus === "error"
                      ? "text-red-700 dark:text-red-300 font-medium"
                      : "text-yellow-700 dark:text-yellow-300 font-medium"
                }
              >
                {testMessage ||
                  (connectionStatus === "connected"
                    ? "✅ Connected"
                    : "❌ Connection Failed")}
              </span>
              {testWeatherInfo && connectionStatus === "connected" && (
                <Badge variant="outline" className="ml-2">
                  {testWeatherInfo}
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Settings */}
        <div className="lg:col-span-2 space-y-6">
          {/* Provider API */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Provider API</CardTitle>
              <CardDescription>
                Pilih provider weather API dan masukkan konfigurasi
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="provider">Provider</Label>
                {/* FIXED: Properly typed onValueChange */}
                <Select
                  value={settings.provider}
                  onValueChange={handleProviderChange}
                >
                  <SelectTrigger>
                    <Cloud className="mr-2 h-4 w-4" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="openweather">OpenWeatherMap</SelectItem>
                    <SelectItem value="weatherbit">WeatherBit</SelectItem>
                    <SelectItem value="tomorrow">Tomorrow.io</SelectItem>
                    <SelectItem value="custom">Custom API</SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex items-center gap-2 mt-1">
                  <Info className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">
                    {providerConfig?.description}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <ExternalLink className="h-3 w-3 text-muted-foreground" />
                  <a
                    href={providerConfig?.docs || "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-500 hover:underline"
                  >
                    Dokumentasi {providerConfig?.label}
                  </a>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="apiKey">API Key</Label>
                <div className="relative">
                  <Input
                    id="apiKey"
                    type={showKey ? "text" : "password"}
                    value={settings.apiKey || ""}
                    onChange={(e) =>
                      setSettings({ ...settings, apiKey: e.target.value })
                    }
                    placeholder="Masukkan API Key"
                    className="pr-24"
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0"
                      onClick={() => setShowKey(!showKey)}
                    >
                      {showKey ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0"
                      onClick={handleTest}
                      disabled={testing || !settings.apiKey}
                    >
                      <TestTube className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Dapatkan API Key dari provider yang dipilih
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="apiUrl">API URL</Label>
                <Input
                  id="apiUrl"
                  value={settings.apiUrl || ""}
                  onChange={(e) =>
                    setSettings({ ...settings, apiUrl: e.target.value })
                  }
                  placeholder="https://api.example.com/v3"
                  className="font-mono text-sm"
                />
              </div>

              <div className="flex items-center gap-4 pt-2">
                <Button
                  variant="outline"
                  onClick={handleTest}
                  disabled={testing || !settings.apiKey}
                  className="gap-2 min-w-[150px]"
                >
                  {testing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Testing...
                    </>
                  ) : (
                    <>
                      <TestTube className="h-4 w-4" />
                      Test Connection
                    </>
                  )}
                </Button>
                {testResult === "success" && (
                  <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 px-3 py-1">
                    <CheckCircle className="mr-1 h-3 w-3" />
                    Connected
                  </Badge>
                )}
                {testResult === "error" && (
                  <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 px-3 py-1">
                    <AlertCircle className="mr-1 h-3 w-3" />
                    Failed
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Pilih Lokasi + tabel pending */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <MapPin className="h-5 w-5 text-emerald-500" />
                Pilih Lokasi
              </CardTitle>
              <CardDescription>
                Pilih lokasi (Provinsi → Kabupaten → Kecamatan → Desa). Lokasi
                yang dipilih akan otomatis muncul di peta dan tabel di bawah
                untuk ditest & disimpan.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <WilayahSelector
                onChange={handleWilayahChange}
                value={null}
              />

              {pendingLocations.length > 0 && (
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs">Nama Lokasi</TableHead>
                        <TableHead className="text-xs">Koordinat</TableHead>
                        <TableHead className="text-xs">Status Test</TableHead>
                        <TableHead className="text-xs text-right">
                          Aksi
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingLocations.map((loc) => (
                        <TableRow key={loc.tempId}>
                          <TableCell>
                            <p className="font-medium text-sm">{loc.name}</p>
                            <p className="text-xs text-muted-foreground truncate max-w-[220px]">
                              {loc.address}
                            </p>
                          </TableCell>
                          <TableCell className="text-sm whitespace-nowrap">
                            {loc.latitude.toFixed(4)}, {loc.longitude.toFixed(4)}
                          </TableCell>
                          <TableCell>
                            {loc.testResult === "success" && (
                              <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">
                                <CheckCircle className="mr-1 h-3 w-3" />
                                OK
                              </Badge>
                            )}
                            {loc.testResult === "error" && (
                              <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300">
                                <AlertCircle className="mr-1 h-3 w-3" />
                                Gagal
                              </Badge>
                            )}
                            {!loc.testResult && (
                              <span className="text-xs text-muted-foreground">
                                Belum ditest
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 px-2"
                                onClick={() =>
                                  handleTestPendingLocation(loc.tempId)
                                }
                                disabled={loc.testing || !settings.apiKey}
                                title="Test koneksi weather API untuk lokasi ini"
                              >
                                {loc.testing ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <TestTube className="h-3.5 w-3.5" />
                                )}
                              </Button>
                              <Button
                                size="sm"
                                className="h-7 px-2 bg-emerald-600 hover:bg-emerald-700"
                                onClick={() =>
                                  handleSavePendingLocation(loc.tempId)
                                }
                                disabled={loc.saving}
                                title="Simpan lokasi ke database"
                              >
                                {loc.saving ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <Save className="h-3.5 w-3.5" />
                                )}
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 px-2 text-red-500 hover:text-red-600"
                                onClick={() => handleRemovePending(loc.tempId)}
                                title="Batalkan"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Weather Map Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Globe className="h-5 w-5 text-sky-500" />
                Peta Cuaca
              </CardTitle>
              <CardDescription>
                Klik marker untuk melihat detail lokasi
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {isMounted && (
                <WeatherMap
                  apiKey={settings.apiKey || ""}
                  locations={savedLocations.map((loc) => ({
                    name: loc.name,
                    lat: loc.latitude,
                    lng: loc.longitude,
                    province: "Indonesia",
                  }))}
                  selectedLocation={selectedLocation}
                  onSelectLocation={handleMapSelectLocation}
                  height={400}
                />
              )}
              {!settings.apiKey && (
                <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 text-center">
                  <p className="text-xs text-yellow-700 dark:text-yellow-400">
                    ⚠️ Masukkan & simpan API Key untuk menampilkan overlay cuaca
                  </p>
                </div>
              )}
              <div className="flex items-center justify-between text-xs text-muted-foreground bg-slate-50 dark:bg-slate-800/50 rounded-lg px-3 py-2">
                <span>📍 {savedLocations.length} lokasi tersimpan</span>
                {selectedLocation && (
                  <span className="font-medium text-emerald-600 dark:text-emerald-400">
                    ✓ {selectedLocation.name} dipilih
                  </span>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Advanced Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Advanced Settings</CardTitle>
              <CardDescription>
                Konfigurasi lanjutan untuk update data cuaca
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cacheDuration">Cache Duration (detik)</Label>
                  <Input
                    id="cacheDuration"
                    type="number"
                    min={60}
                    max={86400}
                    value={settings.cacheDuration || 300}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        cacheDuration: parseInt(e.target.value) || 300,
                      })
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Min: 60, Max: 86400
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="updateInterval">
                    Update Interval (detik)
                  </Label>
                  <Input
                    id="updateInterval"
                    type="number"
                    min={60}
                    max={86400}
                    value={settings.updateInterval || 3600}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        updateInterval: parseInt(e.target.value) || 3600,
                      })
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Min: 60, Max: 86400
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="retryCount">Retry Count</Label>
                  <Input
                    id="retryCount"
                    type="number"
                    min={1}
                    max={10}
                    value={settings.retryCount || 3}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        retryCount: parseInt(e.target.value) || 3,
                      })
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Min: 1, Max: 10
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timeout">Timeout (ms)</Label>
                  <Input
                    id="timeout"
                    type="number"
                    min={1000}
                    max={30000}
                    value={settings.timeout || 5000}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        timeout: parseInt(e.target.value) || 5000,
                      })
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Min: 1000, Max: 30000
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between border-t pt-4">
                <div className="space-y-0.5">
                  <Label className="text-base">Auto Update</Label>
                  <p className="text-sm text-muted-foreground">
                    Update data cuaca secara otomatis berdasarkan interval
                  </p>
                </div>
                <Switch
                  checked={settings.autoUpdate}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, autoUpdate: checked })
                  }
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Status Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Server className="h-4 w-4 text-blue-500" />
                  <span className="text-sm font-medium">Provider</span>
                </div>
                <span className="text-sm capitalize">
                  {providerConfig?.label || settings.provider}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-medium">Status</span>
                </div>
                <Badge
                  className={
                    settings.apiKey
                      ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                      : "bg-yellow-100 text-yellow-700"
                  }
                >
                  {settings.apiKey ? "Configured" : "Not Configured"}
                </Badge>
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Database className="h-4 w-4 text-purple-500" />
                  <span className="text-sm font-medium">Data Logs</span>
                </div>
                <span className="text-sm">{stats?.totalLogs || 0}</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-yellow-500" />
                  <span className="text-sm font-medium">Last Update</span>
                </div>
                <span className="text-sm">
                  {stats?.lastUpdate
                    ? format(new Date(stats.lastUpdate), "dd MMM yyyy HH:mm", {
                        locale: id,
                      })
                    : "Never"}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-orange-500" />
                  <span className="text-sm font-medium">Success Rate</span>
                </div>
                <span
                  className={`text-sm font-medium ${(stats?.successRate || 0) >= 90 ? "text-green-500" : (stats?.successRate || 0) >= 70 ? "text-yellow-500" : "text-red-500"}`}
                >
                  {stats?.successRate || 0}%
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-sky-500" />
                  <span className="text-sm font-medium">Locations</span>
                </div>
                <span className="text-sm">{savedLocations.length}</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-emerald-500" />
                  <span className="text-sm font-medium">Default Location</span>
                </div>
                <span
                  className="text-sm font-medium text-right max-w-[140px] truncate"
                  title={settings.defaultLocation}
                >
                  {settings.defaultLocation || "Belum diatur"}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Saved Locations List */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Daftar Lokasi Tersimpan</CardTitle>
              <CardDescription>
                {savedLocations.length} lokasi telah disimpan
              </CardDescription>
            </CardHeader>
            <CardContent className="max-h-[300px] overflow-y-auto space-y-2">
              {savedLocations.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Belum ada lokasi tersimpan
                </p>
              ) : (
                savedLocations.map((loc) => (
                  <div
                    key={loc.id}
                    className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">
                        {loc.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {loc.latitude.toFixed(4)}, {loc.longitude.toFixed(4)}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 text-red-500 hover:text-red-600"
                      onClick={() => {
                        setSelectedSavedLocation(loc);
                        setIsDeleteDialogOpen(true);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-center"
                onClick={handleTest}
                disabled={testing || !settings.apiKey}
              >
                <TestTube className="mr-2 h-4 w-4" />
                Test Connection
              </Button>
              <Button
                variant="outline"
                className="w-full justify-center"
                onClick={async () => {
                  await fetchStats();
                  await fetchSavedLocations();
                  toast.success("Data diperbarui");
                }}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh Data
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Delete Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-600">Hapus Lokasi</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus lokasi ini?
            </DialogDescription>
          </DialogHeader>
          {selectedSavedLocation && (
            <div className="py-4">
              <div className="p-3 bg-red-50 dark:bg-red-950/20 rounded-lg">
                <div className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-red-500" />
                  <div>
                    <p className="font-medium">{selectedSavedLocation.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedSavedLocation.latitude.toFixed(4)},{" "}
                      {selectedSavedLocation.longitude.toFixed(4)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={() =>
                selectedSavedLocation &&
                handleDeleteLocation(selectedSavedLocation.id)
              }
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Hapus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}