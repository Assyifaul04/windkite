// app/admin/designs/frames/editor/page.tsx
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
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
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Save,
  Upload,
  X,
  RotateCcw,
  Redo,
  Trash2,
  MousePointer,
  Move,
  Image as ImageIcon,
  FrameIcon,
  Plus,
  Minus,
  ZoomIn,
  ZoomOut,
  RefreshCw,
  Download,
  Check,
  AlertCircle,
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
  canvasWidth: number;
  canvasHeight: number;
  isPublic: boolean;
  markerData: Marker[];
  clipPathSvg: string | null;
}

export default function FrameEditorPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const frameId = searchParams.get('id');
  const copyFrom = searchParams.get('copy');
  
  const canvasRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [loading, setLoading] = useState(false);
  const [isLoadingFrame, setIsLoadingFrame] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedMarkerId, setDraggedMarkerId] = useState<string | null>(null);
  const [selectedMarkerId, setSelectedMarkerId] = useState<string | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });
  const [zoomLevel, setZoomLevel] = useState(1);
  const [showGrid, setShowGrid] = useState(false);
  const [markerType, setMarkerType] = useState<'line' | 'curve'>('line');
  const [history, setHistory] = useState<Marker[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const [frame, setFrame] = useState<FrameData>({
    name: '',
    description: '',
    imageUrl: '',
    canvasWidth: 800,
    canvasHeight: 600,
    isPublic: false,
    markerData: [],
    clipPathSvg: null,
  });

  // Load frame data if editing
  useEffect(() => {
    if (frameId) {
      loadFrame(frameId);
    } else if (copyFrom) {
      loadFrame(copyFrom, true);
    }
  }, [frameId, copyFrom]);

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
          markerData: data.markerData || [],
          clipPathSvg: data.clipPathSvg || null,
        });
        toast.success('Frame duplicated successfully');
      } else {
        setFrame({
          ...data,
          markerData: data.markerData || [],
          clipPathSvg: data.clipPathSvg || null,
        });
      }
    } catch (error) {
      console.error('Error loading frame:', error);
      toast.error('Failed to load frame');
    } finally {
      setIsLoadingFrame(false);
    }
  };

  // Handle image upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      toast.error('Image size must be less than 10MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const imageUrl = event.target?.result as string;
      setFrame(prev => ({ ...prev, imageUrl }));
      
      // Get image dimensions
      const img = new window.Image();
      img.onload = () => {
        setImageDimensions({ width: img.width, height: img.height });
        setFrame(prev => ({
          ...prev,
          canvasWidth: img.width,
          canvasHeight: img.height,
        }));
        setImageLoaded(true);
        toast.success('Image uploaded successfully');
      };
      img.src = imageUrl;
    };
    reader.readAsDataURL(file);
  };

  // Handle drag and drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const imageUrl = event.target?.result as string;
        setFrame(prev => ({ ...prev, imageUrl }));
        const img = new window.Image();
        img.onload = () => {
          setImageDimensions({ width: img.width, height: img.height });
          setFrame(prev => ({
            ...prev,
            canvasWidth: img.width,
            canvasHeight: img.height,
          }));
          setImageLoaded(true);
          toast.success('Image uploaded successfully');
        };
        img.src = imageUrl;
      };
      reader.readAsDataURL(file);
    }
  };

  // Get marker position relative to image
  const getMarkerPosition = (e: React.MouseEvent) => {
    if (!canvasRef.current || !imageRef.current) return null;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const imageRect = imageRef.current.getBoundingClientRect();
    
    // Calculate position relative to image
    const x = ((e.clientX - imageRect.left) / imageRect.width) * frame.canvasWidth;
    const y = ((e.clientY - imageRect.top) / imageRect.height) * frame.canvasHeight;
    
    // Clamp to image bounds
    return {
      x: Math.max(0, Math.min(frame.canvasWidth, x)),
      y: Math.max(0, Math.min(frame.canvasHeight, y)),
    };
  };

  // Add marker on click
  const handleCanvasClick = (e: React.MouseEvent) => {
    if (!frame.imageUrl || !imageLoaded) return;
    
    const pos = getMarkerPosition(e);
    if (!pos) return;

    const newMarker: Marker = {
      id: `marker-${Date.now()}`,
      x: pos.x,
      y: pos.y,
      type: markerType,
    };

    // For curve, add control points
    if (markerType === 'curve' && frame.markerData.length > 0) {
      const lastMarker = frame.markerData[frame.markerData.length - 1];
      newMarker.controlX = (lastMarker.x + pos.x) / 2;
      newMarker.controlY = (lastMarker.y + pos.y) / 2 - 50;
    }

    addToHistory([...frame.markerData, newMarker]);
    setFrame(prev => ({
      ...prev,
      markerData: [...prev.markerData, newMarker],
    }));
  };

  // Handle marker drag
  const handleMarkerMouseDown = (e: React.MouseEvent, markerId: string) => {
    e.stopPropagation();
    setIsDragging(true);
    setDraggedMarkerId(markerId);
    setSelectedMarkerId(markerId);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    setMousePosition({ x: e.clientX, y: e.clientY });
    
    if (isDragging && draggedMarkerId) {
      const pos = getMarkerPosition(e);
      if (!pos) return;

      setFrame(prev => ({
        ...prev,
        markerData: prev.markerData.map(marker =>
          marker.id === draggedMarkerId
            ? { ...marker, x: pos.x, y: pos.y }
            : marker
        ),
      }));
    }
  };

  const handleMouseUp = () => {
    if (isDragging && draggedMarkerId) {
      // Save state to history
      addToHistory(frame.markerData);
    }
    setIsDragging(false);
    setDraggedMarkerId(null);
  };

  // Delete marker
  const deleteMarker = (markerId: string) => {
    addToHistory(frame.markerData.filter(m => m.id !== markerId));
    setFrame(prev => ({
      ...prev,
      markerData: prev.markerData.filter(m => m.id !== markerId),
    }));
    setSelectedMarkerId(null);
  };

  const deleteAllMarkers = () => {
    addToHistory([]);
    setFrame(prev => ({ ...prev, markerData: [] }));
    setSelectedMarkerId(null);
    toast.info('All markers cleared');
  };

  // History (Undo/Redo)
  const addToHistory = (markers: Marker[]) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(markers);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setFrame(prev => ({ ...prev, markerData: history[historyIndex - 1] }));
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setFrame(prev => ({ ...prev, markerData: history[historyIndex + 1] }));
    }
  };

  // Generate clip path SVG
  const generateClipPath = () => {
    if (frame.markerData.length < 3) {
      toast.error('Need at least 3 markers to generate a clip path');
      return;
    }

    let pathD = 'M';
    frame.markerData.forEach((marker, index) => {
      if (index === 0) {
        pathD += `${marker.x},${marker.y}`;
      } else if (marker.type === 'curve' && marker.controlX !== undefined) {
        const prev = frame.markerData[index - 1];
        pathD += ` C${prev.x},${prev.y} ${marker.controlX},${marker.controlY} ${marker.x},${marker.y}`;
      } else {
        pathD += ` L${marker.x},${marker.y}`;
      }
    });
    pathD += ' Z';

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${frame.canvasWidth}" height="${frame.canvasHeight}" viewBox="0 0 ${frame.canvasWidth} ${frame.canvasHeight}">
      <defs>
        <clipPath id="frame-clip">
          <path d="${pathD}" />
        </clipPath>
      </defs>
      <rect width="${frame.canvasWidth}" height="${frame.canvasHeight}" fill="black" clip-path="url(#frame-clip)" />
    </svg>`;

    setFrame(prev => ({ ...prev, clipPathSvg: pathD }));
    toast.success('Clip path generated successfully!');
  };

  // Save frame
const handleSave = async () => {
  // Validasi
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
    
    // Data yang akan dikirim
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

    console.log('Saving data:', saveData); // Debug log

    const url = frameId ? `/api/admin/frames/${frameId}` : '/api/admin/frames';
    const method = frameId ? 'PUT' : 'POST';
    
    const response = await fetch(url, {
      method,
      headers: { 
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(saveData),
    });

    // Baca response
    const responseData = await response.json();
    
    if (!response.ok) {
      console.error('Server error:', responseData);
      throw new Error(responseData.error || responseData.details || 'Failed to save frame');
    }
    
    toast.success(frameId ? 'Frame updated successfully!' : 'Frame created successfully!');
    
    // Redirect setelah sukses
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

  // Generate SVG path for preview
  const generatePathString = () => {
    if (frame.markerData.length < 2) return null;
    
    let pathD = 'M';
    frame.markerData.forEach((marker, index) => {
      if (index === 0) {
        pathD += `${(marker.x / frame.canvasWidth) * 100},${(marker.y / frame.canvasHeight) * 100}`;
      } else if (marker.type === 'curve' && marker.controlX !== undefined) {
        const prev = frame.markerData[index - 1];
        pathD += ` C${(prev.x / frame.canvasWidth) * 100},${(prev.y / frame.canvasHeight) * 100} ${(marker.controlX / frame.canvasWidth) * 100},${(marker.controlY / frame.canvasHeight) * 100} ${(marker.x / frame.canvasWidth) * 100},${(marker.y / frame.canvasHeight) * 100}`;
      } else {
        pathD += ` L${(marker.x / frame.canvasWidth) * 100},${(marker.y / frame.canvasHeight) * 100}`;
      }
    });
    return pathD;
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

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link href="/admin/designs/frames">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1 min-w-[200px]">
          <h1 className="text-xl font-bold">
            {frameId ? 'Edit Frame' : 'Create New Frame'}
          </h1>
          <p className="text-sm text-muted-foreground">
            Upload image and add markers to create clipping path
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={undo} disabled={historyIndex <= 0}>
            <RotateCcw className="h-4 w-4 mr-1" />
            Undo
          </Button>
          <Button variant="outline" size="sm" onClick={redo} disabled={historyIndex >= history.length - 1}>
            <Redo className="h-4 w-4 mr-1" />
            Redo
          </Button>
          <Button onClick={handleSave} disabled={loading || !frame.imageUrl}>
            <Save className="h-4 w-4 mr-1" />
            {loading ? 'Saving...' : 'Save Frame'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
        {/* Left Panel - Form */}
        <div className="xl:col-span-1 space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Frame Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="name" className="text-xs">Frame Name *</Label>
                <Input
                  id="name"
                  value={frame.name}
                  onChange={(e) => setFrame({ ...frame, name: e.target.value })}
                  placeholder="Enter frame name"
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="description" className="text-xs">Description</Label>
                <Textarea
                  id="description"
                  value={frame.description}
                  onChange={(e) => setFrame({ ...frame, description: e.target.value })}
                  placeholder="Enter description"
                  rows={2}
                  className="text-sm"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="isPublic"
                  checked={frame.isPublic}
                  onCheckedChange={(checked) => setFrame({ ...frame, isPublic: checked })}
                />
                <Label htmlFor="isPublic" className="text-xs">Make frame public</Label>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Image Upload</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div
                className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:border-primary transition-colors"
                onClick={() => fileInputRef.current?.click()}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                />
                {frame.imageUrl ? (
                  <div className="relative">
                    <div className="relative w-full h-32 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800">
                      <Image
                        src={frame.imageUrl}
                        alt="Frame"
                        fill
                        className="object-contain"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Click to change image
                    </p>
                    <Badge className="absolute top-1 right-1 bg-green-500/90 text-white">
                      <Check className="h-3 w-3 mr-1" />
                      Uploaded
                    </Badge>
                  </div>
                ) : (
                  <div>
                    <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm font-medium">Upload Image</p>
                    <p className="text-xs text-muted-foreground">
                      Drag & drop or click to browse
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      JPG, PNG, WEBP (Max 10MB)
                    </p>
                  </div>
                )}
              </div>
              {frame.imageUrl && (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => {
                      setFrame(prev => ({ ...prev, imageUrl: '' }));
                      setImageLoaded(false);
                    }}
                  >
                    <X className="h-3 w-3 mr-1" />
                    Remove
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => {
                      // Download current image
                      const link = document.createElement('a');
                      link.href = frame.imageUrl;
                      link.download = `frame-${frame.name || 'image'}`;
                      link.target = '_blank';
                      link.click();
                    }}
                  >
                    <Download className="h-3 w-3 mr-1" />
                    Download
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Canvas Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs">Width</Label>
                  <Input
                    type="number"
                    value={frame.canvasWidth}
                    onChange={(e) => setFrame({ ...frame, canvasWidth: parseInt(e.target.value) || 800 })}
                    className="h-8 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Height</Label>
                  <Input
                    type="number"
                    value={frame.canvasHeight}
                    onChange={(e) => setFrame({ ...frame, canvasHeight: parseInt(e.target.value) || 600 })}
                    className="h-8 text-sm"
                  />
                </div>
              </div>
              {imageLoaded && (
                <p className="text-xs text-muted-foreground mt-2">
                  Image: {imageDimensions.width} × {imageDimensions.height}
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Center Panel - Canvas */}
        <div className="xl:col-span-2 space-y-4">
          <Card>
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm">Marker Editor</CardTitle>
                <CardDescription className="text-xs">
                  Click on image to add markers • Drag to reposition
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <Button
                    variant={markerType === 'line' ? 'default' : 'outline'}
                    size="sm"
                    className="h-7 px-2 text-xs"
                    onClick={() => setMarkerType('line')}
                  >
                    <MousePointer className="h-3 w-3 mr-1" />
                    Line
                  </Button>
                  <Button
                    variant={markerType === 'curve' ? 'default' : 'outline'}
                    size="sm"
                    className="h-7 px-2 text-xs"
                    onClick={() => setMarkerType('curve')}
                  >
                    <Move className="h-3 w-3 mr-1" />
                    Curve
                  </Button>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 px-2 text-xs"
                    onClick={() => setShowGrid(!showGrid)}
                  >
                    {showGrid ? 'Hide Grid' : 'Show Grid'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 px-2 text-xs text-red-600 hover:text-red-700"
                    onClick={deleteAllMarkers}
                    disabled={frame.markerData.length === 0}
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    Clear All
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div
                ref={canvasRef}
                className="relative bg-slate-100 dark:bg-slate-800 rounded-lg overflow-hidden"
                style={{
                  aspectRatio: `${frame.canvasWidth}/${frame.canvasHeight}`,
                  maxHeight: '70vh',
                }}
                onClick={handleCanvasClick}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
              >
                {frame.imageUrl ? (
                  <>
                    <Image
                      ref={imageRef}
                      src={frame.imageUrl}
                      alt={frame.name || 'Frame'}
                      fill
                      className="object-contain select-none"
                      onLoad={() => {
                        setImageLoaded(true);
                      }}
                    />

                    {/* Grid overlay */}
                    {showGrid && (
                      <div className="absolute inset-0 pointer-events-none">
                        <svg width="100%" height="100%" className="absolute inset-0">
                          <defs>
                            <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="0.5" />
                            </pattern>
                          </defs>
                          <rect width="100%" height="100%" fill="url(#grid)" />
                        </svg>
                      </div>
                    )}

                    {/* SVG overlay for markers and clip path */}
                    <svg
                      className="absolute inset-0 w-full h-full pointer-events-none"
                      viewBox={`0 0 ${frame.canvasWidth} ${frame.canvasHeight}`}
                      preserveAspectRatio="xMidYMid meet"
                    >
                      {/* Clip path preview */}
                      {frame.clipPathSvg && frame.markerData.length >= 3 && (
                        <path
                          d={frame.clipPathSvg}
                          fill="rgba(59, 130, 246, 0.15)"
                          stroke="rgba(59, 130, 246, 0.5)"
                          strokeWidth="2"
                          strokeDasharray="5,5"
                        />
                      )}

                      {/* Connection lines between markers */}
                      {frame.markerData.length >= 2 && (
                        <polyline
                          points={frame.markerData.map(m => `${m.x},${m.y}`).join(' ')}
                          fill="none"
                          stroke="rgba(59, 130, 246, 0.4)"
                          strokeWidth="2"
                          strokeDasharray="4,4"
                        />
                      )}

                      {/* Markers */}
                      {frame.markerData.map((marker) => (
                        <g
                          key={marker.id}
                          className="cursor-move pointer-events-auto"
                          onMouseDown={(e) => handleMarkerMouseDown(e, marker.id)}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <circle
                            cx={marker.x}
                            cy={marker.y}
                            r={selectedMarkerId === marker.id ? 10 : 8}
                            fill={selectedMarkerId === marker.id ? '#3b82f6' : '#ef4444'}
                            stroke="#ffffff"
                            strokeWidth="2"
                            opacity={0.9}
                          />
                          {selectedMarkerId === marker.id && (
                            <circle
                              cx={marker.x}
                              cy={marker.y}
                              r={14}
                              fill="none"
                              stroke="#3b82f6"
                              strokeWidth="2"
                              opacity={0.4}
                            />
                          )}
                          {/* Control point for curve */}
                          {marker.type === 'curve' && marker.controlX !== undefined && (
                            <>
                              <line
                                x1={marker.x}
                                y1={marker.y}
                                x2={marker.controlX}
                                y2={marker.controlY}
                                stroke="rgba(255, 165, 0, 0.5)"
                                strokeWidth="1.5"
                                strokeDasharray="3,3"
                              />
                              <circle
                                cx={marker.controlX}
                                cy={marker.controlY}
                                r={4}
                                fill="#ff8c00"
                                stroke="#ffffff"
                                strokeWidth="1"
                              />
                            </>
                          )}
                          {/* Marker number */}
                          <text
                            x={marker.x + 12}
                            y={marker.y - 8}
                            fill="#ffffff"
                            fontSize="12"
                            fontWeight="bold"
                            className="pointer-events-none"
                            style={{ textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}
                          >
                            {frame.markerData.indexOf(marker) + 1}
                          </text>
                        </g>
                      ))}
                    </svg>

                    {/* Empty state overlay */}
                    {frame.markerData.length === 0 && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="text-center p-4 bg-black/50 rounded-lg">
                          <MousePointer className="h-8 w-8 text-white/60 mx-auto mb-2" />
                          <p className="text-white/80 text-sm font-medium">
                            Click anywhere on the image to add markers
                          </p>
                          <p className="text-white/60 text-xs mt-1">
                            Add at least 3 markers to create a clipping path
                          </p>
                          <div className="flex gap-2 justify-center mt-2">
                            <Badge variant="outline" className="text-white/80 border-white/30">
                              {frame.markerData.length} markers
                            </Badge>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Controls overlay */}
                    <div className="absolute bottom-2 left-2 flex gap-1">
                      <Badge variant="secondary" className="text-xs">
                        {frame.markerData.length} markers
                      </Badge>
                      {frame.clipPathSvg && (
                        <Badge variant="default" className="text-xs bg-green-500/90">
                          <Check className="h-3 w-3 mr-1" />
                          Clip path ready
                        </Badge>
                      )}
                    </div>

                    {/* Delete marker button (appears when selected) */}
                    {selectedMarkerId && (
                      <Button
                        variant="destructive"
                        size="sm"
                        className="absolute top-2 right-2 h-7 w-7 p-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteMarker(selectedMarkerId);
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center p-8">
                      <ImageIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground font-medium">
                        No image uploaded
                      </p>
                      <p className="text-muted-foreground text-sm">
                        Upload an image to start adding markers
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Controls */}
              <div className="flex flex-wrap items-center justify-between gap-2 mt-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Marker Mode:</span>
                  <Badge variant={markerType === 'line' ? 'default' : 'outline'}>
                    {markerType === 'line' ? 'Line' : 'Curve'}
                  </Badge>
                  <span className="text-xs text-muted-foreground ml-1">
                    {markerType === 'line' 
                      ? 'Click to add straight line points' 
                      : 'Click to add curved points (with control points)'}
                  </span>
                </div>
                <Button
                  size="sm"
                  onClick={generateClipPath}
                  disabled={frame.markerData.length < 3 || !frame.imageUrl}
                >
                  <FrameIcon className="h-4 w-4 mr-1" />
                  Generate Clip Path
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Panel - Preview & Info */}
        <div className="xl:col-span-1 space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Clip Path Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative aspect-square bg-slate-100 dark:bg-slate-800 rounded-lg overflow-hidden">
                {frame.clipPathSvg && frame.imageUrl ? (
                  <div className="relative w-full h-full">
                    <Image
                      src={frame.imageUrl}
                      alt="Preview"
                      fill
                      className="object-contain"
                      style={{
                        clipPath: `polygon(${frame.markerData.map(m => 
                          `${(m.x / frame.canvasWidth) * 100}% ${(m.y / frame.canvasHeight) * 100}%`
                        ).join(', ')})`,
                      }}
                    />
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-xs text-muted-foreground">
                        {frame.markerData.length < 3 
                          ? `Need ${3 - frame.markerData.length} more markers` 
                          : 'Generate clip path to preview'}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Marker List</CardTitle>
            </CardHeader>
            <CardContent className="max-h-[200px] overflow-y-auto">
              {frame.markerData.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">
                  No markers added yet
                </p>
              ) : (
                <div className="space-y-1">
                  {frame.markerData.map((marker, index) => (
                    <div
                      key={marker.id}
                      className={`flex items-center justify-between p-1.5 rounded text-xs cursor-pointer transition-colors ${
                        selectedMarkerId === marker.id
                          ? 'bg-primary/10 border border-primary/30'
                          : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                      onClick={() => setSelectedMarkerId(marker.id)}
                    >
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="w-5 h-5 p-0 flex items-center justify-center text-xs">
                          {index + 1}
                        </Badge>
                        <span>
                          ({Math.round(marker.x)}, {Math.round(marker.y)})
                        </span>
                        {marker.type === 'curve' && (
                          <Badge variant="secondary" className="text-[10px]">curve</Badge>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-5 w-5 p-0 text-red-500 hover:text-red-600"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteMarker(marker.id);
                        }}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Clip Path SVG</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-slate-100 dark:bg-slate-800 rounded p-2 max-h-[100px] overflow-auto">
                {frame.clipPathSvg ? (
                  <code className="text-[10px] font-mono break-all text-muted-foreground">
                    {frame.clipPathSvg}
                  </code>
                ) : (
                  <p className="text-xs text-muted-foreground text-center py-2">
                    No clip path generated
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Instructions Modal (optional) */}
      <Card className="border-dashed border-primary/20">
        <CardContent className="p-3">
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 bg-red-500 rounded-full border border-white" />
              <span>Click to add marker</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 bg-blue-500 rounded-full border-2 border-white" />
              <span>Selected marker</span>
            </div>
            <div className="flex items-center gap-1">
              <svg className="w-4 h-4" viewBox="0 0 20 20">
                <path d="M2,18 L18,2" stroke="#ff8c00" strokeWidth="2" strokeDasharray="3,3" />
                <circle cx="16" cy="4" r="3" fill="#ff8c00" />
              </svg>
              <span>Curve control point</span>
            </div>
            <div className="flex items-center gap-1">
              <FrameIcon className="h-4 w-4 text-blue-500" />
              <span>Generated clip path</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}