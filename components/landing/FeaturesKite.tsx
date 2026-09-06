// components/landing/FeaturesKite.tsx
'use client';

import { useEffect, useState } from 'react';
import { useSession, signIn } from 'next-auth/react';
import Image from 'next/image';
import Link from 'next/link';
import { 
  Shapes, 
  Sparkles, 
  Palette,
  Users,
  AlertCircle,
  Zap,
  Eye,
  Clock,
  ChevronRight,
  TrendingUp,
  Crown,
  Star
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

// ==========================================
// Interface Data
// ==========================================
interface KiteFrame {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string;
  thumbnailUrl: string | null;
  canvasWidth: number | null;
  canvasHeight: number | null;
  isPublic: boolean;
  viewCount: number;
  useCount: number;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  createdAt: string;
  updatedAt: string;
  userId: string;
  user: {
    id: string;
    name: string | null;
    image: string | null;
  };
  _count?: {
    designs: number;
  };
}

interface FeaturesKiteProps {
  className?: string;
  limit?: number;
}

// ==========================================
// Skeleton Loading - Professional
// ==========================================
const KiteSkeleton = () => (
  <div className="bg-white dark:bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 animate-pulse">
    <div className="aspect-[4/3] bg-gradient-to-br from-zinc-200 to-zinc-300 dark:from-zinc-700 dark:to-zinc-800" />
    <div className="p-4 space-y-3">
      <div className="flex items-start justify-between">
        <div className="space-y-1.5 flex-1">
          <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-3/4" />
          <div className="h-2.5 bg-zinc-200 dark:bg-zinc-700 rounded w-1/3" />
        </div>
        <div className="h-5 w-14 bg-zinc-200 dark:bg-zinc-700 rounded-full" />
      </div>
      <div className="space-y-1.5">
        <div className="h-2.5 bg-zinc-200 dark:bg-zinc-700 rounded w-full" />
        <div className="h-2.5 bg-zinc-200 dark:bg-zinc-700 rounded w-2/3" />
      </div>
      <div className="flex items-center justify-between pt-2">
        <div className="h-2.5 bg-zinc-200 dark:bg-zinc-700 rounded w-16" />
        <div className="h-7 bg-zinc-200 dark:bg-zinc-700 rounded w-24" />
      </div>
    </div>
  </div>
);

// ==========================================
// Main Component
// ==========================================
export default function FeaturesKite({ className = '', limit = 6 }: FeaturesKiteProps) {
  const { data: session, status } = useSession();
  const [kites, setKites] = useState<KiteFrame[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  useEffect(() => {
    const fetchKites = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const res = await fetch(`/api/kite-frames?limit=${limit}`);
        const data = await res.json();
        
        if (!res.ok) {
          throw new Error(data.error || 'Gagal memuat kerangka layangan');
        }
        
        setKites(data.frames || []);
        setTotal(data.total || 0);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
        console.error('Error fetching kite frames:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchKites();
  }, [limit]);

  const handleEditClick = (kiteId: string) => {
    if (!session) {
      signIn('google', { 
        callbackUrl: `/user/designs?frame=${kiteId}` 
      });
    } else {
      window.location.href = `/user/designs?frame=${kiteId}`;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric' 
    });
  };

  if (loading) {
    return (
      <section className={cn('py-12 md:py-16 bg-white dark:bg-black', className)}>
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 text-sm font-medium mb-3">
              <Sparkles className="w-4 h-4" />
              Pilihan Kerangka
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-zinc-900 dark:text-white">
              Kerangka <span className="text-blue-500">Layangan</span>
            </h2>
            <p className="text-zinc-600 dark:text-zinc-400 mt-2 text-sm max-w-2xl mx-auto">
              Pilih kerangka yang tersedia, lalu desain dengan gambar favoritmu.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: Math.min(limit, 6) }).map((_, i) => (
              <KiteSkeleton key={i} />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className={cn('py-12 md:py-16 bg-white dark:bg-black', className)}>
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="text-3xl md:text-4xl font-bold text-zinc-900 dark:text-white">
              Kerangka Layangan
            </h2>
            <p className="text-zinc-600 dark:text-zinc-400 mt-2 text-sm">
              Pilih kerangka dan mulai desain layanganmu
            </p>
          </div>
          <div className="max-w-md mx-auto p-6 bg-red-50 dark:bg-red-950/20 rounded-xl border border-red-200 dark:border-red-800 text-center">
            <AlertCircle className="w-10 h-10 text-red-600 dark:text-red-400 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-red-800 dark:text-red-200">
              Gagal Memuat Data
            </h3>
            <p className="text-sm text-red-600 dark:text-red-300 mt-1">{error}</p>
            <Button 
              variant="outline" 
              size="sm"
              className="mt-3"
              onClick={() => window.location.reload()}
            >
              Coba Lagi
            </Button>
          </div>
        </div>
      </section>
    );
  }

  if (kites.length === 0) {
    return (
      <section className={cn('py-12 md:py-16 bg-white dark:bg-black', className)}>
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 text-sm font-medium mb-3">
              <Sparkles className="w-4 h-4" />
              Pilihan Kerangka
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-zinc-900 dark:text-white">
              Kerangka <span className="text-blue-500">Layangan</span>
            </h2>
            <p className="text-zinc-600 dark:text-zinc-400 mt-2 text-sm max-w-2xl mx-auto">
              Pilih kerangka yang tersedia, lalu desain dengan gambar favoritmu.
            </p>
          </div>
          <div className="max-w-md mx-auto p-8 bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-700 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shapes className="w-8 h-8 text-blue-500 dark:text-blue-400" />
            </div>
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-2">
              Belum Ada Kerangka
            </h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Admin akan segera menambahkan berbagai kerangka layangan yang bisa kamu desain.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className={cn('py-12 md:py-16 bg-white dark:bg-black', className)}>
      <div className="container mx-auto px-4">
        {/* Header - Judul tetap besar */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 text-blue-600 dark:text-blue-400 text-sm font-medium mb-3 border border-blue-100 dark:border-blue-800/30">
            <Sparkles className="w-4 h-4" />
            <span>Pilihan Kerangka</span>
            <Badge variant="secondary" className="ml-1 text-xs bg-white/50 dark:bg-black/50">
              {total}
            </Badge>
          </div>
          
          <h2 className="text-3xl md:text-4xl font-bold text-zinc-900 dark:text-white">
            Kerangka <span className="text-blue-500">Layangan</span>
          </h2>
          <p className="text-zinc-600 dark:text-zinc-400 mt-2 text-sm max-w-2xl mx-auto">
            Pilih kerangka yang tersedia, lalu desain dengan gambar favoritmu. 
            Mudah, cepat, dan hasilnya keren!
          </p>
          {total > limit && (
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1.5">
              Menampilkan {Math.min(limit, total)} dari {total} kerangka
            </p>
          )}
        </div>

        {/* Grid Kites - Tanpa motion variants untuk menghindari error */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
          {kites.map((kite) => (
            <div
              key={kite.id}
              onMouseEnter={() => setHoveredId(kite.id)}
              onMouseLeave={() => setHoveredId(null)}
              className="group relative"
            >
              <div className="bg-white dark:bg-zinc-900 rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800 hover:border-blue-500 dark:hover:border-blue-500 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/10 hover:-translate-y-0.5 h-full flex flex-col">
                {/* Image Container - Lebih kecil */}
                <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-zinc-100 to-zinc-200 dark:from-zinc-800 dark:to-zinc-900">
                  <Image
                    src={kite.imageUrl}
                    alt={kite.name}
                    fill
                    className={cn(
                      "object-cover transition-transform duration-500",
                      hoveredId === kite.id ? "scale-105" : "scale-100"
                    )}
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                  
                  {/* Overlay Gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  
                  {/* Stats Badges - Lebih kecil */}
                  <div className="absolute top-2 right-2 flex flex-col gap-1.5">
                    {kite.viewCount > 0 && (
                      <Badge className="bg-black/60 backdrop-blur-sm hover:bg-black/70 text-white border-0 shadow-lg text-[10px] px-2 py-0.5">
                        <Eye className="w-2.5 h-2.5 mr-1" />
                        {kite.viewCount}
                      </Badge>
                    )}
                    {kite.useCount > 0 && (
                      <Badge className="bg-blue-500/80 backdrop-blur-sm hover:bg-blue-500/90 text-white border-0 shadow-lg text-[10px] px-2 py-0.5">
                        <Users className="w-2.5 h-2.5 mr-1" />
                        {kite.useCount}x
                      </Badge>
                    )}
                  </div>

                  {/* Popular Badge - Lebih kecil */}
                  {(kite.useCount > 5 || kite.viewCount > 50) && (
                    <div className="absolute top-2 left-2">
                      <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 shadow-lg text-[10px] px-2 py-0.5">
                        <TrendingUp className="w-2.5 h-2.5 mr-1" />
                        Populer
                      </Badge>
                    </div>
                  )}
                </div>

                {/* Content - Lebih compact */}
                <div className="p-3.5 space-y-2 flex-1 flex flex-col">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-zinc-900 dark:text-white text-sm truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {kite.name}
                      </h3>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <div className="w-4 h-4 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white text-[7px] font-bold">
                          {kite.user?.name?.charAt(0).toUpperCase() || 'A'}
                        </div>
                        <p className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate">
                          {kite.user?.name || 'Admin'}
                        </p>
                      </div>
                    </div>
                    {kite.canvasWidth && kite.canvasHeight && (
                      <Badge variant="outline" className="text-[9px] shrink-0 border-zinc-300 dark:border-zinc-600 px-1.5 py-0">
                        {kite.canvasWidth}×{kite.canvasHeight}
                      </Badge>
                    )}
                  </div>

                  {kite.description && (
                    <p className="text-[11px] text-zinc-600 dark:text-zinc-400 line-clamp-2 flex-1">
                      {kite.description}
                    </p>
                  )}

                  {/* Footer - Lebih compact */}
                  <div className="flex items-center justify-between pt-1.5 border-t border-zinc-100 dark:border-zinc-800">
                    <span className="flex items-center gap-1 text-[9px] text-zinc-500 dark:text-zinc-400">
                      <Clock className="w-2.5 h-2.5" />
                      {formatDate(kite.createdAt)}
                    </span>
                    {kite._count?.designs !== undefined && kite._count.designs > 0 && (
                      <span className="flex items-center gap-1 text-[9px] text-zinc-500 dark:text-zinc-400">
                        <Palette className="w-2.5 h-2.5" />
                        {kite._count.designs}
                      </span>
                    )}
                  </div>

                  {/* Action Button - Lebih kecil */}
                  <Button
                    onClick={() => handleEditClick(kite.id)}
                    size="sm"
                    className={cn(
                      "w-full gap-1.5 text-xs h-8 transition-all duration-300",
                      !session 
                        ? "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40"
                        : "bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white"
                    )}
                  >
                    {!session ? (
                      <>
                        <Zap className="w-3 h-3" />
                        Mulai Mengedit
                      </>
                    ) : (
                      <>
                        <Palette className="w-3 h-3" />
                        Edit Desain
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer Action - Lebih compact */}
        <div className="text-center mt-8">
          <div className="inline-flex flex-col items-center gap-3 p-5 bg-gradient-to-br from-blue-50/50 to-indigo-50/50 dark:from-blue-950/20 dark:to-indigo-950/20 rounded-2xl border border-blue-100 dark:border-blue-800/30 max-w-2xl mx-auto">
            <div className="flex items-center gap-2">
              {session ? (
                <>
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                    <Crown className="w-3.5 h-3.5 text-white" />
                  </div>
                  <p className="text-sm text-zinc-700 dark:text-zinc-300 font-medium">
                    Kamu sudah login, siap berkreasi! 🎨
                  </p>
                </>
              ) : (
                <>
                  <p className="text-sm text-zinc-700 dark:text-zinc-300 font-medium">
                    Login untuk mulai mendesain layanganmu
                  </p>
                </>
              )}
            </div>
            
            <div className="flex flex-wrap items-center justify-center gap-2">
              {!session && (
                <Button
                  onClick={() => signIn('google', { callbackUrl: '/user/designs' })}
                  size="sm"
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 gap-1.5 px-4 text-xs h-8"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  Login dengan Google
                </Button>
              )}
              {session && total > limit && (
                <Link href="/user/designs">
                  <Button variant="outline" size="sm" className="gap-1.5 px-4 text-xs h-8 border-blue-300 dark:border-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/30">
                    Lihat Semua
                    <ChevronRight className="w-3 h-3" />
                  </Button>
                </Link>
              )}
              {!session && total > limit && (
                <Button
                  onClick={() => signIn('google', { callbackUrl: '/user/designs' })}
                  variant="outline"
                  size="sm"
                  className="gap-1.5 px-4 text-xs h-8 border-blue-300 dark:border-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/30"
                >
                  Lihat Semua
                  <ChevronRight className="w-3 h-3" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}