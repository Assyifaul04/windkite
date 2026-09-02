// app/admin/settings/weather-api/page.tsx
'use client';

import { useState, useEffect } from 'react';
import {
  Cloud,
  Key,
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
  MapPin
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

interface WeatherAPISettings {
  id?: string;
  provider: 'openweather' | 'weatherbit' | 'tomorrow' | 'custom';
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

const PROVIDER_CONFIGS = {
  openweather: {
    label: 'OpenWeatherMap',
    docs: 'https://openweathermap.org/current',
    apiUrl: 'https://api.openweathermap.org/data/2.5',
    description: 'Provider cuaca paling populer dengan data lengkap'
  },
  weatherbit: {
    label: 'WeatherBit',
    docs: 'https://www.weatherbit.io/api',
    apiUrl: 'https://api.weatherbit.io/v2.0',
    description: 'Provider dengan data cuaca real-time dan forecast'
  },
  tomorrow: {
    label: 'Tomorrow.io',
    docs: 'https://docs.tomorrow.io/reference',
    apiUrl: 'https://api.tomorrow.io/v4',
    description: 'Provider dengan visualisasi dan analisis cuaca'
  },
  custom: {
    label: 'Custom API',
    docs: '#',
    apiUrl: 'https://your-api.com',
    description: 'Gunakan API custom sendiri'
  }
};

export default function WeatherAPISettingsPage() {
  const [settings, setSettings] = useState<WeatherAPISettings>({
    provider: 'openweather',
    apiKey: '',
    apiUrl: 'https://api.openweathermap.org/data/2.5',
    defaultLocation: 'Jakarta',
    cacheDuration: 300,
    autoUpdate: true,
    updateInterval: 3600,
    retryCount: 3,
    timeout: 5000,
  });
  const [stats, setStats] = useState<WeatherStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);
  const [testMessage, setTestMessage] = useState('');
  const [testWeatherInfo, setTestWeatherInfo] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'testing' | 'connected' | 'error'>('idle');

  useEffect(() => {
    fetchSettings();
    fetchStats();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/admin/settings/weather-api');
      if (response.ok) {
        const data = await response.json();
        if (data) {
          setSettings((prev) => ({ ...prev, ...data }));
        }
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast.error('Gagal memuat pengaturan Weather API');
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/settings/weather-api/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/settings/weather-api', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        toast.success('Pengaturan Weather API berhasil disimpan');
        await fetchSettings();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Gagal menyimpan pengaturan');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  };

  const handleTest = async () => {
    if (!settings.apiKey) {
      toast.error('Masukkan API Key terlebih dahulu');
      return;
    }

    setTesting(true);
    setTestResult(null);
    setTestMessage('');
    setTestWeatherInfo('');
    setConnectionStatus('testing');

    try {
      const response = await fetch('/api/admin/settings/weather-api/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          apiKey: settings.apiKey, 
          provider: settings.provider,
          location: settings.defaultLocation || 'Jakarta'
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setTestResult('success');
        setTestMessage(data.message || '✅ Koneksi Weather API berhasil!');
        setTestWeatherInfo(data.weatherInfo || '');
        setConnectionStatus('connected');
        toast.success('✅ Koneksi Weather API berhasil!');
        await fetchStats();
      } else {
        setTestResult('error');
        setTestMessage(data.error || data.message || '❌ Gagal terhubung ke Weather API');
        setConnectionStatus('error');
        toast.error(data.error || data.message || '❌ Gagal terhubung ke Weather API');
      }
    } catch (error: any) {
      setTestResult('error');
      setTestMessage(error.message || '❌ Terjadi kesalahan saat testing');
      setConnectionStatus('error');
      toast.error('Terjadi kesalahan saat testing');
    } finally {
      setTesting(false);
    }
  };

  const handleProviderChange = (value: string) => {
    const config = PROVIDER_CONFIGS[value as keyof typeof PROVIDER_CONFIGS];
    setSettings({
      ...settings,
      provider: value as any,
      apiUrl: config?.apiUrl || '',
    });
  };

  const providerConfig = PROVIDER_CONFIGS[settings.provider];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Weather API Settings</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Konfigurasi API untuk data cuaca dan angin
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline" className="px-3 py-1">
            <Cloud className="h-3.5 w-3.5 mr-1" />
            {providerConfig?.label || 'Weather'}
          </Badge>
          <Button variant="outline" onClick={fetchSettings} size="sm">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button onClick={handleSave} disabled={loading} size="sm" className="gap-2">
            {loading ? (
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

      {/* Connection Status */}
      {connectionStatus !== 'idle' && (
        <Card className={
          connectionStatus === 'connected' ? 'border-green-200 bg-green-50 dark:bg-green-950/10' :
          connectionStatus === 'error' ? 'border-red-200 bg-red-50 dark:bg-red-950/10' :
          'border-yellow-200 bg-yellow-50 dark:bg-yellow-950/10'
        }>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              {connectionStatus === 'testing' && (
                <Loader2 className="h-5 w-5 animate-spin text-yellow-500" />
              )}
              {connectionStatus === 'connected' && (
                <CheckCircle className="h-5 w-5 text-green-500" />
              )}
              {connectionStatus === 'error' && (
                <AlertCircle className="h-5 w-5 text-red-500" />
              )}
              <span className={
                connectionStatus === 'connected' ? 'text-green-700 dark:text-green-300 font-medium' :
                connectionStatus === 'error' ? 'text-red-700 dark:text-red-300 font-medium' :
                'text-yellow-700 dark:text-yellow-300 font-medium'
              }>
                {testMessage || (connectionStatus === 'connected' ? '✅ Connected' : '❌ Connection Failed')}
              </span>
              {testWeatherInfo && connectionStatus === 'connected' && (
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
                    href={providerConfig?.docs || '#'}
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
                    type={showKey ? 'text' : 'password'}
                    value={settings.apiKey || ''}
                    onChange={(e) => setSettings({ ...settings, apiKey: e.target.value })}
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
                      {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
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
                  value={settings.apiUrl || ''}
                  onChange={(e) => setSettings({ ...settings, apiUrl: e.target.value })}
                  placeholder="https://api.example.com/v3"
                  className="font-mono text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="defaultLocation" className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Default Location
                </Label>
                <Input
                  id="defaultLocation"
                  value={settings.defaultLocation || 'Jakarta'}
                  onChange={(e) => setSettings({ ...settings, defaultLocation: e.target.value })}
                  placeholder="Jakarta"
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  Lokasi default untuk test koneksi dan data cuaca
                </p>
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
                {testResult === 'success' && (
                  <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 px-3 py-1">
                    <CheckCircle className="mr-1 h-3 w-3" />
                    Connected
                  </Badge>
                )}
                {testResult === 'error' && (
                  <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 px-3 py-1">
                    <AlertCircle className="mr-1 h-3 w-3" />
                    Failed
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>

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
                    onChange={(e) => setSettings({ ...settings, cacheDuration: parseInt(e.target.value) || 300 })}
                  />
                  <p className="text-xs text-muted-foreground">Min: 60, Max: 86400</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="updateInterval">Update Interval (detik)</Label>
                  <Input
                    id="updateInterval"
                    type="number"
                    min={60}
                    max={86400}
                    value={settings.updateInterval || 3600}
                    onChange={(e) => setSettings({ ...settings, updateInterval: parseInt(e.target.value) || 3600 })}
                  />
                  <p className="text-xs text-muted-foreground">Min: 60, Max: 86400</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="retryCount">Retry Count</Label>
                  <Input
                    id="retryCount"
                    type="number"
                    min={1}
                    max={10}
                    value={settings.retryCount || 3}
                    onChange={(e) => setSettings({ ...settings, retryCount: parseInt(e.target.value) || 3 })}
                  />
                  <p className="text-xs text-muted-foreground">Min: 1, Max: 10</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timeout">Timeout (ms)</Label>
                  <Input
                    id="timeout"
                    type="number"
                    min={1000}
                    max={30000}
                    value={settings.timeout || 5000}
                    onChange={(e) => setSettings({ ...settings, timeout: parseInt(e.target.value) || 5000 })}
                  />
                  <p className="text-xs text-muted-foreground">Min: 1000, Max: 30000</p>
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
                  onCheckedChange={(checked) => setSettings({ ...settings, autoUpdate: checked })}
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
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Server className="h-4 w-4 text-blue-500" />
                  <span className="text-sm font-medium">Provider</span>
                </div>
                <span className="text-sm capitalize">{providerConfig?.label || settings.provider}</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-medium">Status</span>
                </div>
                <Badge className={settings.apiKey ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' : 'bg-yellow-100 text-yellow-700'}>
                  {settings.apiKey ? 'Configured' : 'Not Configured'}
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
                  {stats?.lastUpdate ? format(new Date(stats.lastUpdate), 'dd MMM yyyy HH:mm', { locale: id }) : 'Never'}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-orange-500" />
                  <span className="text-sm font-medium">Success Rate</span>
                </div>
                <span className={`text-sm font-medium ${(stats?.successRate || 0) >= 90 ? 'text-green-500' : (stats?.successRate || 0) >= 70 ? 'text-yellow-500' : 'text-red-500'}`}>
                  {stats?.successRate || 0}%
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-sky-500" />
                  <span className="text-sm font-medium">Locations</span>
                </div>
                <span className="text-sm">{stats?.totalLocations || 0}</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-emerald-500" />
                  <span className="text-sm font-medium">Default Location</span>
                </div>
                <span className="text-sm font-medium">{settings.defaultLocation || 'Jakarta'}</span>
              </div>
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
                  toast.success('Stats updated');
                }}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh Stats
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}