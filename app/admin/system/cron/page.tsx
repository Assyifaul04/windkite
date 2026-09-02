// app/admin/system/cron/page.tsx
'use client';

import { useState, useEffect } from 'react';
import {
  Clock,
  Calendar,
  CheckCircle,
  XCircle,
  RefreshCw,
  Play,
  Pause,
  Trash2,
  Plus,
  Edit,
  AlertCircle,
  Clock as ClockIcon,
  Timer,
  Zap,
  Database,
  Cloud,
  Activity,
  MoreVertical,
  Download,
  Upload
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
  DropdownMenuLabel,
  DropdownMenuSeparator,
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
import { format, formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';

interface CronJob {
  id: string;
  name: string;
  description: string;
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

export default function CronJobsPage() {
  const [jobs, setJobs] = useState<CronJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');
  const [selectedJob, setSelectedJob] = useState<CronJob | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    schedule: '0 */6 * * *',
    command: '',
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
      } else {
        toast.error('Gagal menghapus cron job');
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
        toast.error('Gagal mengubah status cron job');
      }
    } catch (error) {
      console.error('Error toggling cron job:', error);
      toast.error('Terjadi kesalahan');
    }
  };

  const handleRunNow = async (job: CronJob) => {
    try {
      const response = await fetch(`/api/admin/system/cron/${job.id}/run`, {
        method: 'POST',
      });

      if (response.ok) {
        toast.success('Cron job dijalankan');
        fetchJobs();
      } else {
        toast.error('Gagal menjalankan cron job');
      }
    } catch (error) {
      console.error('Error running cron job:', error);
      toast.error('Terjadi kesalahan');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      schedule: '0 */6 * * *',
      command: '',
      status: 'active',
    });
    setSelectedJob(null);
  };

  const openEditDialog = (job: CronJob) => {
    setSelectedJob(job);
    setFormData({
      name: job.name,
      description: job.description,
      schedule: job.schedule,
      command: job.command,
      status: job.status,
    });
    setDialogMode('edit');
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

  const scheduleExamples = [
    { label: 'Setiap 6 jam', value: '0 */6 * * *' },
    { label: 'Setiap hari jam 00:00', value: '0 0 * * *' },
    { label: 'Setiap jam', value: '0 * * * *' },
    { label: 'Setiap 30 menit', value: '*/30 * * * *' },
    { label: 'Setiap Minggu', value: '0 0 * * 0' },
  ];

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="h-10 w-48 bg-slate-200 dark:bg-slate-800 animate-pulse rounded" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-slate-200 dark:bg-slate-800 animate-pulse rounded-lg" />
          ))}
        </div>
        <div className="h-[400px] bg-slate-200 dark:bg-slate-800 animate-pulse rounded-lg" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Cron Jobs</h1>
          <p className="text-sm text-muted-foreground">
            Kelola tugas terjadwal dan update data otomatis
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={fetchJobs}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button onClick={() => {
            resetForm();
            setDialogMode('create');
            setIsDialogOpen(true);
          }}>
            <Plus className="mr-2 h-4 w-4" />
            Tambah Cron Job
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Jobs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-sky-500" />
              <span className="text-2xl font-bold">{jobs.length}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-2xl font-bold">
                {jobs.filter(j => j.status === 'active').length}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Runs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-blue-500" />
              <span className="text-2xl font-bold">
                {jobs.reduce((acc, j) => acc + j.runs, 0).toLocaleString()}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-emerald-500" />
              <span className="text-2xl font-bold">
                {jobs.length > 0 
                  ? Math.round((jobs.reduce((acc, j) => acc + j.successfulRuns, 0) / 
                      jobs.reduce((acc, j) => acc + j.runs, 0)) * 100) 
                  : 0}%
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Jobs Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama</TableHead>
              <TableHead>Deskripsi</TableHead>
              <TableHead>Schedule</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last Run</TableHead>
              <TableHead>Next Run</TableHead>
              <TableHead>Runs</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {jobs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  Belum ada cron job
                </TableCell>
              </TableRow>
            ) : (
              jobs.map((job) => (
                <TableRow key={job.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Timer className="h-4 w-4 text-sky-500" />
                      <span className="font-medium">{job.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {job.description}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="font-mono text-xs">
                      {job.schedule}
                    </Badge>
                  </TableCell>
                  <TableCell>{getStatusBadge(job.status)}</TableCell>
                  <TableCell>
                    {job.lastRun ? (
                      <span className="text-sm">
                        {formatDistanceToNow(new Date(job.lastRun), { addSuffix: true, locale: id })}
                      </span>
                    ) : (
                      <span className="text-sm text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">
                      {formatDistanceToNow(new Date(job.nextRun), { addSuffix: true, locale: id })}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-green-600">{job.successfulRuns}</span>
                      <span className="text-muted-foreground">/</span>
                      <span className="text-red-600">{job.failedRuns}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Aksi</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => handleRunNow(job)}>
                          <Play className="mr-2 h-4 w-4" />
                          Jalankan Sekarang
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
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          className="text-red-600"
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
        <DialogContent className="max-w-md">
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
                <Label htmlFor="name">Nama</Label>
                <Input
                  id="name"
                  placeholder="Contoh: Update Weather Data"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Deskripsi</Label>
                <Input
                  id="description"
                  placeholder="Update data cuaca setiap 6 jam"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="schedule">Schedule (Cron Expression)</Label>
                <Select 
                  value={formData.schedule} 
                  onValueChange={(value) => setFormData({ ...formData, schedule: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih schedule" />
                  </SelectTrigger>
                  <SelectContent>
                    {scheduleExamples.map((ex) => (
                      <SelectItem key={ex.value} value={ex.value}>
                        {ex.label} ({ex.value})
                      </SelectItem>
                    ))}
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
                {formData.schedule === 'custom' && (
                  <Input
                    placeholder="* * * * *"
                    value={formData.schedule}
                    onChange={(e) => setFormData({ ...formData, schedule: e.target.value })}
                  />
                )}
                <p className="text-xs text-muted-foreground">
                  Format: minute hour day month dayOfWeek
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="command">Command</Label>
                <Input
                  id="command"
                  placeholder="node scripts/update-weather.js"
                  value={formData.command}
                  onChange={(e) => setFormData({ ...formData, command: e.target.value })}
                  required
                />
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
            <DialogFooter>
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
              Apakah Anda yakin ingin menghapus cron job ini?
            </DialogDescription>
          </DialogHeader>
          {selectedJob && (
            <div className="py-4">
              <div className="p-3 bg-red-50 dark:bg-red-950/20 rounded-lg">
                <div className="flex items-center gap-3">
                  <Timer className="h-5 w-5 text-red-500" />
                  <div>
                    <p className="font-medium">{selectedJob.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedJob.description}
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