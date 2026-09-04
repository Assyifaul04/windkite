// app/admin/users/activity/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { 
  Activity, 
  MapPin, 
  Cloud, 
  Image as ImageIcon,
  Calendar,
  Filter
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

interface ActivityLog {
  id: string;
  userId: string;
  userName: string | null;
  userImage: string | null;
  action: 'CREATE_LOCATION' | 'UPDATE_LOCATION' | 'DELETE_LOCATION' | 
          'CREATE_WEATHER' | 'CREATE_DESIGN' | 'UPDATE_DESIGN' | 'DELETE_DESIGN';
  details: string;
  timestamp: string;
}

const actionColors: Record<string, string> = {
  CREATE_LOCATION: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  UPDATE_LOCATION: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  DELETE_LOCATION: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  CREATE_WEATHER: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300',
  CREATE_DESIGN: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300',
  UPDATE_DESIGN: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  DELETE_DESIGN: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
};

const actionLabels: Record<string, string> = {
  CREATE_LOCATION: 'Membuat Lokasi',
  UPDATE_LOCATION: 'Mengupdate Lokasi',
  DELETE_LOCATION: 'Menghapus Lokasi',
  CREATE_WEATHER: 'Mencatat Cuaca',
  CREATE_DESIGN: 'Membuat Desain AI',
  UPDATE_DESIGN: 'Mengupdate Desain AI',
  DELETE_DESIGN: 'Menghapus Desain AI',
};

export default function UserActivityPage() {
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    fetchActivities();
  }, [filter]);

  // Fixed: Properly typed filter change handler
  const handleFilterChange = (value: string | null) => {
    setFilter(value || 'all');
  };

  const fetchActivities = async () => {
    try {
      setLoading(true);
      const url = filter === 'all' 
        ? '/api/admin/users/activity'
        : `/api/admin/users/activity?action=${filter}`;
      
      const response = await fetch(url);
      const data = await response.json();
      setActivities(data);
    } catch (error) {
      console.error('Error fetching activities:', error);
      toast.error('Gagal memuat aktivitas');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="h-10 w-48 bg-slate-200 dark:bg-slate-800 animate-pulse rounded" />
        <div className="h-12 w-full bg-slate-200 dark:bg-slate-800 animate-pulse rounded" />
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-20 w-full bg-slate-200 dark:bg-slate-800 animate-pulse rounded" />
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
          <h1 className="text-2xl font-bold">Aktivitas Pengguna</h1>
          <p className="text-sm text-muted-foreground">
            Log aktivitas semua pengguna di platform
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Filter Aktivitas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="w-48">
              <Select 
                value={filter} 
                onValueChange={handleFilterChange}
              >
                <SelectTrigger>
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Pilih filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Aktivitas</SelectItem>
                  <SelectItem value="CREATE_LOCATION">Membuat Lokasi</SelectItem>
                  <SelectItem value="UPDATE_LOCATION">Mengupdate Lokasi</SelectItem>
                  <SelectItem value="DELETE_LOCATION">Menghapus Lokasi</SelectItem>
                  <SelectItem value="CREATE_WEATHER">Mencatat Cuaca</SelectItem>
                  <SelectItem value="CREATE_DESIGN">Membuat Desain AI</SelectItem>
                  <SelectItem value="UPDATE_DESIGN">Mengupdate Desain AI</SelectItem>
                  <SelectItem value="DELETE_DESIGN">Menghapus Desain AI</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" onClick={() => {
              setFilter('all');
            }}>
              Reset Filter
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Activity List */}
      <Card>
        <CardHeader>
          <CardTitle>Log Aktivitas</CardTitle>
        </CardHeader>
        <CardContent>
          {activities.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Belum ada aktivitas
            </div>
          ) : (
            <div className="space-y-4">
              {activities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-start gap-4 p-4 border rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                >
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={activity.userImage || ''} alt={activity.userName || 'User'} />
                    <AvatarFallback>
                      {activity.userName?.charAt(0).toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium">
                        {activity.userName || 'Pengguna tidak dikenal'}
                      </span>
                      <Badge className={actionColors[activity.action]}>
                        {actionLabels[activity.action]}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {activity.details}
                    </p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(activity.timestamp), 'dd MMM yyyy HH:mm', { locale: id })}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {activity.action.includes('LOCATION') && (
                      <MapPin className="h-4 w-4 text-emerald-500" />
                    )}
                    {activity.action.includes('WEATHER') && (
                      <Cloud className="h-4 w-4 text-blue-500" />
                    )}
                    {activity.action.includes('DESIGN') && (
                      <ImageIcon className="h-4 w-4 text-pink-500" />
                    )}
                    {activity.action.includes('DELETE') && (
                      <Badge variant="destructive" className="text-xs">Dihapus</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}