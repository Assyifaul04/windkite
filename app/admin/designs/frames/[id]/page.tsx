// app/admin/designs/frames/[id]/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  ArrowLeft,
  Edit,
  Trash2,
  Copy,
  Eye,
  FrameIcon,
  Users,
  Calendar,
  Link as LinkIcon,
  Download,
  Image as ImageIcon,
  CheckCircle,
  Clock,
  Archive,
  RefreshCw,
  ExternalLink,
  Grid2x2,
  Loader2,
  Info,
  AlertCircle,
  Check,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { format, formatDistanceToNow } from "date-fns";
import { id } from "date-fns/locale";
import Image from "next/image";
import Link from "next/link";

interface KiteFrame {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string;
  thumbnailUrl: string | null;
  canvasWidth: number | null;
  canvasHeight: number | null;
  markerData: any[];
  clipPathSvg: string | null;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  isPublic: boolean;
  viewCount: number;
  useCount: number;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
  };
  designs: Array<{
    id: string;
    title: string | null;
    coverImageUrl: string;
    status: string;
    isPublic: boolean;
    createdAt: string;
    user: {
      name: string | null;
      image: string | null;
    };
  }>;
  _count?: {
    designs: number;
  };
}

const statusConfig = {
  DRAFT: {
    label: "Draft",
    color: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
    badgeColor: "bg-gray-500",
    icon: Clock,
    description: "Frame masih dalam tahap pengerjaan",
  },
  PUBLISHED: {
    label: "Published",
    color:
      "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
    badgeColor: "bg-green-500",
    icon: CheckCircle,
    description: "Frame sudah dipublikasikan dan dapat digunakan",
  },
  ARCHIVED: {
    label: "Archived",
    color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
    badgeColor: "bg-red-500",
    icon: Archive,
    description: "Frame sudah diarsipkan dan tidak dapat digunakan",
  },
};

// Fallback ratio used only when the frame has no canvasWidth/canvasHeight
// saved yet (very old/legacy records).
const DEFAULT_ASPECT_RATIO = "16 / 9";

export default function KiteFrameDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [frame, setFrame] = useState<KiteFrame | null>(null);
  const [loading, setLoading] = useState(true);
  const [showClipPath, setShowClipPath] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [copied, setCopied] = useState(false);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    if (params.id) {
      fetchFrame(params.id as string);
    }
  }, [params.id]);

  const fetchFrame = async (id: string) => {
    try {
      setLoading(true);
      setImageError(false);
      const response = await fetch(`/api/admin/frames/${id}`);

      if (!response.ok) {
        if (response.status === 404) {
          toast.error("Frame tidak ditemukan");
          router.push("/admin/designs/frames");
          return;
        }
        throw new Error("Failed to fetch frame");
      }

      const data = await response.json();
      setFrame(data);
    } catch (error) {
      console.error("Error fetching frame:", error);
      toast.error("Gagal memuat data frame");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!frame) return;

    if (!confirm(`Apakah Anda yakin ingin menghapus frame "${frame.name}"?`))
      return;

    try {
      setIsDeleting(true);
      const response = await fetch(`/api/admin/frames/${frame.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete frame");
      }

      toast.success("Frame berhasil dihapus");
      router.push("/admin/designs/frames");
    } catch (error) {
      console.error("Error deleting frame:", error);
      toast.error(
        error instanceof Error ? error.message : "Gagal menghapus frame",
      );
    } finally {
      setIsDeleting(false);
    }
  };

  // app/admin/designs/frames/[id]/page.tsx - Perbaiki handleStatusChange
  const handleStatusChange = async (status: string) => {
    if (!frame) return;

    try {
      setIsUpdatingStatus(true);

      // Gunakan PATCH untuk partial update
      const response = await fetch(`/api/admin/frames/${frame.id}`, {
        method: "PATCH", // Ganti dari PUT ke PATCH
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update status");
      }

      toast.success(
        `Status berhasil diubah menjadi ${statusConfig[status as keyof typeof statusConfig].label}`,
      );
      await fetchFrame(frame.id);
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error(
        error instanceof Error ? error.message : "Gagal mengubah status",
      );
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("URL copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
          <div className="space-y-2">
            <div className="h-8 w-48 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
            <div className="h-4 w-64 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="aspect-video bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse" />
            <div className="h-40 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse" />
          </div>
          <div className="space-y-6">
            <div className="h-60 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse" />
            <div className="h-40 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (!frame) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4">
            <FrameIcon className="h-10 w-10 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-semibold">Frame Tidak Ditemukan</h2>
          <p className="text-muted-foreground mt-2">
            Frame yang Anda cari tidak ada atau telah dihapus dari sistem.
          </p>
          <Button
            onClick={() => router.push("/admin/designs/frames")}
            className="mt-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Kembali ke Daftar Frame
          </Button>
        </div>
      </div>
    );
  }

  const StatusIcon = statusConfig[frame.status].icon;
  const designCount = frame._count?.designs || frame.designs?.length || 0;
  const hasMarkers = frame.markerData && frame.markerData.length > 0;
  const hasClipPath = frame.clipPathSvg && frame.clipPathSvg.length > 0;
  const hasCanvasSize = !!(frame.canvasWidth && frame.canvasHeight);

  // FIX: previously this preview box was hard-locked to a 16:9
  // "aspect-video" ratio while the clip path / markers are computed in
  // frame.canvasWidth x frame.canvasHeight space. When a frame's real
  // ratio wasn't 16:9, the image and the marker overlay each did their own
  // independent "contain" fit against different box ratios, so the two
  // could visually drift apart. Sizing the box to the frame's own ratio
  // keeps image and overlay perfectly in sync, and matches what admins see
  // in the editor.
  const previewAspectRatio = hasCanvasSize
    ? `${frame.canvasWidth} / ${frame.canvasHeight}`
    : DEFAULT_ASPECT_RATIO;

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-start gap-4">
        <Button
          variant="outline"
          size="icon"
          onClick={() => router.back()}
          className="shrink-0"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>

        <div className="flex-1 min-w-[200px]">
          <h1 className="text-2xl font-bold">{frame.name}</h1>
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground mt-1">
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {frame.user?.name || "Unknown"}
            </span>
            <span className="text-muted-foreground/30">•</span>
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {format(new Date(frame.createdAt), "PPP", { locale: id })}
            </span>
            <span className="text-muted-foreground/30">•</span>
            <Badge className={statusConfig[frame.status].color}>
              <StatusIcon className="h-3 w-3 mr-1" />
              {statusConfig[frame.status].label}
            </Badge>
            {frame.isPublic && (
              <Badge
                variant="default"
                className="bg-green-500/10 text-green-600 dark:bg-green-500/20 dark:text-green-400"
              >
                <Check className="h-3 w-3 mr-1" />
                Public
              </Badge>
            )}
            {!frame.isPublic && (
              <Badge variant="secondary">
                <X className="h-3 w-3 mr-1" />
                Private
              </Badge>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link href={`/admin/designs/frames/editor?id=${frame.id}`}>
            <Button variant="outline" size="sm">
              <Edit className="h-4 w-4 mr-1" />
              Edit
            </Button>
          </Link>
          <Link href={`/admin/designs/frames/editor?copy=${frame.id}`}>
            <Button variant="outline" size="sm">
              <Copy className="h-4 w-4 mr-1" />
              Duplicate
            </Button>
          </Link>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4 mr-1" />
            )}
            Delete
          </Button>
        </div>
      </div>

      {/* Status Info */}
      <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3 border border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-3 text-sm">
          <Info className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">
            Status:{" "}
            <span className="font-medium text-foreground">
              {statusConfig[frame.status].label}
            </span>
          </span>
          <span className="text-muted-foreground/30">•</span>
          <span className="text-muted-foreground">
            {statusConfig[frame.status].description}
          </span>
          {hasClipPath && (
            <>
              <span className="text-muted-foreground/30">•</span>
              <Badge
                variant="default"
                className="bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400"
              >
                <FrameIcon className="h-3 w-3 mr-1" />
                Clip Path Ready
              </Badge>
            </>
          )}
          {!hasCanvasSize && (
            <>
              <span className="text-muted-foreground/30">•</span>
              <Badge
                variant="outline"
                className="text-amber-600 border-amber-300 dark:text-amber-400 dark:border-amber-800"
              >
                <AlertCircle className="h-3 w-3 mr-1" />
                No canvas size saved — edit &amp; re-save to fix marker
                alignment
              </Badge>
            </>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Image & Preview */}
        <div className="lg:col-span-2 space-y-6">
          {/* Frame Image */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <ImageIcon className="h-4 w-4 text-muted-foreground" />
                  Frame Image
                </CardTitle>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {frame.canvasWidth || "?"} × {frame.canvasHeight || "?"}
                  </Badge>
                  {hasMarkers && (
                    <Button
                      variant={showClipPath ? "default" : "outline"}
                      size="sm"
                      className="h-7 px-2 text-xs"
                      onClick={() => setShowClipPath(!showClipPath)}
                    >
                      {showClipPath ? "Hide" : "Show"} Clip Path
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div
                className="relative bg-slate-100 dark:bg-slate-800 rounded-lg overflow-hidden m-4"
                style={{ aspectRatio: previewAspectRatio }}
              >
                {frame.imageUrl && !imageError ? (
                  <>
                    <Image
                      src={frame.imageUrl}
                      alt={frame.name}
                      fill
                      className="object-contain"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      priority
                      onError={() => setImageError(true)}
                    />

                    {/* Clip Path Overlay */}
                    {showClipPath && hasClipPath && hasMarkers && (
                      <svg
                        className="absolute inset-0 w-full h-full pointer-events-none"
                        viewBox={`0 0 ${frame.canvasWidth || 800} ${frame.canvasHeight || 600}`}
                        preserveAspectRatio="xMidYMid meet"
                      >
                        <path
                          d={frame.clipPathSvg || ""}
                          fill="rgba(59, 130, 246, 0.15)"
                          stroke="rgba(59, 130, 246, 0.6)"
                          strokeWidth="3"
                        />
                        {frame.markerData.map((marker: any, index: number) => (
                          <g key={index}>
                            <circle
                              cx={marker.x}
                              cy={marker.y}
                              r="8"
                              fill="#ef4444"
                              stroke="white"
                              strokeWidth="2"
                            />
                            <text
                              x={marker.x + 12}
                              y={marker.y - 8}
                              fill="white"
                              fontSize="10"
                              fontWeight="bold"
                              className="drop-shadow-lg"
                            >
                              {index + 1}
                            </text>
                          </g>
                        ))}
                      </svg>
                    )}
                  </>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <ImageIcon className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                      <p className="text-muted-foreground text-sm">
                        {imageError
                          ? "Image not available"
                          : "No image uploaded"}
                      </p>
                    </div>
                  </div>
                )}

                {/* Info overlay */}
                <div className="absolute bottom-3 left-3 flex flex-wrap gap-1">
                  <Badge
                    variant="secondary"
                    className="text-xs bg-black/70 text-white border-none"
                  >
                    {frame.markerData?.length || 0} markers
                  </Badge>
                  {hasClipPath && (
                    <Badge
                      variant="default"
                      className="text-xs bg-blue-500/90 text-white border-none"
                    >
                      <FrameIcon className="h-3 w-3 mr-1" />
                      Clip path
                    </Badge>
                  )}
                </div>
              </div>

              {/* Image URL */}
              {frame.imageUrl && (
                <div className="mx-4 mb-4 flex items-center gap-2 p-2 bg-slate-50 dark:bg-slate-800/50 rounded border border-slate-200 dark:border-slate-700">
                  <LinkIcon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <code className="text-xs text-muted-foreground truncate flex-1">
                    {frame.imageUrl}
                  </code>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs"
                    onClick={() => copyToClipboard(frame.imageUrl)}
                  >
                    {copied ? (
                      <Check className="h-3 w-3 text-green-500" />
                    ) : (
                      "Copy"
                    )}
                  </Button>
                  <a
                    href={frame.imageUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-7 w-7 items-center justify-center rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                  >
                    <ExternalLink className="h-3 w-3 text-muted-foreground" />
                  </a>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Description */}
          {frame.description && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Info className="h-4 w-4 text-muted-foreground" />
                  Description
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">
                  {frame.description}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Used In Designs */}
          {frame.designs && frame.designs.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Grid2x2 className="h-4 w-4 text-muted-foreground" />
                  Used In Designs
                </CardTitle>
                <CardDescription>
                  {frame.designs.length} design(s) using this frame
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {frame.designs.slice(0, 6).map((design) => (
                    <Link
                      key={design.id}
                      href={`/admin/designs/${design.id}`}
                      className="flex items-center gap-3 p-3 rounded-lg border hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group"
                    >
                      <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800 flex-shrink-0">
                        {design.coverImageUrl ? (
                          <Image
                            src={design.coverImageUrl}
                            alt={design.title || "Design"}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ImageIcon className="h-5 w-5 text-slate-400" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                          {design.title || "Untitled Design"}
                        </p>
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="outline" className="text-[10px]">
                            {design.status}
                          </Badge>
                          {design.isPublic && (
                            <Badge
                              variant="default"
                              className="text-[10px] bg-green-500/10 text-green-600"
                            >
                              Public
                            </Badge>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
                {frame.designs.length > 6 && (
                  <div className="mt-4 text-center">
                    <Link href={`/admin/designs?frame=${frame.id}`}>
                      <Button variant="outline" size="sm">
                        View all {frame.designs.length} designs
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column - Info */}
        <div className="space-y-6">
          {/* Quick Stats */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Info className="h-4 w-4 text-muted-foreground" />
                Statistics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                <div className="flex items-center gap-2 text-sm">
                  <Eye className="h-4 w-4 text-muted-foreground" />
                  Views
                </div>
                <span className="font-medium">{frame.viewCount || 0}</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                <div className="flex items-center gap-2 text-sm">
                  <Grid2x2 className="h-4 w-4 text-muted-foreground" />
                  Designs
                </div>
                <span className="font-medium">{designCount}</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                <div className="flex items-center gap-2 text-sm">
                  <FrameIcon className="h-4 w-4 text-muted-foreground" />
                  Markers
                </div>
                <span className="font-medium">
                  {frame.markerData?.length || 0}
                </span>
              </div>
              <div className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                <div className="flex items-center gap-2 text-sm">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  Created by
                </div>
                <div className="flex items-center gap-2">
                  <Avatar className="h-6 w-6">
                    {frame.user?.image && (
                      <AvatarImage src={frame.user.image} />
                    )}
                    <AvatarFallback className="text-xs">
                      {frame.user?.name?.charAt(0).toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm">
                    {frame.user?.name || "Unknown"}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  Created
                </div>
                <span className="text-sm">
                  {formatDistanceToNow(new Date(frame.createdAt), {
                    addSuffix: true,
                    locale: id,
                  })}
                </span>
              </div>
              <div className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                <div className="flex items-center gap-2 text-sm">
                  <RefreshCw className="h-4 w-4 text-muted-foreground" />
                  Updated
                </div>
                <span className="text-sm">
                  {formatDistanceToNow(new Date(frame.updatedAt), {
                    addSuffix: true,
                    locale: id,
                  })}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
                Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link href={`/admin/designs/frames/editor?id=${frame.id}`}>
                <Button className="w-full">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Frame
                </Button>
              </Link>

              <Link href={`/admin/designs/frames/editor?copy=${frame.id}`}>
                <Button variant="outline" className="w-full">
                  <Copy className="h-4 w-4 mr-2" />
                  Duplicate Frame
                </Button>
              </Link>

              {frame.imageUrl && (
                <a
                  href={frame.imageUrl}
                  download
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button variant="outline" className="w-full">
                    <Download className="h-4 w-4 mr-2" />
                    Download Image
                  </Button>
                </a>
              )}

              <div className="border-t border-slate-200 dark:border-slate-700 my-3" />

              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">
                  Change Status
                </p>
                <div className="grid grid-cols-3 gap-1">
                  {Object.entries(statusConfig).map(([key, config]) => (
                    <Button
                      key={key}
                      variant={frame.status === key ? "default" : "outline"}
                      size="sm"
                      className="text-xs h-8"
                      onClick={() => handleStatusChange(key)}
                      disabled={isUpdatingStatus || frame.status === key}
                    >
                      {isUpdatingStatus && frame.status !== key ? (
                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                      ) : (
                        <config.icon className="h-3 w-3 mr-1" />
                      )}
                      {config.label}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="border-t border-slate-200 dark:border-slate-700 my-3" />

              <Button
                variant="destructive"
                className="w-full"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4 mr-2" />
                )}
                Delete Frame
              </Button>
            </CardContent>
          </Card>

          {/* Clip Path Info */}
          {hasClipPath && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <FrameIcon className="h-4 w-4 text-muted-foreground" />
                  Clip Path SVG
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3 max-h-[100px] overflow-auto border border-slate-200 dark:border-slate-700">
                  <code className="text-[10px] font-mono break-all text-muted-foreground">
                    {frame.clipPathSvg}
                  </code>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full mt-3"
                  onClick={() => {
                    navigator.clipboard.writeText(frame.clipPathSvg || "");
                    toast.success("Clip path copied to clipboard");
                  }}
                >
                  <Copy className="h-3 w-3 mr-1" />
                  Copy Clip Path
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Markers Info */}
          {hasMarkers && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-muted-foreground" />
                  Markers ({frame.markerData.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-1 max-h-[120px] overflow-y-auto">
                  {frame.markerData.map((marker: any, index: number) => (
                    <div
                      key={index}
                      className="flex items-center gap-1 text-xs p-1 bg-slate-50 dark:bg-slate-800/50 rounded"
                    >
                      <span className="font-medium text-muted-foreground">
                        #{index + 1}
                      </span>
                      <span className="text-muted-foreground">
                        ({Math.round(marker.x)}, {Math.round(marker.y)})
                      </span>
                      {marker.type === "curve" && (
                        <Badge
                          variant="outline"
                          className="text-[8px] h-4 px-1"
                        >
                          curve
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
