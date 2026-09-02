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
  Info
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
    provider: 'neon',
    databaseUrl: '',
    databaseName: 'windkite_db',
    storageEndpoint: '',
    storageBucket: 'kite-designs',
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
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [showSecret, setShowSecret] = useState(false);
  const [movingFiles, setMovingFiles] = useState(false);
  const [deletingFiles, setDeletingFiles] = useState(false);
  const [backingUp, setBackingUp] = useState(false);
  const [copied, setCopied] = useState(false);

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
      } else {
        toast.error('Gagal memuat daftar file');
      }
    } catch (error) {
      console.error('Error fetching files:', error);
      toast.error('Gagal memuat daftar file');
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

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      success: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
      failed: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
      running: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
    };
    const labels: Record<string, string> = {
      success: 'Success',
      failed: 'Failed',
      running: 'Running',
    };
    return <Badge className={styles[status]}>{labels[status]}</Badge>;
  };

  const getStorageBadge = (storage: string) => {
    if (storage === 'neon') {
      return <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">Neon S3</Badge>;
    }
    if (storage === 'google_drive') {
      return <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">Google Drive</Badge>;
    }
    return <Badge variant="secondary">{storage || 'Unknown'}</Badge>;
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
    return matchesSearch && matchesStorage;
  });

  // Load credentials dari environment variables
  const loadFromEnv = () => {
    setSettings({
      ...settings,
      storageEndpoint: process.env.NEXT_PUBLIC_AWS_ENDPOINT_URL_S3 || '',
      accessKey: process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID || '',
      secretKey: process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY || '',
      region: process.env.NEXT_PUBLIC_AWS_REGION || 'us-east-2',
      storageUrl: process.env.NEXT_PUBLIC_NEON_STORAGE_URL || '',
      storageBucket: 'kite-designs',
    });
    toast.success('Credentials loaded from environment');
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Storage Management</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Kelola storage dan backup file (Neon S3 & Google Drive)
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline" className="px-3 py-1">
            <Database className="h-3.5 w-3.5 mr-1" />
            Neon S3
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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Files</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalFiles}</div>
              <p className="text-xs text-muted-foreground">{stats.totalSize}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Neon S3</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.neonFiles}</div>
              <p className="text-xs text-muted-foreground">{stats.neonSize}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Google Drive</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.googleDriveFiles}</div>
              <p className="text-xs text-muted-foreground">{stats.googleDriveSize}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Temp Files</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.tempFiles}</div>
              <p className="text-xs text-muted-foreground">Akan dipindahkan ke Drive</p>
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
        >
          {backingUp ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          Backup Database
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Settings */}
        <div className="lg:col-span-2 space-y-6">
          {/* Neon S3 Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Neon S3 Configuration</CardTitle>
              <CardDescription>
                Konfigurasi koneksi Neon S3 Object Storage
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <p className="text-sm text-muted-foreground">Masukkan kredensial Neon S3</p>
                <Button variant="ghost" size="sm" onClick={loadFromEnv} className="gap-2 text-blue-500">
                  <RefreshCw className="h-3 w-3" />
                  Load from Env
                </Button>
              </div>

              <div className="space-y-2">
                <Label htmlFor="storageEndpoint">Endpoint URL</Label>
                <Input
                  id="storageEndpoint"
                  value={settings.storageEndpoint || ''}
                  onChange={(e) => setSettings({ ...settings, storageEndpoint: e.target.value })}
                  placeholder="https://br-shiny-mud-a5szcv3j.storage.c-1.us-east-2.aws.neon.tech"
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  Copy dari halaman Credentials di Neon Object Storage
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="storageUrl">Storage URL (Base)</Label>
                <Input
                  id="storageUrl"
                  value={settings.storageUrl || ''}
                  onChange={(e) => setSettings({ ...settings, storageUrl: e.target.value })}
                  placeholder="https://br-shiny-mud-a5szcv3j.storage.c-1.us-east-2.aws.neon.tech"
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  URL dasar untuk mengakses file di bucket
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="storageBucket">Bucket Name</Label>
                  <Input
                    id="storageBucket"
                    value={settings.storageBucket || 'kite-designs'}
                    onChange={(e) => setSettings({ ...settings, storageBucket: e.target.value })}
                    placeholder="kite-designs"
                    className="font-mono text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="region">Region</Label>
                  <Select
                    value={settings.region || 'us-east-2'}
                    onValueChange={(value) => setSettings({ ...settings, region: value })}
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
                  <Label htmlFor="accessKey">Access Key</Label>
                  <Input
                    id="accessKey"
                    type="password"
                    value={settings.accessKey || ''}
                    onChange={(e) => setSettings({ ...settings, accessKey: e.target.value })}
                    placeholder="nak_live_xxxxxxxxxxxxx"
                    className="font-mono text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="secretKey">Secret Key</Label>
                  <div className="relative">
                    <Input
                      id="secretKey"
                      type={showSecret ? 'text' : 'password'}
                      value={settings.secretKey || ''}
                      onChange={(e) => setSettings({ ...settings, secretKey: e.target.value })}
                      placeholder="nsk_live_xxxxxxxxxxxxx"
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
                </div>
              </div>

              <div className="pt-2 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  <Info className="h-3 w-3 inline mr-1" />
                  URL Format: <code className="bg-blue-100 dark:bg-blue-900/30 px-2 py-0.5 rounded text-xs">
                    {settings.storageUrl || 'https://<endpoint>'}/{settings.storageBucket || 'kite-designs'}/{'{folder}/{file}'}
                  </code>
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Google Drive Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Google Drive Configuration</CardTitle>
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
                  ID folder di Google Drive tempat file akan disimpan
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between border-t pt-4">
                  <div className="space-y-0.5">
                    <Label className="text-base">Auto Move to Drive</Label>
                    <p className="text-sm text-muted-foreground">
                      Pindahkan otomatis ke Google Drive
                    </p>
                  </div>
                  <Switch
                    checked={settings.autoMoveToDrive}
                    onCheckedChange={(checked) => setSettings({ ...settings, autoMoveToDrive: checked })}
                  />
                </div>

                <div className="space-y-2 border-t pt-4">
                  <Label htmlFor="tempStorageDays">Temp Storage (days)</Label>
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
                    Hari penyimpanan di Neon sebelum dipindahkan
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="accessKey">Google Service Account Email</Label>
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
              </div>
            </CardContent>
          </Card>

          {/* File Management */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">File Management</CardTitle>
              <CardDescription>
                Kelola file yang disimpan di Neon S3 dan Google Drive
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Search & Filter */}
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Cari file atau pengguna..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select value={filterStorage} onValueChange={setFilterStorage}>
                  <SelectTrigger className="w-40">
                    <Filter className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="Storage" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua</SelectItem>
                    <SelectItem value="neon">Neon S3</SelectItem>
                    <SelectItem value="google_drive">Google Drive</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" onClick={fetchFiles} size="sm">
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
                      <TableHead className="w-[130px]">Created</TableHead>
                      <TableHead className="w-[120px] text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredFiles.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          Tidak ada file ditemukan
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredFiles.slice(0, 20).map((file) => (
                        <TableRow key={file.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden flex-shrink-0">
                                <Image className="h-5 w-5 text-slate-500" />
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
                                <AvatarFallback>
                                  {file.userName?.charAt(0).toUpperCase() || 'U'}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-sm truncate max-w-[60px]" title={file.userName || 'Unknown'}>
                                {file.userName || 'Unknown'}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>{getStorageBadge(file.storage)}</TableCell>
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
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Storage Usage */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Storage Usage</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm">Used</span>
                  <span className="text-sm font-medium">{stats?.totalSize || '0 GB'} / 10 GB</span>
                </div>
                <Progress value={24} className="h-2" />
                <p className="text-xs text-muted-foreground mt-1">24% used</p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg text-center">
                  <FileImage className="h-5 w-5 text-pink-500 mx-auto mb-1" />
                  <p className="text-sm font-medium">{stats?.totalSize || '0 GB'}</p>
                  <p className="text-xs text-muted-foreground">Total</p>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg text-center">
                  <Database className="h-5 w-5 text-blue-500 mx-auto mb-1" />
                  <p className="text-sm font-medium">{stats?.neonFiles || 0}</p>
                  <p className="text-xs text-muted-foreground">Neon S3</p>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg text-center">
                  <Cloud className="h-5 w-5 text-green-500 mx-auto mb-1" />
                  <p className="text-sm font-medium">{stats?.googleDriveFiles || 0}</p>
                  <p className="text-xs text-muted-foreground">GDrive</p>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg text-center">
                  <Clock className="h-5 w-5 text-yellow-500 mx-auto mb-1" />
                  <p className="text-sm font-medium">{stats?.tempFiles || 0}</p>
                  <p className="text-xs text-muted-foreground">Temp</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Storage Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Storage Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Provider</span>
                <span className="font-medium capitalize">{settings.provider || 'neon'}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Bucket</span>
                <span className="font-medium font-mono text-xs">{settings.storageBucket || '-'}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Region</span>
                <span className="font-medium">{settings.region || '-'}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Temp Storage</span>
                <span className="font-medium">{settings.tempStorageDays || 7} days</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Auto Move</span>
                <Badge className={settings.autoMoveToDrive ? 'bg-green-100 text-green-700' : 'bg-gray-100'}>
                  {settings.autoMoveToDrive ? 'Enabled' : 'Disabled'}
                </Badge>
              </div>
              <div className="flex items-center justify-between text-sm border-t pt-2">
                <span className="text-muted-foreground">Endpoint</span>
                <span className="font-mono text-xs truncate max-w-[120px]" title={settings.storageEndpoint}>
                  {settings.storageEndpoint ? '✅' : '❌ Not Set'}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Quick Tips */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Tips</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>File AI otomatis tersimpan di Neon S3</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>File akan dipindahkan ke Google Drive setelah {settings.tempStorageDays || 7} hari</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>Backup database dapat dilakukan manual atau otomatis</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* View File Dialog */}
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
                  <Image className="h-10 w-10 text-slate-500" />
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
                      <AvatarFallback>
                        {selectedFile.userName?.charAt(0).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium text-sm truncate">{selectedFile.userName || 'Unknown'}</span>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Public</p>
                  <Badge className={selectedFile.isPublic ? 'bg-green-100 text-green-700' : 'bg-gray-100'}>
                    {selectedFile.isPublic ? 'Yes' : 'No'}
                  </Badge>
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
                  <Image className="h-5 w-5 text-red-500 flex-shrink-0" />
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