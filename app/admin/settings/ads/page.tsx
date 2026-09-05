// app/admin/settings/ads/page.tsx
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  Megaphone,
  Save,
  RefreshCw,
  Loader2,
  CheckCircle,
  AlertCircle,
  Eye,
  EyeOff,
  Info,
  ExternalLink,
  Copy,
} from 'lucide-react';

interface AdSettings {
  id?: string;
  provider: string;
  scriptUrl: string;
  clientId: string;
  adSlot: string;
  isActive: boolean;
  position: string;
  createdAt?: string;
  updatedAt?: string;
}

export default function AdSettingsPage() {
  const [settings, setSettings] = useState<AdSettings>({
    provider: 'google_adsense',
    scriptUrl: '',
    clientId: '',
    adSlot: '',
    isActive: true,
    position: 'global',
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/settings/ads');
      
      if (response.ok) {
        const data = await response.json();
        setSettings(data);
      } else {
        toast.error('Gagal memuat pengaturan iklan');
      }
    } catch (error) {
      console.error('Error fetching ad settings:', error);
      toast.error('Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const response = await fetch('/api/admin/settings/ads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Pengaturan iklan berhasil disimpan');
        if (data.data) {
          setSettings(data.data);
        }
      } else {
        toast.error(data.error || 'Gagal menyimpan pengaturan');
      }
    } catch (error) {
      console.error('Error saving ad settings:', error);
      toast.error('Terjadi kesalahan');
    } finally {
      setSaving(false);
    }
  };

  const handleCopy = (text: string) => {
    if (!text) {
      toast.error('Tidak ada teks untuk disalin');
      return;
    }
    navigator.clipboard.writeText(text);
    toast.success('Berhasil disalin');
  };

  const getStatusBadge = () => {
    if (!settings.isActive) {
      return <Badge className="bg-gray-100 text-gray-700 dark:bg-gray-800/50 dark:text-gray-300">Nonaktif</Badge>;
    }
    if (settings.clientId && settings.scriptUrl) {
      return <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">Aktif & Siap Tayang</Badge>;
    }
    return <Badge className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300">Belum Lengkap</Badge>;
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="h-8 w-48 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
        <div className="h-64 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Megaphone className="h-6 w-6 text-orange-500" />
            Pengaturan Iklan
          </h1>
          <p className="text-sm text-muted-foreground">
            Konfigurasi Google AdSense dan status penayangan
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 mr-2">
            <span className="text-sm text-muted-foreground">Status:</span>
            {getStatusBadge()}
          </div>
          <Button variant="outline" size="sm" onClick={fetchSettings} disabled={loading}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button size="sm" onClick={handleSave} disabled={saving} className="gap-2">
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Menyimpan...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Simpan
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Form Pengisian */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Konfigurasi Kredensial AdSense</CardTitle>
          <CardDescription>
            Masukkan data yang didapat dari Google AdSense
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="clientId">Client ID</Label>
              <div className="relative">
                <Input
                  id="clientId"
                  placeholder="ca-pub-7542754799825568"
                  value={settings.clientId || ''}
                  onChange={(e) => setSettings({ ...settings, clientId: e.target.value })}
                  className="font-mono text-sm pr-10"
                />
                {settings.clientId && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-7 px-2"
                    onClick={() => handleCopy(settings.clientId || '')}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="adSlot">Ad Slot ID</Label>
              <Input
                id="adSlot"
                placeholder="9422886372"
                value={settings.adSlot || ''}
                onChange={(e) => setSettings({ ...settings, adSlot: e.target.value })}
                className="font-mono text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="scriptUrl">Script URL</Label>
              <Input
                id="scriptUrl"
                placeholder="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7542754799825568"
                value={settings.scriptUrl || ''}
                onChange={(e) => setSettings({ ...settings, scriptUrl: e.target.value })}
                className="font-mono text-sm"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabel Posisi & Status */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Posisi & Status Penayangan</CardTitle>
          <CardDescription>
            Atur posisi iklan sesuai komponen AdBanner dan status aktif/nonaktif
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px]">Posisi</TableHead>
                <TableHead>Deskripsi</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium">Top (Atas)</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  Ditampilkan di header atas halaman user
                </TableCell>
                <TableCell className="text-center">
                  {settings.isActive ? (
                    <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">Aktif</Badge>
                  ) : (
                    <Badge className="bg-gray-100 text-gray-700 dark:bg-gray-800/50 dark:text-gray-300">Nonaktif</Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant={settings.isActive ? "destructive" : "default"}
                    size="sm"
                    onClick={() => setSettings({ ...settings, isActive: !settings.isActive })}
                  >
                    {settings.isActive ? "Nonaktifkan" : "Aktifkan"}
                  </Button>
                </TableCell>
              </TableRow>

              <TableRow>
                <TableCell className="font-medium">Left (Kiri)</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  Sidebar kiri pada halaman user
                </TableCell>
                <TableCell className="text-center">
                  {settings.isActive ? (
                    <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">Aktif</Badge>
                  ) : (
                    <Badge className="bg-gray-100 text-gray-700 dark:bg-gray-800/50 dark:text-gray-300">Nonaktif</Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant={settings.isActive ? "destructive" : "default"}
                    size="sm"
                    onClick={() => setSettings({ ...settings, isActive: !settings.isActive })}
                  >
                    {settings.isActive ? "Nonaktifkan" : "Aktifkan"}
                  </Button>
                </TableCell>
              </TableRow>

              <TableRow>
                <TableCell className="font-medium">Right (Kanan)</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  Sidebar kanan pada halaman user
                </TableCell>
                <TableCell className="text-center">
                  {settings.isActive ? (
                    <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">Aktif</Badge>
                  ) : (
                    <Badge className="bg-gray-100 text-gray-700 dark:bg-gray-800/50 dark:text-gray-300">Nonaktif</Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant={settings.isActive ? "destructive" : "default"}
                    size="sm"
                    onClick={() => setSettings({ ...settings, isActive: !settings.isActive })}
                  >
                    {settings.isActive ? "Nonaktifkan" : "Aktifkan"}
                  </Button>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Info Tambahan */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Informasi Penting</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <div className="flex items-start gap-2">
            <Info className="h-4 w-4 text-blue-500 mt-1 flex-shrink-0" />
            <span>Pastikan <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded text-xs">Client ID</code> dan <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded text-xs">Script URL</code> sudah diisi agar iklan muncul di komponen AdBanner.</span>
          </div>
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-yellow-500 mt-1 flex-shrink-0" />
            <span>Jika tombol berwarna merah ("Nonaktifkan") ditekan, iklan akan disembunyikan dari semua posisi.</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}