// app/admin/system/cron/page.tsx
'use client';

import { useState, useEffect } from 'react';
import {
  Clock,
  CheckCircle,
  RefreshCw,
  Play,
  Pause,
  Trash2,
  Plus,
  Edit,
  Timer,
  Zap,
  Activity,
  MoreVertical,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import {
  Card,
  CardContent,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';
import { Textarea } from '@/components/ui/textarea';

interface CronJob {
  id: string;
  name: string;
  description: string | null;
  schedule: string;
  command: string;
  status: 'active' | 'inactive' | 'running' | 'failed';
  lastRun: string | null;
  nextRun: string;
  runs: number;
  successfulRuns: number;
  failedRuns: number;
  createdAt: string;
  updatedAt: string;
}

const COMMAND_OPTIONS = [
  { value: 'update-weather', label: 'Update Cuaca' },
  { value: 'clean-sessions', label: 'Clean Sessions' },
  { value: 'generate-reports', label: 'Generate Reports' },
  { value: 'backup-database', label: 'Backup Database' },
];

const SCHEDULE_OPTIONS = [
  { label: 'Setiap 6 jam', value: '0 */6 * * *' },
  { label: 'Setiap hari jam 00:00', value: '0 0 * * *' },
  { label: 'Setiap hari jam 01:00', value: '0 1 * * *' },
  { label: 'Setiap jam', value: '0 * * * *' },
  { label: 'Setiap 30 menit', value: '*/30 * * * *' },
  { label: 'Setiap Minggu', value: '0 0 * * 0' },
];

export default function CronJobsPage() {
  const [jobs, setJobs] = useState<CronJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isRunningJob, setIsRunningJob] = useState<string | null>(null);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');
  const [selectedJob, setSelectedJob] = useState<CronJob | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    schedule: '0 */6 * * *',
    command: 'update-weather',
    status: 'active',
  });

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/system/cron');
      
      if (!response.ok) {
        throw new Error('Failed to fetch cron jobs');
      }
      
      const data = await response.json();
      setJobs(data);
    } catch (error) {
      console.error('Error fetching cron jobs:', error);
      toast.error('Gagal memuat data cron jobs');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const url = dialogMode === 'create' 
        ? '/api/admin/system/cron' 
        : `/api/admin/system/cron/${selectedJob?.id}`;
      
      const method = dialogMode === 'create' ? 'POST' : 'PATCH';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success(dialogMode === 'create' ? 'Cron job berhasil ditambahkan' : 'Cron job berhasil diupdate');
        fetchJobs();
        setIsDialogOpen(false);
        resetForm();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Gagal menyimpan cron job');
      }
    } catch (error) {
      console.error('Error saving cron job:', error);
      toast.error('Terjadi kesalahan');
    }
  };

  const handleDelete = async () => {
    if (!selectedJob) return;
    
    try {
      const response = await fetch(`/api/admin/system/cron/${selectedJob.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Cron job berhasil dihapus');
        fetchJobs();
        setIsDeleteDialogOpen(false);
        setSelectedJob(null);
      } else {
        const error = await response.json();
        toast.error(error.error || 'Gagal menghapus cron job');
      }
    } catch (error) {
      console.error('Error deleting cron job:', error);
      toast.error('Terjadi kesalahan');
    }
  };

  const handleToggleStatus = async (job: CronJob) => {
    try {
      const newStatus = job.status === 'active' ? 'inactive' : 'active';
      const response = await fetch(`/api/admin/system/cron/${job.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        toast.success(`Cron job ${newStatus === 'active' ? 'diaktifkan' : 'dinonaktifkan'}`);
        fetchJobs();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Gagal mengubah status cron job');
      }
    } catch (error) {
      console.error('Error toggling cron job:', error);
      toast.error('Terjadi kesalahan');
    }
  };

  const handleRunNow = async (job: CronJob) => {
    if (isRunningJob) return;
    
    try {
      setIsRunningJob(job.id);
      const response = await fetch(`/api/admin/system/cron/${job.id}/run`, {
        method: 'POST',
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success(data.message || 'Cron job berhasil dijalankan');
        fetchJobs();
      } else {
        toast.error(data.message || data.error || 'Gagal menjalankan cron job');
      }
    } catch (error) {
      console.error('Error running cron job:', error);
      toast.error('Terjadi kesalahan saat menjalankan cron job');
    } finally {
      setIsRunningJob(null);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      schedule: '0 */6 * * *',
      command: 'update-weather',
      status: 'active',
    });
    setSelectedJob(null);
  };

  const openEditDialog = (job: CronJob) => {
    setSelectedJob(job);
    setFormData({
      name: job.name,
      description: job.description || '',
      schedule: job.schedule,
      command: job.command,
      status: job.status,
    });
    setDialogMode('edit');
    setIsDialogOpen(true);
  };

  const openCreateDialog = () => {
    resetForm();
    setDialogMode('create');
    setIsDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      active: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
      inactive: 'bg-gray-100 text-gray-700 dark:bg-gray-800/50 dark:text-gray-300',
      running: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
      failed: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
    };
    const labels: Record<string, string> = {
      active: 'Aktif',
      inactive: 'Nonaktif',
      running: 'Berjalan',
      failed: 'Gagal',
    };
    return <Badge className={styles[status]}>{labels[status]}</Badge>;
  };

  const getCommandLabel = (command: string) => {
    const found = COMMAND_OPTIONS.find(c => c.value === command);
    return found ? found.label : command;
  };

  // ============================================
  // PERBAIKAN: Handler untuk Select dengan type string | null
  // ============================================
  const handleScheduleChange = (value: string | null) => {
    setFormData({ ...formData, schedule: value || '0 */6 * * *' });
  };

  const handleCommandChange = (value: string | null) => {
    setFormData({ ...formData, command: value || 'update-weather' });
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-slate-200 dark:bg-slate-800 animate-pulse rounded-lg" />
          ))}
        </div>
        <div className="h-[400px] bg-slate-200 dark:bg-slate-800 animate-pulse rounded-lg" />
      </div>
    );
  }

  const activeJobs = jobs.filter(j => j.status === 'active').length;
  const totalRuns = jobs.reduce((acc, j) => acc + j.runs, 0);
  const successRate = jobs.length > 0 && totalRuns > 0
    ? Math.round((jobs.reduce((acc, j) => acc + j.successfulRuns, 0) / totalRuns) * 100)
    : 0;

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Cron Jobs</h1>
          <p className="text-sm text-muted-foreground">
            Kelola tugas terjadwal dan update data otomatis
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchJobs}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button size="sm" onClick={openCreateDialog}>
            <Plus className="mr-2 h-4 w-4" />
            Tambah Cron Job
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-xs font-medium text-muted-foreground">Total Jobs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-sky-500" />
              <span className="text-xl font-bold">{jobs.length}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-xs font-medium text-muted-foreground">Active</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-xl font-bold">{activeJobs}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-xs font-medium text-muted-foreground">Total Runs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-blue-500" />
              <span className="text-xl font-bold">{totalRuns.toLocaleString()}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-xs font-medium text-muted-foreground">Success Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-emerald-500" />
              <span className="text-xl font-bold">{successRate}%</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Jobs Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs">Nama</TableHead>
              <TableHead className="text-xs">Deskripsi</TableHead>
              <TableHead className="text-xs">Schedule</TableHead>
              <TableHead className="text-xs">Command</TableHead>
              <TableHead className="text-xs">Status</TableHead>
              <TableHead className="text-xs">Last Run</TableHead>
              <TableHead className="text-xs text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {jobs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  <div className="flex flex-col items-center gap-2">
                    <Timer className="h-12 w-12 text-muted-foreground/50" />
                    <p>Belum ada cron job</p>
                    <p className="text-sm">Klik "Tambah Cron Job" untuk membuat tugas terjadwal</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              jobs.map((job) => (
                <TableRow key={job.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Timer className={`h-4 w-4 ${
                        job.status === 'active' ? 'text-green-500' : 
                        job.status === 'failed' ? 'text-red-500' : 
                        'text-sky-500'
                      }`} />
                      <span className="font-medium">{job.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground truncate max-w-[150px]">
                    {job.description || '-'}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="font-mono text-[10px]">
                      {job.schedule}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-[10px]">
                      {getCommandLabel(job.command)}
                    </Badge>
                  </TableCell>
                  <TableCell>{getStatusBadge(job.status)}</TableCell>
                  <TableCell className="text-sm">
                    {job.lastRun ? (
                      formatDistanceToNow(new Date(job.lastRun), { addSuffix: true, locale: id })
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger>
                        <Button 
                          variant="ghost" 
                          className="h-8 w-8 p-0" 
                          type="button"
                        >
                          <MoreVertical className="h-4 w-4" />
                          <span className="sr-only">Open menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-52">
                        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                          Aksi
                        </div>
                        <DropdownMenuItem onClick={() => handleRunNow(job)} disabled={isRunningJob === job.id}>
                          {isRunningJob === job.id ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Menjalankan...
                            </>
                          ) : (
                            <>
                              <Play className="mr-2 h-4 w-4" />
                              Jalankan Sekarang
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleToggleStatus(job)}>
                          {job.status === 'active' ? (
                            <>
                              <Pause className="mr-2 h-4 w-4" />
                              Nonaktifkan
                            </>
                          ) : (
                            <>
                              <Play className="mr-2 h-4 w-4" />
                              Aktifkan
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openEditDialog(job)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <div className="h-px bg-border my-1" />
                        <DropdownMenuItem 
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                          onClick={() => {
                            setSelectedJob(job);
                            setIsDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Hapus
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {dialogMode === 'create' ? 'Tambah Cron Job' : 'Edit Cron Job'}
            </DialogTitle>
            <DialogDescription>
              {dialogMode === 'create' 
                ? 'Tambahkan tugas terjadwal baru' 
                : 'Edit informasi cron job'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nama *</Label>
                <Input
                  id="name"
                  placeholder="Contoh: Update Cuaca Otomatis"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Deskripsi</Label>
                <Textarea
                  id="description"
                  placeholder="Deskripsi tugas terjadwal"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="command">Command *</Label>
                <Select 
                  value={formData.command} 
                  onValueChange={handleCommandChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih command" />
                  </SelectTrigger>
                  <SelectContent>
                    {COMMAND_OPTIONS.map((cmd) => (
                      <SelectItem key={cmd.value} value={cmd.value}>
                        {cmd.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Pilih jenis tugas yang akan dijalankan
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="schedule">Schedule *</Label>
                <Select 
                  value={formData.schedule} 
                  onValueChange={handleScheduleChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih schedule" />
                  </SelectTrigger>
                  <SelectContent>
                    {SCHEDULE_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label} ({opt.value})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Format: minute hour day month dayOfWeek
                </p>
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="status">Status</Label>
                  <p className="text-sm text-muted-foreground">
                    Aktifkan atau nonaktifkan cron job
                  </p>
                </div>
                <Switch
                  id="status"
                  checked={formData.status === 'active'}
                  onCheckedChange={(checked) => 
                    setFormData({ ...formData, status: checked ? 'active' : 'inactive' })
                  }
                />
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button variant="outline" type="button" onClick={() => setIsDialogOpen(false)}>
                Batal
              </Button>
              <Button type="submit">
                {dialogMode === 'create' ? 'Tambah' : 'Simpan'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-600">Hapus Cron Job</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus cron job ini? Tindakan ini tidak dapat dibatalkan.
            </DialogDescription>
          </DialogHeader>
          {selectedJob && (
            <div className="py-4">
              <div className="p-3 bg-red-50 dark:bg-red-950/20 rounded-lg">
                <div className="flex items-center gap-3">
                  <Timer className="h-5 w-5 text-red-500" />
                  <div className="min-w-0">
                    <p className="font-medium truncate">{selectedJob.name}</p>
                    <p className="text-sm text-muted-foreground truncate">
                      {selectedJob.description || 'Tidak ada deskripsi'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Schedule: {selectedJob.schedule}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Batal
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              <Trash2 className="mr-2 h-4 w-4" />
              Hapus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}