// app/admin/designs/frames/page.tsx
"use client";

import { useState, useEffect } from "react";
import {
  FrameIcon,
  Plus,
  Search,
  Eye,
  Edit,
  Trash2,
  MoreVertical,
  Copy,
  RefreshCw,
  ImageOff,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
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
  markerData: any;
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
  };
  _count: {
    designs: number;
  };
}

const statusConfig = {
  DRAFT: {
    label: "Draft",
    color: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  },
  PUBLISHED: {
    label: "Published",
    color:
      "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  },
  ARCHIVED: {
    label: "Archived",
    color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  },
};

export default function KiteFramesPage() {
  const [frames, setFrames] = useState<KiteFrame[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedFrame, setSelectedFrame] = useState<KiteFrame | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchFrames();
  }, [search, statusFilter]);

  const fetchFrames = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ search, status: statusFilter });
      const response = await fetch(`/api/admin/frames?${params}`);

      if (!response.ok) throw new Error("Failed to fetch frames");

      const data = await response.json();
      setFrames(data);
      // Reset image errors for new data
      setImageErrors({});
    } catch (error) {
      console.error("Error fetching frames:", error);
      toast.error("Gagal memuat data frame");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/frames/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete frame");

      toast.success("Frame berhasil dihapus");
      setIsDeleteDialogOpen(false);
      fetchFrames();
    } catch (error) {
      console.error("Error deleting frame:", error);
      toast.error("Gagal menghapus frame");
    }
  };

  const handleStatusChange = async (id: string, status: string) => {
    try {
      const response = await fetch(`/api/admin/frames/${id}`, {
        method: "PATCH", // Ganti dari PUT ke PATCH
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) throw new Error("Failed to update status");

      toast.success(
        `Status berhasil diubah menjadi ${statusConfig[status as keyof typeof statusConfig].label}`,
      );
      fetchFrames();
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Gagal mengubah status");
    }
  };

  const handleImageError = (frameId: string) => {
    setImageErrors((prev) => ({ ...prev, [frameId]: true }));
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
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="h-16 bg-slate-200 dark:bg-slate-800 rounded animate-pulse"
            />
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
          <h1 className="text-2xl font-bold">Kite Frames</h1>
          <p className="text-sm text-muted-foreground">
            Manage kite frame templates with marker & clip-path
          </p>
        </div>
        <Link href="/admin/designs/frames/editor">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Frame
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search frames..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            <Select
              value={statusFilter}
              onValueChange={(value) => setStatusFilter(value || "all")} // Fixed: handle null
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="DRAFT">Draft</SelectItem>
                <SelectItem value="PUBLISHED">Published</SelectItem>
                <SelectItem value="ARCHIVED">Archived</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" size="icon" onClick={fetchFrames}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Content */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Frame</TableHead>
                <TableHead>Dimensions</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Usage</TableHead>
                <TableHead>Visibility</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {frames.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center py-8 text-muted-foreground"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <FrameIcon className="h-12 w-12 text-muted-foreground/50" />
                      <p>No frames found</p>
                      <p className="text-sm">
                        Create a new frame to get started
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                frames.map((frame) => {
                  const hasImageError = imageErrors[frame.id];
                  const imageSrc = frame.thumbnailUrl || frame.imageUrl;

                  return (
                    <TableRow key={frame.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800 flex-shrink-0">
                            {imageSrc && !hasImageError ? (
                              <Image
                                src={imageSrc}
                                alt={frame.name}
                                fill
                                className="object-cover"
                                onError={() => handleImageError(frame.id)}
                                unoptimized={imageSrc.startsWith("data:")}
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <ImageOff className="h-5 w-5 text-slate-400" />
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="font-medium">{frame.name}</p>
                            <p className="text-sm text-muted-foreground truncate max-w-[200px]">
                              {frame.description || "No description"}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {frame.canvasWidth && frame.canvasHeight ? (
                          `${frame.canvasWidth} × ${frame.canvasHeight}`
                        ) : (
                          <span className="text-muted-foreground">Not set</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge className={statusConfig[frame.status].color}>
                          {statusConfig[frame.status].label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <span className="font-medium">
                            {frame._count.designs}
                          </span>{" "}
                          designs
                          <span className="text-muted-foreground ml-2">
                            • {frame.viewCount} views
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          <Badge
                            variant={frame.isPublic ? "default" : "secondary"}
                          >
                            {frame.isPublic ? "Public" : "Private"}
                          </Badge>
                          {frame.clipPathSvg && (
                            <Badge
                              variant="outline"
                              className="flex items-center gap-1"
                            >
                              <FrameIcon className="h-3 w-3" />
                              Clip Path
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(frame.createdAt), {
                          addSuffix: true,
                          locale: id,
                        })}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                              Actions
                            </div>

                            <DropdownMenuItem>
                              <Link
                                href={`/admin/designs/frames/${frame.id}`}
                                className="flex items-center w-full"
                              >
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </Link>
                            </DropdownMenuItem>

                            <DropdownMenuItem>
                              <Link
                                href={`/admin/designs/frames/editor?id=${frame.id}`}
                                className="flex items-center w-full"
                              >
                                <Edit className="mr-2 h-4 w-4" />
                                Edit Frame
                              </Link>
                            </DropdownMenuItem>

                            <DropdownMenuItem>
                              <Link
                                href={`/admin/designs/frames/editor?copy=${frame.id}`}
                                className="flex items-center w-full"
                              >
                                <Copy className="mr-2 h-4 w-4" />
                                Duplicate
                              </Link>
                            </DropdownMenuItem>

                            <div className="h-px bg-border my-1" />

                            <div className="px-2 py-1 text-xs font-semibold text-muted-foreground">
                              Change Status
                            </div>

                            {frame.status !== "DRAFT" && (
                              <DropdownMenuItem
                                onClick={() =>
                                  handleStatusChange(frame.id, "DRAFT")
                                }
                              >
                                <div className="w-2 h-2 rounded-full bg-gray-500 mr-2" />
                                Set Draft
                              </DropdownMenuItem>
                            )}
                            {frame.status !== "PUBLISHED" && (
                              <DropdownMenuItem
                                onClick={() =>
                                  handleStatusChange(frame.id, "PUBLISHED")
                                }
                              >
                                <div className="w-2 h-2 rounded-full bg-green-500 mr-2" />
                                Set Published
                              </DropdownMenuItem>
                            )}
                            {frame.status !== "ARCHIVED" && (
                              <DropdownMenuItem
                                onClick={() =>
                                  handleStatusChange(frame.id, "ARCHIVED")
                                }
                              >
                                <div className="w-2 h-2 rounded-full bg-red-500 mr-2" />
                                Set Archived
                              </DropdownMenuItem>
                            )}

                            <div className="h-px bg-border my-1" />

                            <DropdownMenuItem
                              className="text-red-600 hover:text-red-700 focus:text-red-700"
                              onClick={() => {
                                setSelectedFrame(frame);
                                setIsDeleteDialogOpen(true);
                              }}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete Frame
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

      {/* Delete Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Frame</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete the
              frame and remove it from all designs.
              {selectedFrame && (
                <div className="mt-2 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                  <p className="font-medium">{selectedFrame.name}</p>
                  <p className="text-sm text-muted-foreground">
                    Used in {selectedFrame._count.designs} design(s)
                  </p>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => selectedFrame && handleDelete(selectedFrame.id)}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
