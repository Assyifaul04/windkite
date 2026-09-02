// app/admin/designs/page.tsx
'use client';

import { useState, useEffect } from 'react';
import {
  Image as ImageIcon,
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  Clock,
  XCircle,
  Loader2,
  Upload,
  Grid3x3,
  List,
  RefreshCw,
  MoreVertical,
  ExternalLink,
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { format, formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';
import Image from 'next/image';
import Link from 'next/link';

interface KiteDesign {
  id: string;
  title: string | null;
  description: string | null;
  coverImageUrl: string;
  thumbnailUrl: string | null;
  finalImageUrl: string | null;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  isPublic: boolean;
  positionX: number | null;
  positionY: number | null;
  scale: number | null;
  rotation: number | null;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
  };
  frame: {
    id: string;
    name: string;
    imageUrl: string;
  };
  storageFile: {
    id: string;
    fileName: string;
    fileUrl: string;
    fileSize: number;
    mimeType: string;
  } | null;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const statusConfig = {
  PENDING: { label: 'Pending', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' },
  PROCESSING: { label: 'Processing', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
  COMPLETED: { label: 'Completed', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' },
  FAILED: { label: 'Failed', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' },
};

export default function DesignsPage() {
  const [designs, setDesigns] = useState<KiteDesign[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [selectedDesign, setSelectedDesign] = useState<KiteDesign | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    fetchDesigns();
  }, [search, statusFilter, pagination.page]);

  const fetchDesigns = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        search,
        status: statusFilter,
      });
      
      const response = await fetch(`/api/admin/designs?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch designs');
      }
      
      const data = await response.json();
      setDesigns(data.designs);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Error fetching designs:', error);
      toast.error('Gagal memuat data desain');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/designs/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete design');
      }
      
      toast.success('Desain berhasil dihapus');
      setIsDeleteDialogOpen(false);
      fetchDesigns();
    } catch (error) {
      console.error('Error deleting design:', error);
      toast.error('Gagal menghapus desain');
    }
  };

  const handleStatusUpdate = async (id: string, status: string) => {
    try {
      const response = await fetch(`/api/admin/designs/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update status');
      }
      
      toast.success(`Status desain diubah menjadi ${statusConfig[status as keyof typeof statusConfig].label}`);
      fetchDesigns();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Gagal mengubah status desain');
    }
  };

  const handleTogglePublic = async (id: string, isPublic: boolean) => {
    try {
      const response = await fetch(`/api/admin/designs/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublic: !isPublic }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update visibility');
      }
      
      toast.success(`Desain ${!isPublic ? 'dipublikasikan' : 'di-privatkan'}`);
      fetchDesigns();
    } catch (error) {
      console.error('Error updating visibility:', error);
      toast.error('Gagal mengubah visibilitas desain');
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !selectedDesign) return;

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('designId', selectedDesign.id);

    try {
      const response = await fetch('/api/admin/designs/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      toast.success('File berhasil diupload');
      setIsUploadDialogOpen(false);
      setSelectedFile(null);
      fetchDesigns();
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Gagal upload file');
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Kite Designs</h1>
          <p className="text-sm text-muted-foreground">
            Manage all kite designs with cover images
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/designs/frames/editor">
            <Plus className="mr-2 h-4 w-4" />
            New Design
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search designs..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="PROCESSING">Processing</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
                <SelectItem value="FAILED">Failed</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex gap-2">
              <Button
                variant={viewMode === 'table' ? 'default' : 'outline'}
                size="icon"
                onClick={() => setViewMode('table')}
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="icon"
                onClick={() => setViewMode('grid')}
              >
                <Grid3x3 className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={fetchDesigns}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="animate-pulse">
              <div className="h-48 bg-slate-200 dark:bg-slate-800 rounded-t-lg" />
              <CardContent className="p-4">
                <div className="h-4 w-32 bg-slate-200 dark:bg-slate-800 rounded mb-2" />
                <div className="h-4 w-24 bg-slate-200 dark:bg-slate-800 rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : viewMode === 'table' ? (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Design</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Frame</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Visibility</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {designs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No designs found
                    </TableCell>
                  </TableRow>
                ) : (
                  designs.map((design) => (
                    <TableRow key={design.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800">
                            <Image
                              src={design.thumbnailUrl || design.coverImageUrl}
                              alt={design.title || 'Design'}
                              fill
                              className="object-cover"
                            />
                          </div>
                          <div>
                            <p className="font-medium">{design.title || 'Untitled'}</p>
                            <p className="text-sm text-muted-foreground truncate max-w-[200px]">
                              {design.description || 'No description'}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={design.user.image || ''} />
                            <AvatarFallback>
                              {design.user.name?.charAt(0).toUpperCase() || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm">{design.user.name || 'Unknown'}</span>
                        </div>
                      </TableCell>
                      <TableCell>{design.frame.name}</TableCell>
                      <TableCell>
                        <Badge className={statusConfig[design.status].color}>
                          {statusConfig[design.status].label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={design.isPublic ? 'default' : 'secondary'}>
                          {design.isPublic ? 'Public' : 'Private'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(design.createdAt), {
                          addSuffix: true,
                          locale: id,
                        })}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => {
                              setSelectedDesign(design);
                              setIsDetailDialogOpen(true);
                            }}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => {
                              setSelectedDesign(design);
                              setIsEditDialogOpen(true);
                            }}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit Design
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => {
                              setSelectedDesign(design);
                              setIsUploadDialogOpen(true);
                            }}>
                              <Upload className="mr-2 h-4 w-4" />
                              Upload File
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleTogglePublic(design.id, design.isPublic)}
                            >
                              {design.isPublic ? 'Make Private' : 'Make Public'}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={() => {
                                setSelectedDesign(design);
                                setIsDeleteDialogOpen(true);
                              }}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {designs.map((design) => (
            <Card key={design.id} className="overflow-hidden">
              <div className="relative h-48 bg-slate-100 dark:bg-slate-800">
                <Image
                  src={design.thumbnailUrl || design.coverImageUrl}
                  alt={design.title || 'Design'}
                  fill
                  className="object-cover"
                />
                <div className="absolute top-2 right-2 flex gap-1">
                  <Badge className={statusConfig[design.status].color}>
                    {statusConfig[design.status].label}
                  </Badge>
                </div>
                <div className="absolute bottom-2 left-2">
                  <Badge variant={design.isPublic ? 'default' : 'secondary'}>
                    {design.isPublic ? 'Public' : 'Private'}
                  </Badge>
                </div>
              </div>
              <CardContent className="p-4">
                <h3 className="font-medium truncate">{design.title || 'Untitled'}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <Avatar className="h-5 w-5">
                    <AvatarImage src={design.user.image || ''} />
                    <AvatarFallback>
                      {design.user.name?.charAt(0).toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-xs text-muted-foreground">
                    {design.user.name || 'Unknown'} • {design.frame.name}
                  </span>
                </div>
                <div className="flex gap-2 mt-3">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => {
                      setSelectedDesign(design);
                      setIsDetailDialogOpen(true);
                    }}
                  >
                    <Eye className="mr-1 h-3 w-3" />
                    View
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => {
                      setSelectedDesign(design);
                      setIsEditDialogOpen(true);
                    }}
                  >
                    <Edit className="mr-1 h-3 w-3" />
                    Edit
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {designs.length} of {pagination.total} designs
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
              disabled={pagination.page <= 1}
            >
              Previous
            </Button>
            <span className="flex items-center px-4 text-sm">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
              disabled={pagination.page >= pagination.totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Delete Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Design</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this design? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => selectedDesign && handleDelete(selectedDesign.id)}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Design</DialogTitle>
            <DialogDescription>
              Update design information and settings
            </DialogDescription>
          </DialogHeader>
          {selectedDesign && (
            <form className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input id="title" defaultValue={selectedDesign.title || ''} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" defaultValue={selectedDesign.description || ''} />
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="isPublic" defaultChecked={selectedDesign.isPublic} />
                <Label htmlFor="isPublic">Make this design public</Label>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Save Changes</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {selectedDesign && (
            <>
              <DialogHeader>
                <DialogTitle>Design Details</DialogTitle>
                <DialogDescription>
                  {selectedDesign.title || 'Untitled Design'}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="relative h-64 bg-slate-100 dark:bg-slate-800 rounded-lg overflow-hidden">
                  <Image
                    src={selectedDesign.coverImageUrl}
                    alt={selectedDesign.title || 'Design'}
                    fill
                    className="object-contain"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm text-muted-foreground">Status</Label>
                    <Badge className={statusConfig[selectedDesign.status].color}>
                      {statusConfig[selectedDesign.status].label}
                    </Badge>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Visibility</Label>
                    <Badge variant={selectedDesign.isPublic ? 'default' : 'secondary'}>
                      {selectedDesign.isPublic ? 'Public' : 'Private'}
                    </Badge>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Frame</Label>
                    <p className="font-medium">{selectedDesign.frame.name}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">User</Label>
                    <p className="font-medium">{selectedDesign.user.name || 'Unknown'}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Created</Label>
                    <p>{format(new Date(selectedDesign.createdAt), 'PPP', { locale: id })}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Transform</Label>
                    <p className="text-sm">
                      X: {selectedDesign.positionX || 0} • Y: {selectedDesign.positionY || 0} • Scale: {selectedDesign.scale || 1} • Rotation: {selectedDesign.rotation || 0}°
                    </p>
                  </div>
                </div>
                {selectedDesign.storageFile && (
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                    <Label className="text-sm text-muted-foreground">Storage File</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="font-medium">{selectedDesign.storageFile.fileName}</span>
                      <span className="text-sm text-muted-foreground">
                        ({(selectedDesign.storageFile.fileSize / 1024).toFixed(2)} KB)
                      </span>
                      <Button variant="link" size="sm" asChild>
                        <a href={selectedDesign.storageFile.fileUrl} target="_blank">
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Upload Dialog */}
      <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload File</DialogTitle>
            <DialogDescription>
              Upload image file for this design
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="border-2 border-dashed rounded-lg p-8 text-center">
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                className="cursor-pointer"
              />
              {selectedFile && (
                <p className="mt-2 text-sm text-muted-foreground">
                  {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsUploadDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpload} disabled={!selectedFile}>
              Upload
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}