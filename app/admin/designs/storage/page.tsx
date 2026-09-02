// app/admin/designs/storage/page.tsx
'use client';

import { useState, useEffect } from 'react';
import {
  DatabaseIcon,
  HardDrive,
  File,
  Image as ImageIcon,
  FileArchive,
  Trash2,
  RefreshCw,
} from 'lucide-react';
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
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';

interface StorageFile {
  id: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  storageType: string;
  source: string;
  expiresAt: string | null;
  archivedAt: string | null;
  driveFileId: string | null;
  driveFolderId: string | null;
  createdAt: string;
  kiteDesign: {
    id: string;
    title: string | null;
  } | null;
}

interface StorageStats {
  totalFiles: number;
  totalSize: number;
  tempFiles: number;
  permanentFiles: number;
  driveFiles: number;
}

export default function StorageFilesPage() {
  const [files, setFiles] = useState<StorageFile[]>([]);
  const [stats, setStats] = useState<StorageStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStorageData();
  }, []);

  const fetchStorageData = async () => {
    try {
      setLoading(true);
      const [filesRes, statsRes] = await Promise.all([
        fetch('/api/admin/storage/files'),
        fetch('/api/admin/storage/stats'),
      ]);
      
      if (!filesRes.ok || !statsRes.ok) {
        throw new Error('Failed to fetch storage data');
      }
      
      const filesData = await filesRes.json();
      const statsData = await statsRes.json();
      
      setFiles(filesData);
      setStats(statsData);
    } catch (error) {
      console.error('Error fetching storage:', error);
      toast.error('Gagal memuat data storage');
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return <ImageIcon className="h-4 w-4" />;
    return <File className="h-4 w-4" />;
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Storage Files</h1>
          <p className="text-sm text-muted-foreground">
            Manage uploaded images & Google Drive files
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchStorageData}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Files</CardTitle>
              <DatabaseIcon className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalFiles}</div>
              <p className="text-xs text-muted-foreground">
                {formatFileSize(stats.totalSize)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Temporary</CardTitle>
              <FileArchive className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.tempFiles}</div>
              <p className="text-xs text-muted-foreground">
                Will expire in 7 days
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Permanent</CardTitle>
              <HardDrive className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.permanentFiles}</div>
              <p className="text-xs text-muted-foreground">
                Stored permanently
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Google Drive</CardTitle>
              <FileArchive className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.driveFiles}</div>
              <p className="text-xs text-muted-foreground">
                Files in Google Drive
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Files Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Files</CardTitle>
          <CardDescription>
            List of all storage files
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>File</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Storage</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Design</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {files.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    No files found
                  </TableCell>
                </TableRow>
              ) : (
                files.map((file) => (
                  <TableRow key={file.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getFileIcon(file.mimeType)}
                        <span className="font-medium truncate max-w-[150px]">
                          {file.fileName}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {file.mimeType.split('/')[1] || 'file'}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatFileSize(file.fileSize)}</TableCell>
                    <TableCell>
                      <Badge variant={file.storageType === 'temporary' ? 'secondary' : 'default'}>
                        {file.storageType}
                      </Badge>
                      {file.driveFileId && (
                        <Badge variant="outline" className="ml-1">
                          Drive
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {file.source}
                      </span>
                    </TableCell>
                    <TableCell>
                      {file.kiteDesign ? (
                        <span className="text-sm">
                          {file.kiteDesign.title || 'Untitled Design'}
                        </span>
                      ) : (
                        <span className="text-sm text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(file.createdAt), {
                        addSuffix: true,
                        locale: id,
                      })}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-500 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}