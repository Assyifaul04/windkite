// app/admin/designs/gallery/page.tsx
'use client';

import { useState, useEffect } from 'react';
import {
  ImagesIcon,
  Heart,
  Eye,
  Download,
  Filter,
  Search,
  RefreshCw,
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
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import Image from 'next/image';
import Link from 'next/link';

interface GalleryDesign {
  id: string;
  title: string | null;
  thumbnailUrl: string | null;
  coverImageUrl: string;
  isPublic: boolean;
  viewCount: number;
  createdAt: string;
  user: {
    name: string | null;
  };
  frame: {
    name: string;
  };
}

export default function DesignGalleryPage() {
  const [designs, setDesigns] = useState<GalleryDesign[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchGallery();
  }, [search]);

  const fetchGallery = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ search, public: 'true' });
      const response = await fetch(`/api/admin/designs/gallery?${params}`);
      
      if (!response.ok) throw new Error('Failed to fetch gallery');
      
      const data = await response.json();
      setDesigns(data);
    } catch (error) {
      console.error('Error fetching gallery:', error);
      toast.error('Gagal memuat galeri');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Design Gallery</h1>
          <p className="text-sm text-muted-foreground">
            Public gallery of kite designs
          </p>
        </div>
        <div className="flex gap-2">
          <div className="relative w-[200px]">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search gallery..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button variant="outline" size="icon" onClick={fetchGallery}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Gallery Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <Card key={i} className="animate-pulse">
              <div className="aspect-square bg-slate-200 dark:bg-slate-800" />
              <CardContent className="p-4">
                <div className="h-4 w-24 bg-slate-200 dark:bg-slate-800 rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : designs.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <ImagesIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No public designs found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {designs.map((design) => (
            <Card key={design.id} className="overflow-hidden group">
              <div className="relative aspect-square bg-slate-100 dark:bg-slate-800">
                <Image
                  src={design.thumbnailUrl || design.coverImageUrl}
                  alt={design.title || 'Design'}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <Button variant="secondary" size="sm" asChild>
                    <Link href={`/design/${design.id}`}>
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Link>
                  </Button>
                </div>
                <Badge className="absolute top-2 left-2">
                  {design.frame.name}
                </Badge>
                <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-white text-sm">
                  <span>By {design.user.name || 'Anonymous'}</span>
                  <div className="flex items-center gap-2">
                    <Heart className="h-3 w-3" />
                    <span>{design.viewCount}</span>
                  </div>
                </div>
              </div>
              <CardContent className="p-3">
                <p className="font-medium truncate">
                  {design.title || 'Untitled Design'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {new Date(design.createdAt).toLocaleDateString()}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}