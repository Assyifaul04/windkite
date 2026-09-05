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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
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
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

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
  { value: 'global', label: 'Global (Seluruh Halaman)' },
  { value: 'header', label: 'Header (Atas Halaman)' },
  { value: 'sidebar', label: 'Sidebar (Samping)' },
  { value: 'footer', label: 'Footer (Bawah Halaman)' },
  { value: 'content', label: 'Content (Dalam Konten)' },
];

const PROVIDER_OPTIONS = [
  { value: 'google_adsense', label: 'Google AdSense' },
  { value: 'custom', label: 'Custom Script' },
];

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
  const [previewMode, setPreviewMode] = useState(false);
  const [copied, setCopied] = useState(false);

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
    setCopied(true);
    toast.success('Berhasil disalin');
    setTimeout(() => setCopied(false), 3000);
  };

  // Generate script preview
  const generateScriptPreview = () => {
    if (!settings.clientId) return null;
    
    return `<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${settings.clientId}" crossorigin="anonymous"></script>
<!-- ${settings.position === 'global' ? 'Global Ad' : settings.position} -->
<ins class="adsbygoogle"
     style="display:block"
     data-ad-client="${settings.clientId}"
     ${settings.adSlot ? `data-ad-slot="${settings.adSlot}"` : ''}
     data-ad-format="auto"
     data-full-width-responsive="true"></ins>
<script>
     (adsbygoogle = window.adsbygoogle || []).push({});
</script>`;
  };

  const getStatusBadge = () => {
    if (!settings.isActive) {
      return <Badge className="bg-gray-100 text-gray-700 dark:bg-gray-800/50 dark:text-gray-300">Nonaktif</Badge>;
    }
    if (settings.clientId || settings.scriptUrl) {
      return <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">Aktif</Badge>;
    }
    return <Badge className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300">Belum Dikonfigurasi</Badge>;
  };

  // ==========================================
  // PERBAIKAN: Handler dengan type (string | null)
  // ==========================================
  const handleProviderChange = (value: string | null) => {
    setSettings({ ...settings, provider: value || 'google_adsense' });
  };

  const handlePositionChange = (value: string | null) => {
    setSettings({ ...settings, position: value || 'global' });
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="h-8 w-48 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
            <div className="h-4 w-64 bg-slate-200 dark:bg-slate-800 rounded mt-1 animate-pulse" />
          </div>
          <div className="h-10 w-32 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-64 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
          <div className="h-64 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
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
            <Megaphone className="h-6 w-6 text-orange-500" />
            Pengaturan Iklan
          </h1>
          <p className="text-sm text-muted-foreground">
            Konfigurasi Google AdSense dan iklan lainnya
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Main Settings */}
        <div className="space-y-6">
          {/* Provider Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Konfigurasi Provider</CardTitle>
              <CardDescription>
                Pilih provider iklan dan masukkan kredensial
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="provider">Provider</Label>
                <Select
                  value={settings.provider}
                  onValueChange={handleProviderChange}
                >
                  <SelectTrigger>
                    <Megaphone className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="Pilih provider" />
                  </SelectTrigger>
                  <SelectContent>
                    {PROVIDER_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {settings.provider === 'google_adsense' ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="clientId">Client ID (ca-pub-xxxxxxxx)</Label>
                    <div className="relative">
                      <Input
                        id="clientId"
                        placeholder="ca-pub-1234567890123456"
                        value={settings.clientId || ''}
                        onChange={(e) => setSettings({ ...settings, clientId: e.target.value })}
                        className="font-mono text-sm"
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
                    <p className="text-xs text-muted-foreground">
                      Dapatkan Client ID dari halaman AdSense → Settings → Account
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="adSlot">Ad Slot ID (Opsional)</Label>
                    <Input
                      id="adSlot"
                      placeholder="1234567890"
                      value={settings.adSlot || ''}
                      onChange={(e) => setSettings({ ...settings, adSlot: e.target.value })}
                      className="font-mono text-sm"
                    />
                    <p className="text-xs text-muted-foreground">
                      ID unit iklan spesifik (opsional, jika tidak diisi akan menggunakan auto ad)
                    </p>
                  </div>
                </>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="scriptUrl">Custom Script URL</Label>
                  <Input
                    id="scriptUrl"
                    placeholder="https://example.com/ads.js"
                    value={settings.scriptUrl || ''}
                    onChange={(e) => setSettings({ ...settings, scriptUrl: e.target.value })}
                    className="font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground">
                    URL script iklan custom jika menggunakan provider lain
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Position & Status */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Posisi & Status</CardTitle>
              <CardDescription>
                Atur posisi penempatan dan status iklan
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="position">Posisi Iklan</Label>
                <Select
                  value={settings.position}
                  onValueChange={handlePositionChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih posisi" />
                  </SelectTrigger>
                  <SelectContent>
                    {POSITION_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                <div className="space-y-0.5">
                  <Label className="text-base">Aktifkan Iklan</Label>
                  <p className="text-sm text-muted-foreground">
                    Tampilkan iklan di website
                  </p>
                </div>
                <Switch
                  checked={settings.isActive}
                  onCheckedChange={(checked) => setSettings({ ...settings, isActive: checked })}
                />
              </div>

              <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <Info className="h-4 w-4 text-blue-500 flex-shrink-0" />
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  {settings.isActive 
                    ? 'Iklan akan ditampilkan di website sesuai dengan posisi yang dipilih'
                    : 'Iklan dinonaktifkan dan tidak akan ditampilkan di website'}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Preview */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Preview Script</CardTitle>
                  <CardDescription>
                    Preview script iklan yang akan digunakan
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPreviewMode(!previewMode)}
                  className="gap-2"
                >
                  {previewMode ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  {previewMode ? 'Sembunyikan' : 'Lihat'}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {previewMode && (
                <div className="space-y-3">
                  <div className="bg-slate-100 dark:bg-slate-800 rounded-lg p-4 overflow-auto max-h-[300px]">
                    <pre className="text-xs font-mono text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                      {generateScriptPreview() || 'Belum ada konfigurasi untuk preview'}
                    </pre>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => handleCopy(generateScriptPreview() || '')}
                      disabled={!settings.clientId}
                    >
                      <Copy className="h-3 w-3 mr-1" />
                      Copy Script
                    </Button>
                    <a
                      href="https://adsense.google.com/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex h-7 items-center justify-center rounded-md border border-input bg-background px-3 text-xs font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
                    >
                      <ExternalLink className="h-3 w-3 mr-1" />
                      Buka AdSense
                    </a>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - Info & Status */}
        <div className="space-y-6">
          {/* Status Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Megaphone className="h-4 w-4 text-orange-500" />
                  <span className="text-sm font-medium">Provider</span>
                </div>
                <span className="text-sm capitalize">
                  {PROVIDER_OPTIONS.find(p => p.value === settings.provider)?.label || settings.provider}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <CheckCircle className={`h-4 w-4 ${settings.isActive ? 'text-green-500' : 'text-gray-400'}`} />
                  <span className="text-sm font-medium">Status</span>
                </div>
                <div>{getStatusBadge()}</div>
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Info className="h-4 w-4 text-blue-500" />
                  <span className="text-sm font-medium">Posisi</span>
                </div>
                <span className="text-sm capitalize">
                  {POSITION_OPTIONS.find(p => p.value === settings.position)?.label || settings.position}
                </span>
              </div>

              {settings.clientId && (
                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Info className="h-4 w-4 text-purple-500" />
                    <span className="text-sm font-medium">Client ID</span>
                  </div>
                  <span className="text-sm font-mono truncate max-w-[140px]" title={settings.clientId}>
                    {settings.clientId}
                  </span>
                </div>
              )}

              {settings.adSlot && (
                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Info className="h-4 w-4 text-emerald-500" />
                    <span className="text-sm font-medium">Ad Slot</span>
                  </div>
                  <span className="text-sm font-mono">{settings.adSlot}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Info Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Informasi</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-1.5 flex-shrink-0" />
                <span>Client ID dimulai dengan <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded text-xs">ca-pub-</code></span>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
                <span>Ad Slot adalah ID unit iklan spesifik (opsional)</span>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-orange-500 mt-1.5 flex-shrink-0" />
                <span>Pastikan Client ID sudah terverifikasi di AdSense</span>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 flex-shrink-0" />
                <span>Iklan akan muncul setelah script diimplementasikan</span>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Aksi Cepat</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button 
                variant="outline" 
                className="w-full justify-center"
                onClick={handleSave}
                disabled={saving}
              >
                <Save className="mr-2 h-4 w-4" />
                Simpan Pengaturan
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-center"
                onClick={() => {
                  if (settings.clientId) {
                    const pubId = settings.clientId.replace('ca-pub-', '');
                    window.open(`https://www.google.com/adsense/new/u/0/pub-${pubId}/home`, '_blank');
                  } else {
                    toast.info('Client ID belum diatur');
                  }
                }}
                disabled={!settings.clientId}
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                Buka Dashboard AdSense
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}