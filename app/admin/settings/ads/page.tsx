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
  Plus,
  Trash2,
  Loader2,
  Info,
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

const POSITION_OPTIONS = [
  { value: 'top', label: 'Top (Atas)' },
  { value: 'left', label: 'Left (Kiri)' },
  { value: 'right', label: 'Right (Kanan)' },
];

export default function AdSettingsPage() {
  const [settingsList, setSettingsList] = useState<AdSettings[]>([]);
  const [form, setForm] = useState<AdSettings>({
    provider: 'google_adsense',
    scriptUrl: '',
    clientId: '',
    adSlot: '',
    isActive: true,
    position: 'top',
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
        setSettingsList(data);
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
        setForm({
          provider: 'google_adsense',
          scriptUrl: '',
          clientId: '',
          adSlot: '',
          isActive: true,
          position: 'top',
        });
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
        body: JSON.stringify({
          id: item.id,
          isActive: !item.isActive,
        }),
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

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Berhasil disalin');
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
            Pengaturan Iklan
          </h1>
          <p className="text-sm text-muted-foreground">
            Kelola iklan Google AdSense berdasarkan posisi
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchSettings} disabled={loading}>
          <Loader2 className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Form Tambah Iklan */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Tambah Iklan Baru</CardTitle>
          <CardDescription>
            Isi kredensial AdSense dan pilih posisi penempatan
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                placeholder="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-..."
                value={form.scriptUrl}
                onChange={(e) => setForm({ ...form, scriptUrl: e.target.value })}
                className="font-mono text-sm"
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
                <TableHead>Client ID</TableHead>
                <TableHead>Ad Slot</TableHead>
                <TableHead className="max-w-[200px]">Script URL</TableHead>
                <TableHead>Posisi</TableHead>
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
                    <TableCell className="font-mono text-xs">
                      {item.clientId || '-'}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {item.adSlot || '-'}
                    </TableCell>
                    <TableCell className="font-mono text-xs truncate max-w-[200px]" title={item.scriptUrl}>
                      {item.scriptUrl || '-'}
                    </TableCell>
                    <TableCell className="text-sm capitalize">
                      {item.position}
                    </TableCell>
                    <TableCell className="text-center">
                      {item.isActive ? (
                        <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">Aktif</Badge>
                      ) : (
                        <Badge className="bg-gray-100 text-gray-700 dark:bg-gray-800/50 dark:text-gray-300">Nonaktif</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant={item.isActive ? "destructive" : "default"}
                          size="sm"
                          onClick={() => handleToggleActive(item)}
                        >
                          {item.isActive ? "Nonaktifkan" : "Aktifkan"}
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
            <span>Setiap baris mewakili satu posisi iklan (Top, Left, atau Right). Tombol <b>Aktifkan</b> akan menampilkan iklan di posisi tersebut.</span>
          </div>
          <div className="flex items-start gap-2">
            <Info className="h-4 w-4 text-blue-500 mt-1 flex-shrink-0" />
            <span>Jika posisi yang sama ditambahkan lebih dari satu kali, hanya yang terbaru yang akan digunakan oleh komponen <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded text-xs">AdBanner</code>.</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}