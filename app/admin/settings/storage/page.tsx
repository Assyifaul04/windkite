// app/admin/settings/storage/page.tsx
'use client';

import { useState, useEffect } from 'react';
import {
  HardDrive,
  Cloud,
  Database,
  RefreshCw,
  Save,
  Trash2,
  Download,
  Upload,
  FolderOpen,
  FileImage,
  FileVideo,
  FileText,
  CheckCircle,
  AlertCircle,
  Server,
  CloudUpload,
  CloudDownload,
  Clock,
  Users,
  Key,
  Eye,
  EyeOff,
  Folder,
  Archive,
  ExternalLink,
  Loader2,
  Image,
  Calendar,
  Search,
  Filter,
  X,
  Link,
  Copy,
  Info,
  Shield,
  Zap,
  FileArchive,
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
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format, formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';

interface StorageSettings {
  id?: string;
  provider: string;
  databaseUrl: string;
  databaseName: string;
  storageEndpoint: string;
  storageBucket: string;
  storageUrl: string;
  accessKey: string;
  secretKey: string;
  region: string;
  autoBackup: boolean;
  backupSchedule: string;
  retentionDays: number;
  compressImages: boolean;
  maxUploadSize: number;
  googleDriveFolderId: string;
  autoMoveToDrive: boolean;
  tempStorageDays: number;
  createdAt?: string;
  updatedAt?: string;
}

interface FileItem {
  id: string;
  name: string;
  url: string;
  size: number;
  type: string;
  category: string;
  userId: string;
  userName: string;
  userImage: string | null;
  createdAt: string;
  storage: string;
  isPublic: boolean;
  storageType: string;
}

interface StorageStats {
  totalFiles: number;
  totalSize: string;
  totalSizeBytes: number;
  neonFiles: number;
  neonSize: string;
  googleDriveFiles: number;
  googleDriveSize: string;
  images: number;
  tempFiles: number;
}

export default function StorageSettingsPage() {
  const [settings, setSettings] = useState<StorageSettings>({
    provider: 'supabase',
    databaseUrl: '',
    databaseName: 'windkite_db',
    storageEndpoint: '',
    storageBucket: 'kite-frames',
    storageUrl: '',
    accessKey: '',
    secretKey: '',
    region: 'us-east-2',
    autoBackup: true,
    backupSchedule: 'daily',
    retentionDays: 30,
    compressImages: true,
    maxUploadSize: 10,
    googleDriveFolderId: '',
    autoMoveToDrive: true,
    tempStorageDays: 7,
  });
  const [loading, setLoading] = useState(false);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [stats, setStats] = useState<StorageStats | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStorage, setFilterStorage] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [showSecret, setShowSecret] = useState(false);
  const [movingFiles, setMovingFiles] = useState(false);
  const [deletingFiles, setDeletingFiles] = useState(false);
  const [backingUp, setBackingUp] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('supabase');

  useEffect(() => {
    fetchSettings();
    fetchFiles();
    fetchStats();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/admin/settings/storage');
      if (response.ok) {
        const data = await response.json();
        setSettings((prev) => ({ ...prev, ...data }));
        if (data.provider) setActiveTab(data.provider);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast.error('Gagal memuat pengaturan storage');
    }
  };

  const fetchFiles = async () => {
    try {
      const response = await fetch('/api/admin/settings/storage/files');
      if (response.ok) {
        const data = await response.json();
        setFiles(data);
      }
    } catch (error) {
      console.error('Error fetching files:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/settings/storage/stats');
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
      const response = await fetch('/api/admin/settings/storage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        toast.success('Pengaturan storage berhasil disimpan');
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

  const handleMoveToDrive = async () => {
    setMovingFiles(true);
    try {
      const response = await fetch('/api/admin/settings/storage/move-to-drive', {
        method: 'POST',
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(`Berhasil memindahkan ${data.movedCount} file ke Google Drive`);
        await fetchFiles();
        await fetchStats();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Gagal memindahkan file ke Google Drive');
      }
    } catch (error) {
      console.error('Error moving files:', error);
      toast.error('Terjadi kesalahan');
    } finally {
      setMovingFiles(false);
    }
  };

  const handleDeleteTempFiles = async () => {
    setDeletingFiles(true);
    try {
      const response = await fetch('/api/admin/settings/storage/cleanup-temp', {
        method: 'POST',
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(`Berhasil menghapus ${data.deletedCount} file sementara`);
        await fetchFiles();
        await fetchStats();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Gagal membersihkan file sementara');
      }
    } catch (error) {
      console.error('Error cleaning temp files:', error);
      toast.error('Terjadi kesalahan');
    } finally {
      setDeletingFiles(false);
    }
  };

  const handleBackup = async () => {
    setBackingUp(true);
    try {
      const response = await fetch('/api/admin/settings/storage/backup', {
        method: 'POST',
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(`Backup berhasil dibuat: ${data.filename || 'database-backup'}`);
        await fetchFiles();
        await fetchStats();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Gagal membuat backup');
      }
    } catch (error) {
      console.error('Error creating backup:', error);
      toast.error('Terjadi kesalahan saat membuat backup');
    } finally {
      setBackingUp(false);
    }
  };

  const handleDeleteFile = async () => {
    if (!selectedFile) return;
    
    try {
      const response = await fetch(`/api/admin/settings/storage/files/${selectedFile.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('File berhasil dihapus');
        await fetchFiles();
        await fetchStats();
        setIsDeleteDialogOpen(false);
      } else {
        const error = await response.json();
        toast.error(error.error || 'Gagal menghapus file');
      }
    } catch (error) {
      console.error('Error deleting file:', error);
      toast.error('Terjadi kesalahan');
    }
  };

  const handleCopyUrl = (url: string) => {
    if (!url) {
      toast.error('URL tidak tersedia');
      return;
    }
    navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success('URL berhasil disalin');
    setTimeout(() => setCopied(false), 3000);
  };

  // Fixed: Properly typed handlers for Select components
  const handleRegionChange = (value: string | null) => {
    setSettings({ ...settings, region: value || 'us-east-2' });
  };

  const handleFilterStorageChange = (value: string | null) => {
    setFilterStorage(value || 'all');
  };

  const handleFilterTypeChange = (value: string | null) => {
    setFilterType(value || 'all');
  };

  const getStorageBadge = (storage: string) => {
    if (storage === 'supabase' || storage === 'neon') {
      return <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">Supabase</Badge>;
    }
    if (storage === 'google_drive') {
      return <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">Google Drive</Badge>;
    }
    return <Badge variant="secondary">{storage || 'Unknown'}</Badge>;
  };

  const getStorageTypeBadge = (type: string) => {
    if (type === 'temporary') {
      return <Badge variant="outline" className="text-yellow-600 border-yellow-400">Temporary</Badge>;
    }
    if (type === 'permanent') {
      return <Badge variant="outline" className="text-green-600 border-green-400">Permanent</Badge>;
    }
    return <Badge variant="outline">{type || 'Unknown'}</Badge>;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const filteredFiles = files.filter(file => {
    const matchesSearch = file.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      file.userName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStorage = filterStorage === 'all' || file.storage === filterStorage;
    const matchesType = filterType === 'all' || file.storageType === filterType;
    return matchesSearch && matchesStorage && matchesType;
  });

  const loadFromEnv = () => {
    setSettings({
      ...settings,
      storageEndpoint: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      accessKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
      secretKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
      region: 'us-east-2',
      storageUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      storageBucket: 'kite-frames',
      provider: 'supabase',
    });
    setActiveTab('supabase');
    toast.success('Credentials loaded from environment');
  };

  // Get unique storage types for filter
  const storageTypes = ['all', ...new Set(files.map(f => f.storageType))];

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Storage Management</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Kelola storage dan backup file (Supabase Storage & Google Drive)
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline" className="px-3 py-1">
            <Database className="h-3.5 w-3.5 mr-1" />
            Supabase
          </Badge>
          <Badge variant="outline" className="px-3 py-1">
            <Cloud className="h-3.5 w-3.5 mr-1" />
            Google Drive
          </Badge>
          <Button variant="outline" onClick={fetchFiles} size="sm">
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

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card>
            <CardHeader className="pb-1">
              <CardTitle className="text-xs font-medium text-muted-foreground">Total Files</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold">{stats.totalFiles}</div>
              <p className="text-[10px] text-muted-foreground">{stats.totalSize}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-1">
              <CardTitle className="text-xs font-medium text-muted-foreground">Supabase</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold text-blue-600">{stats.neonFiles}</div>
              <p className="text-[10px] text-muted-foreground">{stats.neonSize}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-1">
              <CardTitle className="text-xs font-medium text-muted-foreground">Google Drive</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold text-green-600">{stats.googleDriveFiles}</div>
              <p className="text-[10px] text-muted-foreground">{stats.googleDriveSize}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-1">
              <CardTitle className="text-xs font-medium text-muted-foreground">Temp Files</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold text-yellow-600">{stats.tempFiles}</div>
              <p className="text-[10px] text-muted-foreground">Akan dipindahkan ke Drive</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-2">
        <Button 
          variant="outline" 
          onClick={handleMoveToDrive} 
          disabled={movingFiles} 
          className="gap-2"
          size="sm"
        >
          {movingFiles ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <CloudUpload className="h-4 w-4" />
          )}
          Pindahkan ke Google Drive
        </Button>
        <Button 
          variant="outline" 
          onClick={handleDeleteTempFiles} 
          disabled={deletingFiles} 
          className="gap-2 text-red-600 hover:text-red-700"
          size="sm"
        >
          {deletingFiles ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Trash2 className="h-4 w-4" />
          )}
          Hapus File Sementara
        </Button>
        <Button 
          variant="outline" 
          onClick={handleBackup} 
          disabled={backingUp} 
          className="gap-2"
          size="sm"
        >
          {backingUp ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          Backup Database
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
          <TabsTrigger value="supabase">Supabase Storage</TabsTrigger>
          <TabsTrigger value="google_drive">Google Drive</TabsTrigger>
        </TabsList>

        {/* Supabase Tab */}
        <TabsContent value="supabase" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Database className="h-5 w-5 text-blue-500" />
                    Supabase Storage Configuration
                  </CardTitle>
                  <CardDescription>
                    Konfigurasi koneksi Supabase Storage untuk penyimpanan sementara
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-muted-foreground">Masukkan kredensial Supabase</p>
                    <Button variant="ghost" size="sm" onClick={loadFromEnv} className="gap-2 text-blue-500">
                      <RefreshCw className="h-3 w-3" />
                      Load from Env
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="storageEndpoint">Supabase URL</Label>
                    <Input
                      id="storageEndpoint"
                      value={settings.storageEndpoint || ''}
                      onChange={(e) => setSettings({ ...settings, storageEndpoint: e.target.value })}
                      placeholder="https://qrpddmkcqryxskezdmby.supabase.co"
                      className="font-mono text-sm"
                    />
                    <p className="text-xs text-muted-foreground">
                      Copy dari halaman API di Supabase Console
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="storageBucket">Bucket Name</Label>
                      <Input
                        id="storageBucket"
                        value={settings.storageBucket || 'kite-frames'}
                        onChange={(e) => setSettings({ ...settings, storageBucket: e.target.value })}
                        placeholder="kite-frames"
                        className="font-mono text-sm"
                      />
                      <p className="text-xs text-muted-foreground">
                        Bucket untuk menyimpan file sementara
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="region">Region</Label>
                      <Select
                        value={settings.region || 'us-east-2'}
                        onValueChange={handleRegionChange}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih region" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="us-east-1">US East (N. Virginia)</SelectItem>
                          <SelectItem value="us-east-2">US East (Ohio)</SelectItem>
                          <SelectItem value="us-west-1">US West (N. California)</SelectItem>
                          <SelectItem value="us-west-2">US West (Oregon)</SelectItem>
                          <SelectItem value="eu-west-1">EU West (Ireland)</SelectItem>
                          <SelectItem value="ap-southeast-1">Asia Pacific (Singapore)</SelectItem>
                          <SelectItem value="ap-southeast-2">Asia Pacific (Sydney)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="accessKey">Anon Key</Label>
                      <Input
                        id="accessKey"
                        type="password"
                        value={settings.accessKey || ''}
                        onChange={(e) => setSettings({ ...settings, accessKey: e.target.value })}
                        placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6..."
                        className="font-mono text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="secretKey">Service Role Key</Label>
                      <div className="relative">
                        <Input
                          id="secretKey"
                          type={showSecret ? 'text' : 'password'}
                          value={settings.secretKey || ''}
                          onChange={(e) => setSettings({ ...settings, secretKey: e.target.value })}
                          placeholder="sb_secret_xxxxxxxxxxxxx"
                          className="font-mono text-sm pr-20"
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          className="absolute right-2 top-1/2 -translate-y-1/2"
                          onClick={() => setShowSecret(!showSecret)}
                        >
                          {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Service role key untuk upload file (dari Settings → API)
                      </p>
                    </div>
                  </div>

                  <div className="pt-2 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                    <p className="text-xs text-blue-700 dark:text-blue-300 flex items-start gap-2">
                      <Info className="h-4 w-4 flex-shrink-0 mt-0.5" />
                      <span>
                        File akan disimpan di bucket <code className="bg-blue-100 dark:bg-blue-900/30 px-1.5 py-0.5 rounded text-[10px]">{settings.storageBucket || 'kite-frames'}</code> 
                        {' '}dengan status <strong>Temporary</strong> selama {settings.tempStorageDays || 7} hari sebelum dipindahkan ke Google Drive.
                      </span>
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Bucket Info</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Bucket</span>
                    <span className="font-medium font-mono text-xs">{settings.storageBucket || 'kite-frames'}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Provider</span>
                    <span className="font-medium">Supabase</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Region</span>
                    <span className="font-medium">{settings.region || 'us-east-2'}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Temp Storage</span>
                    <span className="font-medium">{settings.tempStorageDays || 7} days</span>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Status</span>
                    <Badge className="bg-green-100 text-green-700">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Connected
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Google Drive Tab */}
        <TabsContent value="google_drive" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Cloud className="h-5 w-5 text-green-500" />
                    Google Drive Configuration
                  </CardTitle>
                  <CardDescription>
                    Konfigurasi Google Drive untuk penyimpanan permanen
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="googleDriveFolderId">Google Drive Folder ID</Label>
                    <Input
                      id="googleDriveFolderId"
                      value={settings.googleDriveFolderId || ''}
                      onChange={(e) => setSettings({ ...settings, googleDriveFolderId: e.target.value })}
                      placeholder="1ABC123DEF456GHI789JKL"
                      className="font-mono text-sm"
                    />
                    <p className="text-xs text-muted-foreground">
                      ID folder di Google Drive tempat file akan disimpan (ambil dari URL folder)
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center justify-between border rounded-lg p-4">
                      <div className="space-y-0.5">
                        <Label className="text-sm">Auto Move to Drive</Label>
                        <p className="text-xs text-muted-foreground">
                          Pindahkan otomatis ke Google Drive
                        </p>
                      </div>
                      <Switch
                        checked={settings.autoMoveToDrive}
                        onCheckedChange={(checked) => setSettings({ ...settings, autoMoveToDrive: checked })}
                      />
                    </div>

                    <div className="space-y-1 border rounded-lg p-4">
                      <Label htmlFor="tempStorageDays" className="text-sm">Temp Storage (hari)</Label>
                      <Input
                        id="tempStorageDays"
                        type="number"
                        min={1}
                        max={30}
                        value={settings.tempStorageDays}
                        onChange={(e) => setSettings({ ...settings, tempStorageDays: parseInt(e.target.value) || 7 })}
                        className="w-24"
                      />
                      <p className="text-xs text-muted-foreground">
                        Hari penyimpanan di Supabase sebelum dipindahkan
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="accessKey">Service Account Email</Label>
                    <Input
                      id="accessKey"
                      value={settings.accessKey || ''}
                      onChange={(e) => setSettings({ ...settings, accessKey: e.target.value })}
                      placeholder="service-account@project.iam.gserviceaccount.com"
                      className="font-mono text-sm"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="secretKey">Private Key</Label>
                    <div className="relative">
                      <Input
                        id="secretKey"
                        type={showSecret ? 'text' : 'password'}
                        value={settings.secretKey || ''}
                        onChange={(e) => setSettings({ ...settings, secretKey: e.target.value })}
                        placeholder="-----BEGIN PRIVATE KEY-----..."
                        className="font-mono text-sm pr-20"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute right-2 top-1/2 -translate-y-1/2"
                        onClick={() => setShowSecret(!showSecret)}
                      >
                        {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Private key dari service account Google
                    </p>
                  </div>

                  <div className="pt-2 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                    <p className="text-xs text-green-700 dark:text-green-300 flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                      <span>
                        File akan otomatis dipindahkan ke Google Drive setelah <strong>{settings.tempStorageDays || 7} hari</strong> 
                        {' '}dan menjadi <strong>Permanent</strong> di folder <code className="bg-green-100 dark:bg-green-900/30 px-1.5 py-0.5 rounded text-[10px]">
                          {settings.googleDriveFolderId || '[Folder ID]'}
                        </code>
                      </span>
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Drive Info</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Folder ID</span>
                    <span className="font-mono text-xs truncate max-w-[100px]">
                      {settings.googleDriveFolderId ? '✅' : '❌ Not Set'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Auto Move</span>
                    <Badge className={settings.autoMoveToDrive ? 'bg-green-100 text-green-700' : 'bg-gray-100'}>
                      {settings.autoMoveToDrive ? 'Enabled' : 'Disabled'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Files in Drive</span>
                    <span className="font-medium">{stats?.googleDriveFiles || 0}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Drive Size</span>
                    <span className="font-medium">{stats?.googleDriveSize || '0 Bytes'}</span>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Status</span>
                    <Badge className={settings.googleDriveFolderId ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}>
                      {settings.googleDriveFolderId ? (
                        <>
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Configured
                        </>
                      ) : (
                        <>
                          <AlertCircle className="h-3 w-3 mr-1" />
                          Not Configured
                        </>
                      )}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* File Management */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileArchive className="h-5 w-5 text-muted-foreground" />
                File Management
              </CardTitle>
              <CardDescription>
                Kelola file yang disimpan di Supabase Storage dan Google Drive
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {files.length} total files
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search & Filter - Fixed Select handlers */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari file atau pengguna..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-9 text-sm"
              />
            </div>
            <Select value={filterStorage} onValueChange={handleFilterStorageChange}>
              <SelectTrigger className="w-36 h-9 text-sm">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Storage" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua</SelectItem>
                <SelectItem value="supabase">Supabase</SelectItem>
                <SelectItem value="google_drive">Google Drive</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterType} onValueChange={handleFilterTypeChange}>
              <SelectTrigger className="w-36 h-9 text-sm">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua</SelectItem>
                <SelectItem value="temporary">Temporary</SelectItem>
                <SelectItem value="permanent">Permanent</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={fetchFiles} size="sm" className="h-9">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>

          {/* Files Table */}
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[200px]">File</TableHead>
                  <TableHead className="w-[80px]">Size</TableHead>
                  <TableHead className="w-[120px]">User</TableHead>
                  <TableHead className="w-[100px]">Storage</TableHead>
                  <TableHead className="w-[100px]">Type</TableHead>
                  <TableHead className="w-[130px]">Created</TableHead>
                  <TableHead className="w-[120px] text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFiles.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground text-sm">
                      Tidak ada file ditemukan
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredFiles.slice(0, 20).map((file) => (
                    <TableRow key={file.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden flex-shrink-0">
                            <FileImage className="h-5 w-5 text-slate-500" />
                          </div>
                          <div className="min-w-0">
                            <div className="font-medium text-sm truncate max-w-[120px]" title={file.name}>
                              {file.name || 'Untitled'}
                            </div>
                            <div className="text-xs text-muted-foreground truncate">{file.category || 'General'}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm whitespace-nowrap">
                        {file.size > 0 ? formatFileSize(file.size) : '-'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={file.userImage || ''} />
                            <AvatarFallback className="text-[10px]">
                              {file.userName?.charAt(0).toUpperCase() || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm truncate max-w-[60px]" title={file.userName || 'Unknown'}>
                            {file.userName || 'Unknown'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{getStorageBadge(file.storage)}</TableCell>
                      <TableCell>{getStorageTypeBadge(file.storageType)}</TableCell>
                      <TableCell className="text-sm whitespace-nowrap">
                        {file.createdAt ? formatDistanceToNow(new Date(file.createdAt), { addSuffix: true, locale: id }) : '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => {
                              setSelectedFile(file);
                              setIsViewDialogOpen(true);
                            }}
                            disabled={!file.url}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                            onClick={() => {
                              setSelectedFile(file);
                              setIsDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => handleCopyUrl(file.url)}
                            disabled={!file.url}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {files.length > 20 && (
            <div className="text-center text-sm text-muted-foreground">
              Menampilkan 20 dari {files.length} file
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Tips */}
      <Card className="border-dashed border-primary/20">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                <Zap className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="font-medium">1. Upload ke Supabase</p>
                <p className="text-xs text-muted-foreground">File otomatis tersimpan di bucket kite-frames dengan status Temporary</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center flex-shrink-0">
                <Clock className="h-4 w-4 text-yellow-600" />
              </div>
              <div>
                <p className="font-medium">2. Tunggu {settings.tempStorageDays || 7} Hari</p>
                <p className="text-xs text-muted-foreground">File disimpan sementara di Supabase sebelum dipindahkan</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                <Cloud className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="font-medium">3. Pindah ke Google Drive</p>
                <p className="text-xs text-muted-foreground">File otomatis dipindahkan ke Google Drive dan menjadi Permanent</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* View File Dialog - Removed asChild */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>File Details</DialogTitle>
            <DialogDescription>
              Informasi lengkap tentang file
            </DialogDescription>
          </DialogHeader>
          {selectedFile && (
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-4">
                <div className="h-20 w-20 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0">
                  <FileImage className="h-10 w-10 text-slate-500" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold truncate">{selectedFile.name || 'Untitled'}</h3>
                  <p className="text-sm text-muted-foreground">{selectedFile.category || 'General'}</p>
                  <p className="text-sm text-muted-foreground">{selectedFile.size > 0 ? formatFileSize(selectedFile.size) : 'Size unknown'}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t pt-4">
                <div>
                  <p className="text-sm text-muted-foreground">Storage</p>
                  <p className="font-medium">{getStorageBadge(selectedFile.storage)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Type</p>
                  <p>{getStorageTypeBadge(selectedFile.storageType)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Created</p>
                  <p className="font-medium text-sm">
                    {selectedFile.createdAt ? format(new Date(selectedFile.createdAt), 'dd MMM yyyy HH:mm', { locale: id }) : '-'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">User</p>
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={selectedFile.userImage || ''} />
                      <AvatarFallback className="text-[10px]">
                        {selectedFile.userName?.charAt(0).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium text-sm truncate">{selectedFile.userName || 'Unknown'}</span>
                  </div>
                </div>
              </div>

              {selectedFile.url && (
                <div className="border-t pt-4">
                  <p className="text-sm text-muted-foreground mb-2">URL</p>
                  <div className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                    <code className="text-xs truncate flex-1 font-mono">{selectedFile.url}</code>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 flex-shrink-0"
                      onClick={() => handleCopyUrl(selectedFile.url)}
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 flex-shrink-0"
                      onClick={() => window.open(selectedFile.url, '_blank')}
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Button>
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

      {/* Delete File Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-600">Hapus File</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus file ini? Tindakan ini tidak dapat dibatalkan.
            </DialogDescription>
          </DialogHeader>
          {selectedFile && (
            <div className="py-4">
              <div className="p-3 bg-red-50 dark:bg-red-950/20 rounded-lg">
                <div className="flex items-center gap-3">
                  <FileImage className="h-5 w-5 text-red-500 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium truncate">{selectedFile.name || 'Untitled'}</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedFile.size > 0 ? formatFileSize(selectedFile.size) : 'Size unknown'} • {selectedFile.storage || 'Unknown'}
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
            <Button variant="destructive" onClick={handleDeleteFile}>
              <Trash2 className="mr-2 h-4 w-4" />
              Hapus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}