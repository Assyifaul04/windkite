// app/admin/settings/ads/page.tsx
'use client';

import { useState, useEffect } from 'react';
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from '@/components/ui/card';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import {
  Megaphone, Plus, Trash2, Loader2, Info, RefreshCw,
} from 'lucide-react';

interface AdSettings {
  id?: string;
  provider: string;
  name: string;
  position: string;
  isActive: boolean;
  clientId: string;
  adSlot: string;
  scriptUrl: string;
  adCode: string;
  adType: string;
  adSize: string;
  createdAt?: string;
  updatedAt?: string;
}

// ============ KONFIGURASI PROVIDER ============
const PROVIDERS = [
  {
    value: 'google_adsense',
    label: 'Google AdSense',
    description: 'Isi Client ID (ca-pub-xxx), Ad Slot ID, dan Script URL',
  },
  {
    value: 'adsterra',
    label: 'Adsterra',
    description: 'Paste script HTML mentah dari dashboard Adsterra',
  },
  {
    value: 'monetag',
    label: 'Monetag',
    description: 'Paste script HTML mentah dari dashboard Monetag',
  },
  {
    value: 'propellerads',
    label: 'PropellerAds',
    description: 'Paste script HTML mentah dari dashboard PropellerAds',
  },
];

const POSITION_OPTIONS = [
  { value: 'top', label: 'Top (Atas)' },
  { value: 'left', label: 'Left (Kiri)' },
  { value: 'right', label: 'Right (Kanan)' },
  { value: 'bottom', label: 'Bottom (Bawah)' },
  { value: 'global', label: 'Global (Semua Halaman)' },
];

const AD_TYPE_OPTIONS = [
  { value: 'banner', label: 'Banner Display' },
  { value: 'native', label: 'Native Ads' },
  { value: 'popunder', label: 'Popunder' },
  { value: 'interstitial', label: 'Interstitial' },
  { value: 'push', label: 'Push Notification' },
  { value: 'in-page-push', label: 'In-Page Push' },
];

const AD_SIZE_OPTIONS = [
  { value: '728x90', label: '728x90 (Leaderboard)' },
  { value: '300x250', label: '300x250 (Medium Rectangle)' },
  { value: '320x50', label: '320x50 (Mobile Banner)' },
  { value: '160x600', label: '160x600 (Wide Skyscraper)' },
  { value: '300x600', label: '300x600 (Half Page)' },
  { value: 'responsive', label: 'Responsive' },
];

const DEFAULT_FORM: AdSettings = {
  provider: 'google_adsense',
  name: '',
  position: 'top',
  isActive: true,
  clientId: '',
  adSlot: '',
  scriptUrl: '',
  adCode: '',
  adType: 'banner',
  adSize: 'responsive',
};

export default function AdSettingsPage() {
  const [settingsList, setSettingsList] = useState<AdSettings[]>([]);
  const [form, setForm] = useState<AdSettings>(DEFAULT_FORM);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Provider aktif saat ini
  const currentProvider = PROVIDERS.find((p) => p.value === form.provider);
  const isAdSense = form.provider === 'google_adsense';

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/settings/ads');
      if (response.ok) {
        setSettingsList(await response.json());
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

  const handleAdd = async () => {
    // Validasi
    if (!form.name) {
      toast.error('Nama iklan wajib diisi');
      return;
    }
    if (isAdSense && !form.clientId) {
      toast.error('Client ID wajib diisi untuk Google AdSense');
      return;
    }
    if (!isAdSense && !form.adCode) {
      toast.error('Script HTML iklan wajib diisi');
      return;
    }

    try {
      setSaving(true);
      const response = await fetch('/api/admin/settings/ads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Iklan berhasil ditambahkan');
        setForm(DEFAULT_FORM);
        fetchSettings();
      } else {
        toast.error(data.error || 'Gagal menambahkan iklan');
      }
    } catch (error) {
      console.error('Error saving ad settings:', error);
      toast.error('Terjadi kesalahan');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (item: AdSettings) => {
    try {
      const response = await fetch('/api/admin/settings/ads', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: item.id, isActive: !item.isActive }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(`Iklan ${item.isActive ? 'dinonaktifkan' : 'diaktifkan'}`);
        fetchSettings();
      } else {
        toast.error(data.error || 'Gagal mengubah status');
      }
    } catch (error) {
      console.error('Error updating ad settings:', error);
      toast.error('Terjadi kesalahan');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin ingin menghapus iklan ini?')) return;
    try {
      const response = await fetch('/api/admin/settings/ads', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Iklan berhasil dihapus');
        fetchSettings();
      } else {
        toast.error(data.error || 'Gagal menghapus iklan');
      }
    } catch (error) {
      console.error('Error deleting ad settings:', error);
      toast.error('Terjadi kesalahan');
    }
  };

  if (loading && settingsList.length === 0) {
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
            Pengaturan Iklan Multi-Provider
          </h1>
          <p className="text-sm text-muted-foreground">
            Kelola iklan dari Google AdSense, Adsterra, Monetag, dan PropellerAds
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchSettings} disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Form Tambah Iklan */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Tambah Iklan Baru</CardTitle>
          <CardDescription>
            Pilih provider, isi kredensial, dan pilih posisi penempatan
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Baris 1: Provider, Nama, Posisi */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="provider">Provider Iklan</Label>
              <select
                id="provider"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={form.provider}
                onChange={(e) => setForm({ ...form, provider: e.target.value })}
              >
                {PROVIDERS.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground">
                {currentProvider?.description}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Nama Iklan</Label>
              <Input
                id="name"
                placeholder="Mis. Header Banner"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="position">Posisi Penempatan</Label>
              <select
                id="position"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={form.position}
                onChange={(e) => setForm({ ...form, position: e.target.value })}
              >
                {POSITION_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Baris 2: Field Google AdSense */}
          {isAdSense && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="clientId">Client ID</Label>
                <Input
                  id="clientId"
                  placeholder="ca-pub-7542754799825568"
                  value={form.clientId}
                  onChange={(e) => setForm({ ...form, clientId: e.target.value })}
                  className="font-mono text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="adSlot">Ad Slot ID</Label>
                <Input
                  id="adSlot"
                  placeholder="9422886372"
                  value={form.adSlot}
                  onChange={(e) => setForm({ ...form, adSlot: e.target.value })}
                  className="font-mono text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="scriptUrl">Script URL</Label>
                <Input
                  id="scriptUrl"
                  placeholder="https://pagead2.googlesyndication.com/..."
                  value={form.scriptUrl}
                  onChange={(e) => setForm({ ...form, scriptUrl: e.target.value })}
                  className="font-mono text-sm"
                />
              </div>
            </div>
          )}

          {/* Baris 2: Field Adsterra / Monetag / PropellerAds */}
          {!isAdSense && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="adType">Tipe Iklan</Label>
                  <select
                    id="adType"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    value={form.adType}
                    onChange={(e) => setForm({ ...form, adType: e.target.value })}
                  >
                    {AD_TYPE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="adSize">Ukuran Iklan</Label>
                  <select
                    id="adSize"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    value={form.adSize}
                    onChange={(e) => setForm({ ...form, adSize: e.target.value })}
                  >
                    {AD_SIZE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="adCode">Script HTML Iklan</Label>
                <Textarea
                  id="adCode"
                  placeholder={`Paste script mentah dari dashboard ${currentProvider?.label} di sini...\n\nContoh:\n<script type="text/javascript">\n  atOptions = { 'key': 'xxx', 'format': 'iframe', 'height': 90, 'width': 728 };\n</script>\n<script src="//www.highperformanceformat.com/xxx/invoke.js"></script>`}
                  value={form.adCode}
                  onChange={(e) => setForm({ ...form, adCode: e.target.value })}
                  className="font-mono text-xs min-h-[140px]"
                />
                <p className="text-xs text-muted-foreground">
                  Copy seluruh kode iklan dari dashboard provider (termasuk tag &lt;script&gt;).
                </p>
              </div>
            </>
          )}

          <div className="flex items-center gap-3 pt-2">
            <Button onClick={handleAdd} disabled={saving} className="gap-2">
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              Tambah Iklan
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabel List Iklan */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Daftar Iklan Terpasang</CardTitle>
          <CardDescription>
            Kelola status dan hapus iklan yang sudah ada
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama</TableHead>
                <TableHead>Provider</TableHead>
                <TableHead>Posisi</TableHead>
                <TableHead>Tipe / Ukuran</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {settingsList.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Belum ada iklan terpasang. Tambahkan melalui form di atas.
                  </TableCell>
                </TableRow>
              ) : (
                settingsList.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">
                      {item.name || '-'}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {PROVIDERS.find((p) => p.value === item.provider)?.label || item.provider}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm capitalize">
                      {item.position}
                    </TableCell>
                    <TableCell className="text-xs">
                      {item.provider === 'google_adsense'
                        ? `Slot: ${item.adSlot || '-'}`
                        : `${item.adType || '-'} • ${item.adSize || '-'}`}
                    </TableCell>
                    <TableCell className="text-center">
                      {item.isActive ? (
                        <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">
                          Aktif
                        </Badge>
                      ) : (
                        <Badge className="bg-gray-100 text-gray-700 dark:bg-gray-800/50 dark:text-gray-300">
                          Nonaktif
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant={item.isActive ? 'destructive' : 'default'}
                          size="sm"
                          onClick={() => handleToggleActive(item)}
                        >
                          {item.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(item.id!)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Informasi</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <div className="flex items-start gap-2">
            <Info className="h-4 w-4 text-blue-500 mt-1 flex-shrink-0" />
            <span>
              <b>Google AdSense</b> menggunakan Client ID + Ad Slot + Script URL.
            </span>
          </div>
          <div className="flex items-start gap-2">
            <Info className="h-4 w-4 text-blue-500 mt-1 flex-shrink-0" />
            <span>
              <b>Adsterra, Monetag, PropellerAds</b> menggunakan script HTML mentah. Paste seluruh kode dari dashboard provider.
            </span>
          </div>
          <div className="flex items-start gap-2">
            <Info className="h-4 w-4 text-blue-500 mt-1 flex-shrink-0" />
            <span>
              Hanya <b>satu iklan aktif per posisi</b> yang akan ditampilkan (yang terbaru menang).
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}