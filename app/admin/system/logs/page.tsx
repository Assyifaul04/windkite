// app/admin/system/logs/page.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import {
  FileText,
  Search,
  Filter,
  Download,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Info,
  AlertTriangle,
  XCircle,
  Calendar,
  Clock,
  Copy,
  Eye,
  MoreVertical,
  Terminal,
  Database,
  Server,
  User,
  Shield,
  Activity
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
  DropdownMenuGroup,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

interface SystemLog {
  id: string;
  level: 'info' | 'warning' | 'error' | 'debug';
  message: string;
  source: string;
  userId?: string;
  userName?: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

const LOG_LEVELS = ['info', 'warning', 'error', 'debug'] as const;
const LOG_SOURCES = ['system', 'database', 'auth', 'api', 'cron', 'middleware'];

export default function SystemLogsPage() {
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLevel, setFilterLevel] = useState<string>('all');
  const [filterSource, setFilterSource] = useState<string>('all');
  const [selectedLog, setSelectedLog] = useState<SystemLog | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  const logContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchLogs();
    
    const interval = setInterval(() => {
      if (autoScroll) {
        fetchLogs();
      }
    }, 30000); // Refresh every 30 seconds
    
    return () => clearInterval(interval);
  }, [filterLevel, filterSource]);

  useEffect(() => {
    if (autoScroll && logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterLevel !== 'all') params.append('level', filterLevel);
      if (filterSource !== 'all') params.append('source', filterSource);
      
      const response = await fetch(`/api/admin/system/logs?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch logs');
      }
      
      const data = await response.json();
      setLogs(data);
    } catch (error) {
      console.error('Error fetching logs:', error);
      toast.error('Gagal memuat log sistem');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLog = (log: SystemLog) => {
    const text = `[${log.timestamp}] ${log.level.toUpperCase()}: ${log.message}`;
    navigator.clipboard.writeText(text);
    toast.success('Log berhasil disalin');
  };

  const handleExport = () => {
    const dataStr = logs.map(log => 
      `[${log.timestamp}] ${log.level.toUpperCase()} [${log.source}] ${log.message}`
    ).join('\n');
    
    const blob = new Blob([dataStr], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = `system-logs-${format(new Date(), 'yyyy-MM-dd-HH-mm')}.txt`;
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Log berhasil diekspor');
  };

  // Fixed: Properly typed filter handlers
  const handleLevelFilterChange = (value: string | null) => {
    setFilterLevel(value || 'all');
  };

  const handleSourceFilterChange = (value: string | null) => {
    setFilterSource(value || 'all');
  };

  const getLevelBadge = (level: string) => {
    const styles: Record<string, string> = {
      info: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
      warning: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
      error: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
      debug: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
    };
    const icons: Record<string, React.ReactElement> = {
      info: <Info className="h-3 w-3" />,
      warning: <AlertTriangle className="h-3 w-3" />,
      error: <AlertCircle className="h-3 w-3" />,
      debug: <CheckCircle className="h-3 w-3" />,
    };
    return (
      <Badge className={`${styles[level]} flex items-center gap-1`}>
        {icons[level]}
        {level.toUpperCase()}
      </Badge>
    );
  };

  const getSourceIcon = (source: string) => {
    const icons: Record<string, React.ReactElement> = {
      system: <Server className="h-3 w-3" />,
      database: <Database className="h-3 w-3" />,
      auth: <User className="h-3 w-3" />,
      api: <Activity className="h-3 w-3" />,
      cron: <Clock className="h-3 w-3" />,
      middleware: <Shield className="h-3 w-3" />,
    };
    return icons[source] || <FileText className="h-3 w-3" />;
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.source.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.userName?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  if (loading && logs.length === 0) {
    return (
      <div className="p-6 space-y-6">
        <div className="h-10 w-48 bg-slate-200 dark:bg-slate-800 animate-pulse rounded" />
        <div className="h-12 w-full bg-slate-200 dark:bg-slate-800 animate-pulse rounded" />
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-12 w-full bg-slate-200 dark:bg-slate-800 animate-pulse rounded" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">System Logs</h1>
          <p className="text-sm text-muted-foreground">
            Log aktivitas sistem dan aplikasi
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={autoScroll ? 'default' : 'outline'}
            onClick={() => setAutoScroll(!autoScroll)}
            size="sm"
          >
            {autoScroll ? 'Auto Scroll On' : 'Auto Scroll Off'}
          </Button>
          <Button variant="outline" onClick={fetchLogs} size="sm">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button variant="outline" onClick={handleExport} size="sm">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Filters - Fixed Select onChange handlers */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari log..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select 
          value={filterLevel} 
          onValueChange={handleLevelFilterChange}
        >
          <SelectTrigger className="w-40">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Level" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Level</SelectItem>
            {LOG_LEVELS.map((level) => (
              <SelectItem key={level} value={level}>
                {level.toUpperCase()}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select 
          value={filterSource} 
          onValueChange={handleSourceFilterChange}
        >
          <SelectTrigger className="w-40">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Source" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Source</SelectItem>
            {LOG_SOURCES.map((source) => (
              <SelectItem key={source} value={source}>
                {source.toUpperCase()}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={fetchLogs}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Apply Filter
        </Button>
      </div>

      {/* Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Log Messages</CardTitle>
          <CardDescription>
            Total {filteredLogs.length} log messages
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div 
            ref={logContainerRef}
            className="max-h-[600px] overflow-y-auto border rounded-lg"
          >
            <Table>
              <TableHeader className="sticky top-0 bg-background">
                <TableRow>
                  <TableHead className="w-[80px]">Level</TableHead>
                  <TableHead className="w-[100px]">Source</TableHead>
                  <TableHead>Message</TableHead>
                  <TableHead className="w-[150px]">User</TableHead>
                  <TableHead className="w-[180px]">Timestamp</TableHead>
                  <TableHead className="w-[100px] text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Tidak ada log ditemukan
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLogs.map((log) => (
                    <TableRow 
                      key={log.id}
                      className={
                        log.level === 'error' ? 'bg-red-50 dark:bg-red-950/10' :
                        log.level === 'warning' ? 'bg-yellow-50 dark:bg-yellow-950/10' :
                        ''
                      }
                    >
                      <TableCell>{getLevelBadge(log.level)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {getSourceIcon(log.source)}
                          <span className="text-xs">{log.source}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-md truncate">
                          {log.message}
                        </div>
                      </TableCell>
                      <TableCell>
                        {log.userName ? (
                          <span className="text-sm">{log.userName}</span>
                        ) : (
                          <span className="text-sm text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm whitespace-nowrap">
                        {format(new Date(log.timestamp), 'dd/MM/yyyy HH:mm:ss')}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger>
                            <Button variant="ghost" className="h-8 w-8 p-0" type="button">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuGroup>
                              <DropdownMenuLabel>Aksi</DropdownMenuLabel>
                            </DropdownMenuGroup>
                            <DropdownMenuSeparator />
                            <DropdownMenuGroup>
                              <DropdownMenuItem onClick={() => {
                                setSelectedLog(log);
                                setIsViewDialogOpen(true);
                              }}>
                                <Eye className="mr-2 h-4 w-4" />
                                Detail
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleCopyLog(log)}>
                                <Copy className="mr-2 h-4 w-4" />
                                Salin
                              </DropdownMenuItem>
                            </DropdownMenuGroup>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detail Log</DialogTitle>
            <DialogDescription>
              Informasi lengkap dari log
            </DialogDescription>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Level</p>
                  <div className="mt-1">{getLevelBadge(selectedLog.level)}</div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Source</p>
                  <div className="mt-1 flex items-center gap-1">
                    {getSourceIcon(selectedLog.source)}
                    <span className="font-medium">{selectedLog.source}</span>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">User</p>
                  <p className="font-medium">{selectedLog.userName || 'System'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Timestamp</p>
                  <p className="font-medium">
                    {format(new Date(selectedLog.timestamp), 'dd MMMM yyyy HH:mm:ss', { locale: id })}
                  </p>
                </div>
              </div>

              <div className="border-t pt-4">
                <p className="text-sm text-muted-foreground">Message</p>
                <div className="mt-1 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                  <p className="font-mono text-sm break-all">{selectedLog.message}</p>
                </div>
              </div>

              {selectedLog.metadata && Object.keys(selectedLog.metadata).length > 0 && (
                <div className="border-t pt-4">
                  <p className="text-sm text-muted-foreground">Metadata</p>
                  <div className="mt-1 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                    <pre className="text-xs font-mono whitespace-pre-wrap break-all">
                      {JSON.stringify(selectedLog.metadata, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
              Tutup
            </Button>
            {selectedLog && (
              <Button variant="outline" onClick={() => handleCopyLog(selectedLog)}>
                <Copy className="mr-2 h-4 w-4" />
                Salin
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}