// app/admin/settings/general/page.tsx
'use client';

import { useState, useEffect } from 'react';
import {
  Globe,
  Shield,
  User,
  Mail,
  Bell,
  Lock,
  Smartphone,
  Globe2,
  Languages,
  Moon,
  Sun,
  Save,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Building,
  Users,
  Clock,
  Calendar
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

interface GeneralSettings {
  siteName: string;
  siteDescription: string;
  siteUrl: string;
  language: string;
  timezone: string;
  dateFormat: string;
  timeFormat: string;
  maintenanceMode: boolean;
  registrationEnabled: boolean;
  emailNotifications: boolean;
  twoFactorAuth: boolean;
  analyticsEnabled: boolean;
}

export default function GeneralSettingsPage() {
  const [settings, setSettings] = useState<GeneralSettings>({
    siteName: 'WindKite Platform',
    siteDescription: 'Platform informasi angin dan desain layangan AI',
    siteUrl: 'https://windkite.com',
    language: 'id',
    timezone: 'Asia/Jakarta',
    dateFormat: 'dd/MM/yyyy',
    timeFormat: 'HH:mm',
    maintenanceMode: false,
    registrationEnabled: true,
    emailNotifications: true,
    twoFactorAuth: false,
    analyticsEnabled: false,
  });
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [sessionTimeout, setSessionTimeout] = useState<string>('60');
  const [maxLoginAttempts, setMaxLoginAttempts] = useState<string>('5');
  const [darkTheme, setDarkTheme] = useState<boolean>(false);
  const [systemTheme, setSystemTheme] = useState<boolean>(true);
  const [primaryColor, setPrimaryColor] = useState<string>('#3b82f6');
  const [senderEmail, setSenderEmail] = useState<string>('');
  const [smtpHost, setSmtpHost] = useState<string>('');
  const [smtpPort, setSmtpPort] = useState<string>('');
  const [smtpUser, setSmtpUser] = useState<string>('');
  const [smtpPassword, setSmtpPassword] = useState<string>('');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/admin/settings/general');
      if (response.ok) {
        const data = await response.json();
        setSettings(data);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  // Fixed: Properly typed onChange handlers
  const handleLanguageChange = (value: string | null) => {
    if (value) {
      setSettings({ ...settings, language: value });
    }
  };

  const handleTimezoneChange = (value: string | null) => {
    if (value) {
      setSettings({ ...settings, timezone: value });
    }
  };

  const handleDateFormatChange = (value: string | null) => {
    if (value) {
      setSettings({ ...settings, dateFormat: value });
    }
  };

  const handleSessionTimeoutChange = (value: string | null) => {
    if (value) {
      setSessionTimeout(value);
    }
  };

  const handleMaxLoginAttemptsChange = (value: string | null) => {
    if (value) {
      setMaxLoginAttempts(value);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/settings/general', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        toast.success('Pengaturan berhasil disimpan');
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } else {
        toast.error('Gagal menyimpan pengaturan');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Pengaturan Umum</h1>
          <p className="text-sm text-muted-foreground">
            Konfigurasi umum platform WindKite
          </p>
        </div>
        <div className="flex items-center gap-2">
          {saved && (
            <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">
              <CheckCircle className="mr-1 h-3 w-3" />
              Tersimpan
            </Badge>
          )}
          <Button variant="outline" onClick={fetchSettings}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            <Save className="mr-2 h-4 w-4" />
            {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList>
          <TabsTrigger value="general">
            <Globe className="mr-2 h-4 w-4" />
            Umum
          </TabsTrigger>
          <TabsTrigger value="security">
            <Shield className="mr-2 h-4 w-4" />
            Keamanan
          </TabsTrigger>
          <TabsTrigger value="appearance">
            <Moon className="mr-2 h-4 w-4" />
            Tampilan
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell className="mr-2 h-4 w-4" />
            Notifikasi
          </TabsTrigger>
        </TabsList>

        {/* General Tab */}
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>Informasi Situs</CardTitle>
              <CardDescription>
                Pengaturan dasar situs dan platform
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="siteName">Nama Situs</Label>
                  <Input
                    id="siteName"
                    value={settings.siteName}
                    onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="siteUrl">URL Situs</Label>
                  <Input
                    id="siteUrl"
                    value={settings.siteUrl}
                    onChange={(e) => setSettings({ ...settings, siteUrl: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="siteDescription">Deskripsi Situs</Label>
                <Textarea
                  id="siteDescription"
                  value={settings.siteDescription}
                  onChange={(e) => setSettings({ ...settings, siteDescription: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="language">Bahasa</Label>
                  <Select
                    value={settings.language}
                    onValueChange={handleLanguageChange}
                  >
                    <SelectTrigger>
                      <Languages className="mr-2 h-4 w-4" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="id">Indonesia</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="ja">日本語</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timezone">Zona Waktu</Label>
                  <Select
                    value={settings.timezone}
                    onValueChange={handleTimezoneChange}
                  >
                    <SelectTrigger>
                      <Clock className="mr-2 h-4 w-4" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Asia/Jakarta">WIB (Asia/Jakarta)</SelectItem>
                      <SelectItem value="Asia/Makassar">WITA (Asia/Makassar)</SelectItem>
                      <SelectItem value="Asia/Jayapura">WIT (Asia/Jayapura)</SelectItem>
                      <SelectItem value="UTC">UTC</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dateFormat">Format Tanggal</Label>
                  <Select
                    value={settings.dateFormat}
                    onValueChange={handleDateFormatChange}
                  >
                    <SelectTrigger>
                      <Calendar className="mr-2 h-4 w-4" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dd/MM/yyyy">DD/MM/YYYY</SelectItem>
                      <SelectItem value="MM/dd/yyyy">MM/DD/YYYY</SelectItem>
                      <SelectItem value="yyyy-MM-dd">YYYY-MM-DD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center justify-between border-t pt-4">
                <div className="space-y-0.5">
                  <Label className="text-base">Mode Pemeliharaan</Label>
                  <p className="text-sm text-muted-foreground">
                    Aktifkan mode pemeliharaan untuk menonaktifkan akses publik
                  </p>
                </div>
                <Switch
                  checked={settings.maintenanceMode}
                  onCheckedChange={(checked) => setSettings({ ...settings, maintenanceMode: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Pendaftaran Pengguna</Label>
                  <p className="text-sm text-muted-foreground">
                    Izinkan pengguna baru untuk mendaftar
                  </p>
                </div>
                <Switch
                  checked={settings.registrationEnabled}
                  onCheckedChange={(checked) => setSettings({ ...settings, registrationEnabled: checked })}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Keamanan</CardTitle>
              <CardDescription>
                Pengaturan keamanan dan autentikasi
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Autentikasi Dua Faktor</Label>
                  <p className="text-sm text-muted-foreground">
                    Wajibkan autentikasi dua faktor untuk semua pengguna admin
                  </p>
                </div>
                <Switch
                  checked={settings.twoFactorAuth}
                  onCheckedChange={(checked) => setSettings({ ...settings, twoFactorAuth: checked })}
                />
              </div>

              <div className="flex items-center justify-between border-t pt-4">
                <div className="space-y-0.5">
                  <Label className="text-base">Session Timeout</Label>
                  <p className="text-sm text-muted-foreground">
                    Waktu session berakhir (menit)
                  </p>
                </div>
                <Select
                  value={sessionTimeout}
                  onValueChange={handleSessionTimeoutChange}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 menit</SelectItem>
                    <SelectItem value="30">30 menit</SelectItem>
                    <SelectItem value="60">60 menit</SelectItem>
                    <SelectItem value="120">120 menit</SelectItem>
                    <SelectItem value="480">480 menit</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between border-t pt-4">
                <div className="space-y-0.5">
                  <Label className="text-base">Maksimum Percobaan Login</Label>
                  <p className="text-sm text-muted-foreground">
                    Jumlah percobaan login sebelum akun terkunci
                  </p>
                </div>
                <Select
                  value={maxLoginAttempts}
                  onValueChange={handleMaxLoginAttemptsChange}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3">3 percobaan</SelectItem>
                    <SelectItem value="5">5 percobaan</SelectItem>
                    <SelectItem value="10">10 percobaan</SelectItem>
                    <SelectItem value="0">Tidak terbatas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Appearance Tab */}
        <TabsContent value="appearance">
          <Card>
            <CardHeader>
              <CardTitle>Tampilan</CardTitle>
              <CardDescription>
                Pengaturan tampilan dan tema
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Tema Gelap</Label>
                  <p className="text-sm text-muted-foreground">
                    Aktifkan tema gelap secara default
                  </p>
                </div>
                <Switch
                  checked={darkTheme}
                  onCheckedChange={(checked) => {
                    setDarkTheme(checked);
                    document.documentElement.classList.toggle('dark', checked);
                  }}
                />
              </div>

              <div className="flex items-center justify-between border-t pt-4">
                <div className="space-y-0.5">
                  <Label className="text-base">Tema Sistem</Label>
                  <p className="text-sm text-muted-foreground">
                    Gunakan tema sesuai pengaturan sistem
                  </p>
                </div>
                <Switch
                  checked={systemTheme}
                  onCheckedChange={(checked) => {
                    setSystemTheme(checked);
                    if (checked) {
                      // Check system preference
                      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                      document.documentElement.classList.toggle('dark', prefersDark);
                    }
                  }}
                />
              </div>

              <div className="border-t pt-4">
                <Label>Warna Primer</Label>
                <div className="flex gap-2 mt-2 flex-wrap">
                  {['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444', '#ec4899'].map((color) => (
                    <button
                      key={color}
                      className={`w-10 h-10 rounded-full border-2 transition-colors ${
                        primaryColor === color ? 'border-primary ring-2 ring-primary ring-offset-2' : 'border-transparent hover:border-primary'
                      }`}
                      style={{ backgroundColor: color }}
                      onClick={() => {
                        setPrimaryColor(color);
                        document.documentElement.style.setProperty('--primary', color);
                      }}
                    />
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notifikasi</CardTitle>
              <CardDescription>
                Pengaturan notifikasi dan email
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Notifikasi Email</Label>
                  <p className="text-sm text-muted-foreground">
                    Kirim notifikasi melalui email
                  </p>
                </div>
                <Switch
                  checked={settings.emailNotifications}
                  onCheckedChange={(checked) => setSettings({ ...settings, emailNotifications: checked })}
                />
              </div>

              <div className="flex items-center justify-between border-t pt-4">
                <div className="space-y-0.5">
                  <Label className="text-base">Analitik</Label>
                  <p className="text-sm text-muted-foreground">
                    Aktifkan pelacakan analitik
                  </p>
                </div>
                <Switch
                  checked={settings.analyticsEnabled}
                  onCheckedChange={(checked) => setSettings({ ...settings, analyticsEnabled: checked })}
                />
              </div>

              <div className="border-t pt-4">
                <Label>Email Pengirim</Label>
                <Input
                  type="email"
                  placeholder="admin@windkite.com"
                  value={senderEmail}
                  onChange={(e) => setSenderEmail(e.target.value)}
                  className="mt-2"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Email yang digunakan untuk mengirim notifikasi
                </p>
              </div>

              <div className="space-y-2">
                <Label>Email SMTP</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input 
                    placeholder="smtp.gmail.com" 
                    value={smtpHost}
                    onChange={(e) => setSmtpHost(e.target.value)}
                  />
                  <Input 
                    placeholder="587" 
                    value={smtpPort}
                    onChange={(e) => setSmtpPort(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input 
                    type="email" 
                    placeholder="admin@windkite.com" 
                    value={smtpUser}
                    onChange={(e) => setSmtpUser(e.target.value)}
                  />
                  <Input 
                    type="password" 
                    placeholder="password" 
                    value={smtpPassword}
                    onChange={(e) => setSmtpPassword(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}