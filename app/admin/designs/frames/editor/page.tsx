// app/admin/designs/frames/editor/page.tsx
'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Save,
  Upload,
  X,
  Trash2,
  MousePointer,
  Move,
  Image as ImageIcon,
  FrameIcon,
  ZoomIn,
  ZoomOut,
  RefreshCw,
  Download,
  Check,
  AlertCircle,
  Minus,
  Maximize,
  Minimize,
  Grid3x3,
  Undo2,
  Redo2,
  Copy,
  FileUp,
  FileDown,
  Eye,
  EyeOff,
  Square,
  Plus,
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

interface Marker {
  id: string;
  x: number;
  y: number;
  type: 'line' | 'curve';
  controlX?: number;
  controlY?: number;
}

interface FrameData {
  id?: string;
  name: string;
  description: string;
  imageUrl: string;
  thumbnailUrl?: string;
  canvasWidth: number;
  canvasHeight: number;
  isPublic: boolean;
  markerData: Marker[];
  clipPathSvg: string | null;
}

// Maximum size (in px) we'll scale an uploaded image's longest side down to.
// Keeping canvasWidth/canvasHeight in the SAME aspect ratio as the actual
// image is what prevents "object-contain" letterboxing, which is what was
// causing marker clicks to land in the wrong spot.
const MAX_CANVAS_DIMENSION = 1000;

// Reads an image file in the browser to get its real (natural) pixel size,
// BEFORE it's uploaded, so we can set the canvas to match its aspect ratio.
const getImageNaturalDimensions = (file: File): Promise<{ width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new window.Image();
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
      URL.revokeObjectURL(objectUrl);
    };
    img.onerror = (err) => {
      URL.revokeObjectURL(objectUrl);
      reject(err);
    };
    img.src = objectUrl;
  });
};

// Component that uses useSearchParams
function FrameEditorContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const frameId = searchParams.get('id');
  const copyFrom = searchParams.get('copy');

  const canvasRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [loading, setLoading] = useState(false);
  const [isLoadingFrame, setIsLoadingFrame] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedMarkerId, setDraggedMarkerId] = useState<string | null>(null);
  const [selectedMarkerId, setSelectedMarkerId] = useState<string | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [showGrid, setShowGrid] = useState(false);
  const [markerType, setMarkerType] = useState<'line' | 'curve'>('line');
  const [history, setHistory] = useState<Marker[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [hoveredMarkerId, setHoveredMarkerId] = useState<string | null>(null);
  const [showClipPath, setShowClipPath] = useState(true);
  const [snapToGrid, setSnapToGrid] = useState(false);
  const [gridSize, setGridSize] = useState(20);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const [frame, setFrame] = useState<FrameData>({
    name: '',
    description: '',
    imageUrl: '',
    thumbnailUrl: '',
    canvasWidth: 800,
    canvasHeight: 600,
    isPublic: false,
    markerData: [],
    clipPathSvg: null,
  });

  useEffect(() => {
    if (frameId) {
      loadFrame(frameId);
    } else if (copyFrom) {
      loadFrame(copyFrom, true);
    }
  }, [frameId, copyFrom]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      }
      if ((e.ctrlKey && e.key === 'y') || (e.ctrlKey && e.shiftKey && e.key === 'z')) {
        e.preventDefault();
        redo();
      }
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedMarkerId) {
        e.preventDefault();
        deleteMarker(selectedMarkerId);
      }
      if (e.key === 'Escape') {
        setSelectedMarkerId(null);
      }
      if (e.ctrlKey && e.key === 'g') {
        e.preventDefault();
        setShowGrid(!showGrid);
      }
      if (e.ctrlKey && e.key === '=') {
        e.preventDefault();
        zoomIn();
      }
      if (e.ctrlKey && e.key === '-') {
        e.preventDefault();
        zoomOut();
      }
      if (e.ctrlKey && e.key === '0') {
        e.preventDefault();
        zoomReset();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedMarkerId, historyIndex, history, showGrid]);

  const loadFrame = async (id: string, isCopy = false) => {
    try {
      setIsLoadingFrame(true);
      const response = await fetch(`/api/admin/frames/${id}`);

      if (!response.ok) throw new Error('Failed to load frame');

      const data = await response.json();

      if (isCopy) {
        setFrame({
          ...data,
          name: `${data.name} (Copy)`,
          id: undefined,
          description: data.description || '',
          markerData: data.markerData || [],
          clipPathSvg: data.clipPathSvg || null,
        });
        toast.success('Frame duplicated successfully');
      } else {
        setFrame({
          ...data,
          description: data.description || '',
          markerData: data.markerData || [],
          clipPathSvg: data.clipPathSvg || null,
        });
      }
      setImageLoaded(true);
    } catch (error) {
      console.error('Error loading frame:', error);
      toast.error('Failed to load frame');
    } finally {
      setIsLoadingFrame(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image size must be less than 10MB');
      return;
    }

    try {
      setLoading(true);

      const naturalDims = await getImageNaturalDimensions(file).catch(() => null);

      const formData = new FormData();
      formData.append('file', file);
      formData.append('name', frame.name || 'Frame');

      const response = await fetch('/api/admin/frames', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Upload failed');
      }

      const data = await response.json();

      let canvasWidth = data.canvasWidth || 800;
      let canvasHeight = data.canvasHeight || 600;

      if (naturalDims && naturalDims.width > 0 && naturalDims.height > 0) {
        const scale = Math.min(
          1,
          MAX_CANVAS_DIMENSION / Math.max(naturalDims.width, naturalDims.height)
        );
        canvasWidth = Math.round(naturalDims.width * scale);
        canvasHeight = Math.round(naturalDims.height * scale);
      }

      setFrame((prev) => ({
        ...prev,
        imageUrl: data.imageUrl,
        id: data.id,
        canvasWidth,
        canvasHeight,
        markerData: [],
        clipPathSvg: null,
      }));
      setImageDimensions(naturalDims || { width: canvasWidth, height: canvasHeight });
      setImageLoaded(true);
      addToHistory([]);

      toast.success('Image uploaded successfully!');

      if (data.id) {
        router.push(`/admin/designs/frames/editor?id=${data.id}`);
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to upload image');
    } finally {
      setLoading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      const input = document.createElement('input');
      input.type = 'file';
      const dt = new DataTransfer();
      dt.items.add(file);
      input.files = dt.files;
      handleImageUpload({ target: input } as any);
    }
  };

  const zoomIn = () => setZoomLevel((prev) => Math.min(prev + 0.1, 3));
  const zoomOut = () => setZoomLevel((prev) => Math.max(prev - 0.1, 0.3));
  const zoomReset = () => {
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
  };
  const zoomFit = () => {
    if (!containerRef.current) return;
    const containerWidth = containerRef.current.clientWidth - 40;
    const containerHeight = containerRef.current.clientHeight - 40;
    const imageAspect = frame.canvasWidth / frame.canvasHeight;
    const containerAspect = containerWidth / containerHeight;

    let newZoom;
    if (imageAspect > containerAspect) {
      newZoom = containerWidth / frame.canvasWidth;
    } else {
      newZoom = containerHeight / frame.canvasHeight;
    }
    setZoomLevel(Math.min(newZoom, 1));
    setPanOffset({ x: 0, y: 0 });
  };

  const getMarkerPosition = (e: React.MouseEvent) => {
    if (!imageRef.current) return null;

    const imageRect = imageRef.current.getBoundingClientRect();
    if (imageRect.width === 0 || imageRect.height === 0) return null;

    const x = ((e.clientX - imageRect.left) / imageRect.width) * frame.canvasWidth;
    const y = ((e.clientY - imageRect.top) / imageRect.height) * frame.canvasHeight;

    let snappedX = x;
    let snappedY = y;

    if (snapToGrid) {
      snappedX = Math.round(x / gridSize) * gridSize;
      snappedY = Math.round(y / gridSize) * gridSize;
    }

    return {
      x: Math.max(0, Math.min(frame.canvasWidth, snappedX)),
      y: Math.max(0, Math.min(frame.canvasHeight, snappedY)),
    };
  };

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (!frame.imageUrl || !imageLoaded || isPanning) return;

    const pos = getMarkerPosition(e);
    if (!pos) return;

    const newMarker: Marker = {
      id: `marker-${Date.now()}`,
      x: pos.x,
      y: pos.y,
      type: markerType,
    };

    if (markerType === 'curve' && frame.markerData.length > 0) {
      const lastMarker = frame.markerData[frame.markerData.length - 1];
      newMarker.controlX = (lastMarker.x + pos.x) / 2;
      newMarker.controlY = (lastMarker.y + pos.y) / 2 - 50;
    }

    addToHistory([...frame.markerData, newMarker]);
    setFrame((prev) => ({
      ...prev,
      markerData: [...prev.markerData, newMarker],
    }));
    setSelectedMarkerId(newMarker.id);
  };

  const handleMarkerMouseDown = (e: React.MouseEvent, markerId: string) => {
    e.stopPropagation();
    setIsDragging(true);
    setDraggedMarkerId(markerId);
    setSelectedMarkerId(markerId);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && draggedMarkerId) {
      const pos = getMarkerPosition(e);
      if (!pos) return;

      setFrame((prev) => ({
        ...prev,
        markerData: prev.markerData.map((marker) =>
          marker.id === draggedMarkerId ? { ...marker, x: pos.x, y: pos.y } : marker
        ),
      }));
    }

    if (isPanning) {
      const dx = e.clientX - panStart.x;
      const dy = e.clientY - panStart.y;
      setPanOffset((prev) => ({
        x: prev.x + dx,
        y: prev.y + dy,
      }));
      setPanStart({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseUp = () => {
    if (isDragging && draggedMarkerId) {
      addToHistory(frame.markerData);
    }
    setIsDragging(false);
    setDraggedMarkerId(null);
    setIsPanning(false);
  };

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (e.button === 1 || e.shiftKey) {
      setIsPanning(true);
      setPanStart({ x: e.clientX, y: e.clientY });
    }
  };

  const deleteMarker = (markerId: string) => {
    if (!markerId) return;
    addToHistory(frame.markerData.filter((m) => m.id !== markerId));
    setFrame((prev) => ({
      ...prev,
      markerData: prev.markerData.filter((m) => m.id !== markerId),
    }));
    setSelectedMarkerId(null);
  };

  const deleteAllMarkers = () => {
    if (frame.markerData.length === 0) return;
    if (!confirm('Are you sure you want to delete all markers?')) return;

    addToHistory([]);
    setFrame((prev) => ({ ...prev, markerData: [] }));
    setSelectedMarkerId(null);
    toast.info('All markers cleared');
  };

  const addToHistory = (markers: Marker[]) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(markers);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setFrame((prev) => ({ ...prev, markerData: history[historyIndex - 1] }));
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setFrame((prev) => ({ ...prev, markerData: history[historyIndex + 1] }));
    }
  };

  const generateClipPath = () => {
    if (frame.markerData.length < 3) {
      toast.error('Need at least 3 markers to generate a clip path');
      return;
    }

    let pathD = 'M';
    frame.markerData.forEach((marker, index) => {
      if (index === 0) {
        pathD += `${marker.x},${marker.y}`;
      } else if (marker.type === 'curve' && marker.controlX !== undefined && marker.controlY !== undefined) {
        const prev = frame.markerData[index - 1];
        pathD += ` C${prev.x},${prev.y} ${marker.controlX},${marker.controlY} ${marker.x},${marker.y}`;
      } else {
        pathD += ` L${marker.x},${marker.y}`;
      }
    });
    pathD += ' Z';

    setFrame((prev) => ({ ...prev, clipPathSvg: pathD }));
    toast.success('Clip path generated successfully!');
  };

  const handleSave = async () => {
    if (!frame.name.trim()) {
      toast.error('Please enter a frame name');
      return;
    }

    if (!frame.imageUrl) {
      toast.error('Please upload an image');
      return;
    }

    try {
      setLoading(true);

      const saveData = {
        name: frame.name.trim(),
        description: frame.description || null,
        imageUrl: frame.imageUrl,
        thumbnailUrl: frame.thumbnailUrl || frame.imageUrl,
        canvasWidth: frame.canvasWidth || 800,
        canvasHeight: frame.canvasHeight || 600,
        isPublic: frame.isPublic || false,
        markerData: frame.markerData || [],
        clipPathSvg: frame.clipPathSvg || null,
      };

      const url = frameId ? `/api/admin/frames/${frameId}` : '/api/admin/frames';
      const method = frameId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(saveData),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.error || responseData.details || 'Failed to save frame');
      }

      toast.success(frameId ? 'Frame updated successfully!' : 'Frame created successfully!');

      setTimeout(() => {
        router.push('/admin/designs/frames');
      }, 1500);
    } catch (error) {
      console.error('Error saving frame:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save frame');
    } finally {
      setLoading(false);
    }
  };

  const exportMarkers = () => {
    const data = {
      markers: frame.markerData,
      canvasWidth: frame.canvasWidth,
      canvasHeight: frame.canvasHeight,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `markers-${frame.name || 'frame'}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Markers exported successfully');
  };

  const importMarkers = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (data.markers && Array.isArray(data.markers)) {
          addToHistory(data.markers);
          setFrame((prev) => ({ ...prev, markerData: data.markers }));
          toast.success('Markers imported successfully');
        } else {
          toast.error('Invalid marker data');
        }
      } catch (error) {
        console.error('Import error:', error);
        toast.error('Failed to import markers');
      }
    };
    reader.readAsText(file);
  };

  if (isLoadingFrame) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Loading frame...</p>
        </div>
      </div>
    );
  }

  const hasMarkers = frame.markerData.length > 0;
  const canGenerateClip = frame.markerData.length >= 3;
  const selectedMarker = frame.markerData.find((m) => m.id === selectedMarkerId);

  return (
    <div className="h-full flex flex-col bg-white dark:bg-slate-950">
      {/* Top Toolbar */}
      <div className="flex items-center gap-2 p-2 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-sm flex-wrap flex-shrink-0">
        <Link href="/admin/designs/frames">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>

        <div className="flex-1 min-w-[120px]">
          <Input
            value={frame.name}
            onChange={(e) => setFrame({ ...frame, name: e.target.value })}
            placeholder="Frame name..."
            className="h-8 text-sm max-w-[200px] bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
          />
        </div>

        <Separator orientation="vertical" className="h-6 bg-slate-200 dark:bg-slate-700" />

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <Button
                variant="ghost"
                size="sm"
                onClick={undo}
                disabled={historyIndex <= 0}
                className="h-8 w-8 p-0"
              >
                <Undo2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Undo (Ctrl+Z)</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <Button
                variant="ghost"
                size="sm"
                onClick={redo}
                disabled={historyIndex >= history.length - 1}
                className="h-8 w-8 p-0"
              >
                <Redo2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Redo (Ctrl+Y)</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <Separator orientation="vertical" className="h-6 bg-slate-200 dark:bg-slate-700" />

        <div className="flex items-center gap-0.5 bg-slate-100 dark:bg-slate-800 rounded-md">
          <Button variant="ghost" size="sm" onClick={zoomOut} className="h-7 w-7 p-0">
            <ZoomOut className="h-3 w-3" />
          </Button>
          <span className="text-xs w-12 text-center font-mono text-slate-600 dark:text-slate-300">
            {Math.round(zoomLevel * 100)}%
          </span>
          <Button variant="ghost" size="sm" onClick={zoomIn} className="h-7 w-7 p-0">
            <ZoomIn className="h-3 w-3" />
          </Button>
          <Button variant="ghost" size="sm" onClick={zoomFit} className="h-7 w-7 p-0">
            <Maximize className="h-3 w-3" />
          </Button>
        </div>

        <Separator orientation="vertical" className="h-6 bg-slate-200 dark:bg-slate-700" />

        <div className="flex items-center gap-0.5 bg-slate-100 dark:bg-slate-800 rounded-md p-0.5">
          <Button
            variant={markerType === 'line' ? 'default' : 'ghost'}
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={() => setMarkerType('line')}
          >
            <MousePointer className="h-3 w-3 mr-1" />
            Line
          </Button>
          <Button
            variant={markerType === 'curve' ? 'default' : 'ghost'}
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={() => setMarkerType('curve')}
          >
            <Move className="h-3 w-3 mr-1" />
            Curve
          </Button>
        </div>

        <Separator orientation="vertical" className="h-6 bg-slate-200 dark:bg-slate-700" />

        <div className="flex items-center gap-1">
          <Button
            variant={showGrid ? 'default' : 'ghost'}
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={() => setShowGrid(!showGrid)}
          >
            <Grid3x3 className="h-3 w-3 mr-1" />
            Grid
          </Button>
          <Button
            variant={snapToGrid ? 'default' : 'ghost'}
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={() => setSnapToGrid(!snapToGrid)}
          >
            <Square className="h-3 w-3 mr-1" />
            Snap
          </Button>
          <Button
            variant={showClipPath ? 'default' : 'ghost'}
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={() => setShowClipPath(!showClipPath)}
          >
            {showClipPath ? <Eye className="h-3 w-3 mr-1" /> : <EyeOff className="h-3 w-3 mr-1" />}
            Path
          </Button>
        </div>

        <Separator orientation="vertical" className="h-6 bg-slate-200 dark:bg-slate-700" />

        <div className="flex items-center gap-0.5">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={exportMarkers}
            disabled={!hasMarkers}
          >
            <FileDown className="h-3 w-3 mr-1" />
            Export
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={() => document.getElementById('import-markers')?.click()}
          >
            <FileUp className="h-3 w-3 mr-1" />
            Import
          </Button>
          <input
            id="import-markers"
            type="file"
            accept=".json"
            className="hidden"
            onChange={importMarkers}
          />
        </div>

        <div className="flex-1" />

        <div className="flex items-center gap-1">
          <Button
            variant="destructive"
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={deleteAllMarkers}
            disabled={!hasMarkers}
          >
            <Trash2 className="h-3 w-3 mr-1" />
            Clear All
          </Button>
          <Button
            size="sm"
            className="h-7 px-3 text-xs"
            onClick={generateClipPath}
            disabled={!canGenerateClip || !frame.imageUrl}
          >
            <FrameIcon className="h-3 w-3 mr-1" />
            Generate Path
          </Button>
          <Button
            size="sm"
            className="h-7 px-3 text-xs"
            onClick={handleSave}
            disabled={loading || !frame.imageUrl}
          >
            {loading ? (
              <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
            ) : (
              <Save className="h-3 w-3 mr-1" />
            )}
            {loading ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Canvas Area */}
        <div className="flex-1 relative overflow-hidden bg-slate-100 dark:bg-slate-900/50" ref={containerRef}>
          <div
            ref={canvasRef}
            className="w-full h-full relative"
            onClick={handleCanvasClick}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onMouseDown={handleCanvasMouseDown}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            style={{
              cursor: isPanning ? 'grabbing' : isDragging ? 'move' : 'crosshair',
            }}
          >
            {!frame.imageUrl ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 dark:text-slate-600">
                <div className="text-center p-8 max-w-md">
                  <ImageIcon className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium text-slate-600 dark:text-slate-400">
                    No Image Uploaded
                  </p>
                  <p className="text-sm mt-2">
                    Upload an image to start creating your frame markers
                  </p>
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Image
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                </div>
              </div>
            ) : (
              <div
                className="absolute"
                style={{
                  transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomLevel})`,
                  transformOrigin: 'center center',
                  width: '100%',
                  height: '100%',
                }}
              >
                <div className="relative w-full h-full flex items-center justify-center">
                  <img
                    ref={imageRef}
                    src={frame.imageUrl}
                    alt="Frame"
                    className="max-w-full max-h-full object-contain select-none pointer-events-none"
                    style={{
                      width: 'auto',
                      height: 'auto',
                      maxWidth: '100%',
                      maxHeight: '100%',
                    }}
                    onLoad={() => setImageLoaded(true)}
                  />

                  {/* Grid overlay */}
                  {showGrid && (
                    <svg
                      className="absolute inset-0 w-full h-full pointer-events-none"
                      style={{ opacity: 0.3 }}
                    >
                      <defs>
                        <pattern
                          id="grid"
                          width={gridSize * zoomLevel}
                          height={gridSize * zoomLevel}
                          patternUnits="userSpaceOnUse"
                        >
                          <path
                            d={`M ${gridSize * zoomLevel} 0 L 0 0 0 ${gridSize * zoomLevel}`}
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="0.5"
                            className="text-slate-500"
                          />
                        </pattern>
                      </defs>
                      <rect width="100%" height="100%" fill="url(#grid)" />
                    </svg>
                  )}

                  {/* Clip path preview */}
                  {showClipPath && frame.clipPathSvg && (
                    <svg
                      className="absolute inset-0 w-full h-full pointer-events-none"
                      style={{ opacity: 0.15 }}
                    >
                      <defs>
                        <clipPath id="clipPreview">
                          <path d={frame.clipPathSvg} />
                        </clipPath>
                      </defs>
                      <rect
                        width="100%"
                        height="100%"
                        fill="rgba(59, 130, 246, 0.3)"
                        clipPath="url(#clipPreview)"
                      />
                    </svg>
                  )}

                  {/* Markers */}
                  {frame.markerData.map((marker, index) => {
                    const isSelected = marker.id === selectedMarkerId;
                    const isHovered = marker.id === hoveredMarkerId;

                    return (
                      <div
                        key={marker.id}
                        className="absolute"
                        style={{
                          left: `${(marker.x / frame.canvasWidth) * 100}%`,
                          top: `${(marker.y / frame.canvasHeight) * 100}%`,
                          transform: 'translate(-50%, -50%)',
                          cursor: 'grab',
                          zIndex: isSelected ? 10 : isHovered ? 9 : 1,
                        }}
                        onMouseDown={(e) => handleMarkerMouseDown(e, marker.id)}
                        onMouseEnter={() => setHoveredMarkerId(marker.id)}
                        onMouseLeave={() => setHoveredMarkerId(null)}
                      >
                        <div
                          className={`w-4 h-4 rounded-full border-2 transition-all ${
                            isSelected
                              ? 'bg-blue-500 border-blue-700 ring-2 ring-blue-300 w-5 h-5'
                              : isHovered
                              ? 'bg-blue-400 border-blue-600 w-5 h-5'
                              : 'bg-red-500 border-red-700'
                          }`}
                        >
                          <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-[8px] font-bold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 px-1 rounded">
                            {index + 1}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar */}
        <div
          className={`bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 flex flex-col transition-all duration-300 ${
            sidebarCollapsed ? 'w-10' : 'w-64'
          }`}
        >
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 m-1 self-end"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          >
            {sidebarCollapsed ? <Maximize className="h-4 w-4" /> : <Minimize className="h-4 w-4" />}
          </Button>

          {!sidebarCollapsed && (
            <>
              <ScrollArea className="flex-1 px-3 pb-3">
                <div className="space-y-4">
                  <div>
                    <Label className="text-xs">Description</Label>
                    <Textarea
                      value={frame.description || ''}
                      onChange={(e) => setFrame({ ...frame, description: e.target.value })}
                      placeholder="Frame description..."
                      className="text-xs mt-1 h-20 resize-none"
                    />
                  </div>

                  <Separator />

                  <div>
                    <div className="flex items-center justify-between">
                      <Label className="text-xs">Public</Label>
                      <Switch
                        checked={frame.isPublic}
                        onCheckedChange={(checked) => setFrame({ ...frame, isPublic: checked })}
                      />
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <Label className="text-xs">Canvas Size</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Input
                        value={frame.canvasWidth}
                        onChange={(e) =>
                          setFrame({ ...frame, canvasWidth: parseInt(e.target.value) || 800 })
                        }
                        className="text-xs h-7 w-20"
                        type="number"
                      />
                      <span className="text-xs text-slate-500 dark:text-slate-400">×</span>
                      <Input
                        value={frame.canvasHeight}
                        onChange={(e) =>
                          setFrame({ ...frame, canvasHeight: parseInt(e.target.value) || 600 })
                        }
                        className="text-xs h-7 w-20"
                        type="number"
                      />
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <Label className="text-xs">Markers ({frame.markerData.length})</Label>
                    <div className="mt-1 space-y-1 max-h-40 overflow-y-auto">
                      {frame.markerData.length === 0 ? (
                        <p className="text-xs text-slate-400 dark:text-slate-500">
                          Click on the image to add markers
                        </p>
                      ) : (
                        frame.markerData.map((marker, index) => (
                          <div
                            key={marker.id}
                            className={`flex items-center justify-between p-1 rounded cursor-pointer transition-colors ${
                              selectedMarkerId === marker.id
                                ? 'bg-blue-100 dark:bg-blue-900/30'
                                : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                            }`}
                            onClick={() => setSelectedMarkerId(marker.id)}
                          >
                            <span className="text-xs">
                              #{index + 1} ({Math.round(marker.x)}, {Math.round(marker.y)})
                            </span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-5 w-5 p-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteMarker(marker.id);
                              }}
                            >
                              <X className="h-3 w-3 text-red-500" />
                            </Button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Fixed: Selected Marker section with proper null checks */}
                  {selectedMarker && (
                    <>
                      <Separator />
                      <div>
                        <Label className="text-xs">Selected Marker</Label>
                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 space-y-1">
                          <p>ID: {selectedMarker.id}</p>
                          <p>Type: {selectedMarker.type}</p>
                          <p>X: {Math.round(selectedMarker.x)}</p>
                          <p>Y: {Math.round(selectedMarker.y)}</p>
                          {selectedMarker.controlX !== undefined && selectedMarker.controlY !== undefined && (
                            <p>Control: ({Math.round(selectedMarker.controlX)}, {Math.round(selectedMarker.controlY)})</p>
                          )}
                        </div>
                      </div>
                    </>
                  )}

                  {frame.clipPathSvg && (
                    <>
                      <Separator />
                      <div>
                        <Label className="text-xs">Clip Path</Label>
                        <div className="mt-1 p-2 bg-slate-100 dark:bg-slate-800 rounded text-[8px] font-mono overflow-auto max-h-20">
                          {frame.clipPathSvg}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </ScrollArea>

              <div className="p-3 border-t border-slate-200 dark:border-slate-800">
                <Button
                  variant="outline"
                  className="w-full text-xs h-8 border-slate-200 dark:border-slate-700"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-3 w-3 mr-1" />
                  {frame.imageUrl ? 'Change Image' : 'Upload Image'}
                </Button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Bottom Status Bar */}
      <div className="flex items-center gap-4 px-4 py-1 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 text-[10px] text-slate-500 dark:text-slate-400 flex-shrink-0">
        <span>Markers: {frame.markerData.length}</span>
        <span className="text-slate-300 dark:text-slate-700">|</span>
        <span>Zoom: {Math.round(zoomLevel * 100)}%</span>
        <span className="text-slate-300 dark:text-slate-700">|</span>
        <span>Canvas: {frame.canvasWidth} × {frame.canvasHeight}</span>
        <span className="text-slate-300 dark:text-slate-700">|</span>
        <span>History: {historyIndex + 1}/{history.length}</span>
        <span className="text-slate-300 dark:text-slate-700">|</span>
        <span>Mode: {markerType === 'line' ? 'Line' : 'Curve'}</span>
        {snapToGrid && (
          <>
            <span className="text-slate-300 dark:text-slate-700">|</span>
            <span className="text-blue-500 dark:text-blue-400">Snap: ON</span>
          </>
        )}
        {selectedMarker && (
          <>
            <span className="text-slate-300 dark:text-slate-700">|</span>
            <span className="text-blue-500 dark:text-blue-400">
              Selected: #{frame.markerData.indexOf(selectedMarker) + 1}
            </span>
          </>
        )}
      </div>
    </div>
  );
}

// Main export with Suspense boundary
export default function FrameEditorPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Loading editor...</p>
        </div>
      </div>
    }>
      <FrameEditorContent />
    </Suspense>
  );
}