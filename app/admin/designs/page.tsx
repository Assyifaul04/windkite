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
  FrameIcon,
  ImageOff,
  AlertCircle,
  Check,
  X,
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
  PENDING: { 
    label: 'Pending', 
    color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
    icon: Clock
  },
  PROCESSING: { 
    label: 'Processing', 
    color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    icon: Loader2
  },
  COMPLETED: { 
    label: 'Completed', 
    color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
    icon: CheckCircle
  },
  FAILED: { 
    label: 'Failed', 
    color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
    icon: XCircle
  },
};

// Helper function to get status icon component
const getStatusIcon = (status: string) => {
  const config = statusConfig[status as keyof typeof statusConfig];
  if (!config) return null;
  const Icon = config.icon;
  return Icon ? <Icon className="h-3 w-3 mr-1" /> : null;
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
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

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
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch designs');
      }
      
      const data = await response.json();
      setDesigns(data.designs);
      setPagination(data.pagination);
      setImageErrors({});
    } catch (error) {
      console.error('Error fetching designs:', error);
      toast.error('Gagal memuat data desain');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      setIsDeleting(true);
      const response = await fetch(`/api/admin/designs/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete design');
      }
      
      toast.success('Desain berhasil dihapus');
      setIsDeleteDialogOpen(false);
      setSelectedDesign(null);
      fetchDesigns();
    } catch (error) {
      console.error('Error deleting design:', error);
      toast.error(error instanceof Error ? error.message : 'Gagal menghapus desain');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleStatusUpdate = async (id: string, status: string) => {
    try {
      setIsUpdating(true);
      const response = await fetch(`/api/admin/designs/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update status');
      }
      
      toast.success(`Status desain diubah menjadi ${statusConfig[status as keyof typeof statusConfig].label}`);
      fetchDesigns();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error(error instanceof Error ? error.message : 'Gagal mengubah status desain');
    } finally {
      setIsUpdating(false);
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
        const error = await response.json();
        throw new Error(error.error || 'Failed to update visibility');
      }
      
      toast.success(`Desain ${!isPublic ? 'dipublikasikan' : 'di-privatkan'}`);
      fetchDesigns();
    } catch (error) {
      console.error('Error updating visibility:', error);
      toast.error(error instanceof Error ? error.message : 'Gagal mengubah visibilitas desain');
    }
  };

  const handleViewDetail = async (design: KiteDesign) => {
    try {
      const response = await fetch(`/api/admin/designs/${design.id}`);
      if (!response.ok) throw new Error('Failed to fetch design detail');
      const data = await response.json();
      setSelectedDesign(data);
      setIsDetailDialogOpen(true);
    } catch (error) {
      console.error('Error fetching design detail:', error);
      toast.error('Gagal memuat detail desain');
    }
  };

  const handleImageError = (designId: string) => {
    setImageErrors(prev => ({ ...prev, [designId]: true }));
  };

  // Fixed: Properly typed handleStatusFilterChange
  const handleStatusFilterChange = (value: string | null) => {
    setStatusFilter(value || 'all');
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="h-8 w-48 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
            <div className="h-4 w-64 bg-slate-200 dark:bg-slate-800 rounded mt-1 animate-pulse" />
          </div>
          <div className="h-10 w-32 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
        </div>
        <div className="h-[60px] bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
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
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Kite Designs</h1>
          <p className="text-sm text-muted-foreground">
            Manage all kite designs with cover images
          </p>
        </div>
        <Link href="/admin/designs/frames/editor">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Design
          </Button>
        </Link>
      </div>

      {/* Filters - Fixed Select onChange */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search designs..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-9 text-sm"
              />
            </div>
            
            <Select 
              value={statusFilter} 
              onValueChange={handleStatusFilterChange}
            >
              <SelectTrigger className="w-[180px] h-9 text-sm">
                <Filter className="mr-2 h-4 w-4" />
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
                className="h-9 w-9"
                onClick={() => setViewMode('table')}
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="icon"
                className="h-9 w-9"
                onClick={() => setViewMode('grid')}
              >
                <Grid3x3 className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" className="h-9 w-9" onClick={fetchDesigns}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Content - Without asChild */}
      {viewMode === 'table' ? (
        <Card>
          <CardContent className="p-0 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Design</TableHead>
                  <TableHead className="text-xs">User</TableHead>
                  <TableHead className="text-xs">Frame</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-xs">Visibility</TableHead>
                  <TableHead className="text-xs">Created</TableHead>
                  <TableHead className="text-xs text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {designs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                      <div className="flex flex-col items-center gap-3">
                        <ImageIcon className="h-12 w-12 text-muted-foreground/50" />
                        <p className="font-medium">No designs found</p>
                        <p className="text-sm">Create a new design to get started</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  designs.map((design) => {
                    const hasImageError = imageErrors[design.id];
                    const imageSrc = design.thumbnailUrl || design.coverImageUrl;
                    const statusLabel = statusConfig[design.status]?.label || design.status;
                    const statusColor = statusConfig[design.status]?.color || 'bg-gray-100 text-gray-700';
                    
                    return (
                      <TableRow key={design.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800 flex-shrink-0 border border-slate-200 dark:border-slate-700">
                              {imageSrc && !hasImageError ? (
                                <Image
                                  src={imageSrc}
                                  alt={design.title || 'Design'}
                                  fill
                                  className="object-cover"
                                  onError={() => handleImageError(design.id)}
                                  unoptimized={imageSrc.startsWith('data:')}
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <ImageOff className="h-5 w-5 text-slate-400" />
                                </div>
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-sm truncate max-w-[150px]">
                                {design.title || 'Untitled'}
                              </p>
                              <p className="text-xs text-muted-foreground truncate max-w-[150px]">
                                {design.description || 'No description'}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={design.user.image || ''} />
                              <AvatarFallback className="text-[10px]">
                                {design.user.name?.charAt(0).toUpperCase() || 'U'}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm truncate max-w-[80px]">
                              {design.user.name || 'Unknown'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">{design.frame.name}</span>
                        </TableCell>
                        <TableCell>
                          <Badge className={statusColor}>
                            {getStatusIcon(design.status)}
                            {statusLabel}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={design.isPublic ? 'default' : 'secondary'}>
                            {design.isPublic ? 'Public' : 'Private'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                          {formatDistanceToNow(new Date(design.createdAt), {
                            addSuffix: true,
                            locale: id,
                          })}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-52">
                              <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                                Actions
                              </div>
                              
                              <DropdownMenuItem onClick={() => handleViewDetail(design)}>
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
                              
                              <div className="h-px bg-border my-1" />
                              
                              <div className="px-2 py-1 text-xs font-semibold text-muted-foreground">
                                Change Status
                              </div>
                              {Object.entries(statusConfig).map(([key, config]) => (
                                design.status !== key && (
                                  <DropdownMenuItem 
                                    key={key} 
                                    onClick={() => handleStatusUpdate(design.id, key)}
                                    disabled={isUpdating}
                                  >
                                    <div className={`w-2 h-2 rounded-full mr-2 ${
                                      key === 'PENDING' ? 'bg-yellow-500' :
                                      key === 'PROCESSING' ? 'bg-blue-500' :
                                      key === 'COMPLETED' ? 'bg-green-500' :
                                      'bg-red-500'
                                    }`} />
                                    Set {config.label}
                                  </DropdownMenuItem>
                                )
                              ))}
                              
                              <div className="h-px bg-border my-1" />
                              
                              <DropdownMenuItem onClick={() => handleTogglePublic(design.id, design.isPublic)}>
                                {design.isPublic ? 'Make Private' : 'Make Public'}
                              </DropdownMenuItem>
                              
                              <div className="h-px bg-border my-1" />
                              
                              <DropdownMenuItem
                                className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
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
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {designs.map((design) => {
            const hasImageError = imageErrors[design.id];
            const imageSrc = design.thumbnailUrl || design.coverImageUrl;
            const statusLabel = statusConfig[design.status]?.label || design.status;
            const statusColor = statusConfig[design.status]?.color || 'bg-gray-100 text-gray-700';
            
            return (
              <Card key={design.id} className="overflow-hidden hover:shadow-lg transition-shadow duration-200">
                <div className="relative h-48 bg-slate-100 dark:bg-slate-800">
                  {imageSrc && !hasImageError ? (
                    <Image
                      src={imageSrc}
                      alt={design.title || 'Design'}
                      fill
                      className="object-cover hover:scale-105 transition-transform duration-300"
                      onError={() => handleImageError(design.id)}
                      unoptimized={imageSrc.startsWith('data:')}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageOff className="h-10 w-10 text-slate-400" />
                    </div>
                  )}
                  <div className="absolute top-2 right-2">
                    <Badge className={statusColor}>
                      {getStatusIcon(design.status)}
                      {statusLabel}
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
                      <AvatarFallback className="text-[10px]">
                        {design.user.name?.charAt(0).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-xs text-muted-foreground truncate">
                      {design.user.name || 'Unknown'} • {design.frame.name}
                    </span>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 h-8 text-xs"
                      onClick={() => handleViewDetail(design)}
                    >
                      <Eye className="mr-1 h-3 w-3" />
                      View
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 h-8 text-xs"
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
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            Showing {designs.length} of {pagination.total} designs
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs"
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
              disabled={pagination.page <= 1}
            >
              Previous
            </Button>
            <span className="text-sm px-3">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs"
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
            <DialogTitle className="text-red-600">Delete Design</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete the design
              and remove it from all references.
            </DialogDescription>
          </DialogHeader>
          {selectedDesign && (
            <div className="py-4">
              <div className="p-3 bg-red-50 dark:bg-red-950/20 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800 flex-shrink-0">
                    {selectedDesign.coverImageUrl ? (
                      <Image
                        src={selectedDesign.coverImageUrl}
                        alt={selectedDesign.title || 'Design'}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <ImageIcon className="h-5 w-5 text-slate-400 m-3" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium">{selectedDesign.title || 'Untitled Design'}</p>
                    <p className="text-sm text-muted-foreground">
                      Using frame: {selectedDesign.frame.name}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => selectedDesign && handleDelete(selectedDesign.id)}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </>
              )}
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
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-title">Title</Label>
                <Input 
                  id="edit-title" 
                  defaultValue={selectedDesign.title || ''} 
                  placeholder="Enter design title"
                  className="text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea 
                  id="edit-description" 
                  defaultValue={selectedDesign.description || ''} 
                  placeholder="Enter description"
                  rows={3}
                  className="text-sm"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="edit-public" defaultChecked={selectedDesign.isPublic} />
                <Label htmlFor="edit-public" className="text-sm">Make this design public</Label>
              </div>
              <DialogFooter className="gap-2">
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Save Changes</Button>
              </DialogFooter>
            </div>
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
              <div className="space-y-4 py-4">
                <div className="relative h-64 bg-slate-100 dark:bg-slate-800 rounded-lg overflow-hidden">
                  {selectedDesign.coverImageUrl ? (
                    <Image
                      src={selectedDesign.coverImageUrl}
                      alt={selectedDesign.title || 'Design'}
                      fill
                      className="object-contain"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon className="h-12 w-12 text-slate-400" />
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm text-muted-foreground">Status</Label>
                    <div className="mt-1">
                      <Badge className={statusConfig[selectedDesign.status]?.color || 'bg-gray-100'}>
                        {getStatusIcon(selectedDesign.status)}
                        {statusConfig[selectedDesign.status]?.label || selectedDesign.status}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Visibility</Label>
                    <div className="mt-1">
                      <Badge variant={selectedDesign.isPublic ? 'default' : 'secondary'}>
                        {selectedDesign.isPublic ? 'Public' : 'Private'}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Frame</Label>
                    <p className="font-medium">{selectedDesign.frame.name}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">User</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={selectedDesign.user.image || ''} />
                        <AvatarFallback className="text-xs">
                          {selectedDesign.user.name?.charAt(0).toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{selectedDesign.user.name || 'Unknown'}</span>
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Created</Label>
                    <p className="font-medium">
                      {format(new Date(selectedDesign.createdAt), 'PPP', { locale: id })}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Transform</Label>
                    <p className="text-sm">
                      X: {selectedDesign.positionX || 0} • Y: {selectedDesign.positionY || 0} • Scale: {selectedDesign.scale || 1} • Rotation: {selectedDesign.rotation || 0}°
                    </p>
                  </div>
                </div>
                {selectedDesign.storageFile && (
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
                    <Label className="text-sm text-muted-foreground">Storage File</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="font-medium">{selectedDesign.storageFile.fileName}</span>
                      <span className="text-sm text-muted-foreground">
                        ({(selectedDesign.storageFile.fileSize / 1024).toFixed(2)} KB)
                      </span>
                      <Button variant="link" size="sm" className="h-6 p-0" onClick={() => window.open(selectedDesign.storageFile?.fileUrl, '_blank')}>
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDetailDialogOpen(false)}>
                  Close
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}