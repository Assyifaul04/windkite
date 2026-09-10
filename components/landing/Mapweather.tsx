// components/landing/Mapweather.tsx
'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useTheme } from 'next-themes';
import {
  Wind, Thermometer, Cloud, CloudRain, Gauge, Search, X, Loader2,
  AlertCircle, LocateFixed, Layers, Droplets, Compass, MapPin, Plus, Minus,
} from 'lucide-react';

// ==========================================================================
// Types
// ==========================================================================
type KiteSuitability = 'TIDAK_LAYAK' | 'RINGAN' | 'BERAT' | 'SEMUA';
type LayerKey = 'wind' | 'temp' | 'clouds' | 'precipitation' | 'pressure';

interface PointWeather {
  lat: number;
  lon: number;
  name: string;
  temperature: number | null;
  humidity: number | null;
  pressure: number | null;
  windSpeed: number;
  windGust: number;
  windDirection: number;
  suitability: KiteSuitability;
  updatedAt: string;
}

interface GeocodeResult {
  name: string;
  state?: string;
  country: string;
  lat: number;
  lon: number;
}

interface MapWeatherProps {
  className?: string;
  initialCenter?: { lat: number; lon: number; zoom?: number };
  onSelectLocation?: (loc: { name: string; latitude: number; longitude: number }) => void;
}

// ==========================================================================
// Konstanta & util
// ==========================================================================
const OWM_API_KEY = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY || '';

const LAYER_CONFIG: Record<LayerKey, { code: string; label: string; icon: typeof Wind; legend: string[]; unit: string }> = {
  wind: { code: 'wind_new', label: 'Angin', icon: Wind, legend: ['#bfdbfe', '#60a5fa', '#2563eb', '#1e3a8a'], unit: 'm/s' },
  temp: { code: 'temp_new', label: 'Suhu', icon: Thermometer, legend: ['#60a5fa', '#facc15', '#fb923c', '#ef4444'], unit: '°C' },
  clouds: { code: 'clouds_new', label: 'Awan', icon: Cloud, legend: ['#f4f4f5', '#a1a1aa', '#52525b', '#27272a'], unit: '%' },
  precipitation: { code: 'precipitation_new', label: 'Hujan', icon: CloudRain, legend: ['#bfdbfe', '#3b82f6', '#4338ca', '#312e81'], unit: 'mm' },
  pressure: { code: 'pressure_new', label: 'Tekanan', icon: Gauge, legend: ['#c4b5fd', '#818cf8', '#4f46e5', '#3730a3'], unit: 'hPa' },
};

const LAYER_ORDER: LayerKey[] = ['wind', 'temp', 'clouds', 'precipitation', 'pressure'];

const BASE_TILES = {
  light: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
  dark: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
};

const DEFAULT_CENTER = { lat: -8.18, lon: 113.67, zoom: 7 };

function classifyKiteSuitability(windSpeedMs: number): KiteSuitability {
  const kmh = windSpeedMs * 3.6;
  if (kmh < 6) return 'TIDAK_LAYAK';
  if (kmh < 14) return 'RINGAN';
  if (kmh < 24) return 'BERAT';
  return 'SEMUA';
}

const suitabilityMeta: Record<KiteSuitability, { label: string; className: string; icon: string }> = {
  TIDAK_LAYAK: { label: 'Tidak layak', className: 'bg-zinc-900/5 text-zinc-700 dark:text-zinc-300 dark:bg-white/5 border-zinc-400/30', icon: '❌' },
  RINGAN: { label: 'Layangan ringan', className: 'bg-blue-400/10 text-blue-500 dark:text-blue-300 border-blue-400/30', icon: '🪁' },
  BERAT: { label: 'Layangan berat', className: 'bg-blue-600/10 text-blue-700 dark:text-blue-400 border-blue-600/30', icon: '💪' },
  SEMUA: { label: 'Semua jenis layangan', className: 'bg-blue-900/10 text-blue-900 dark:text-blue-300 dark:bg-blue-400/10 border-blue-900/30 dark:border-blue-400/30', icon: '✨' },
};

function getWindDirectionText(degrees: number): string {
  const d = ((degrees % 360) + 360) % 360;
  const dirs = ['Utara', 'Timur Laut', 'Timur', 'Tenggara', 'Selatan', 'Barat Daya', 'Barat', 'Barat Laut'];
  return dirs[Math.round(d / 45) % 8] || 'Tidak diketahui';
}

function roundNumber(n: number, decimals = 1): number {
  const f = Math.pow(10, decimals);
  return Math.round(n * f) / f;
}

// ==========================================================================
// Loader Leaflet via CDN
// ==========================================================================
declare global {
  interface Window {
    L: any;
    __leafletLoadPromise?: Promise<any>;
  }
}

const LEAFLET_VERSION = '1.9.4';

function loadLeaflet(): Promise<any> {
  if (typeof window === 'undefined') return Promise.reject(new Error('SSR'));
  if (window.L) return Promise.resolve(window.L);
  if (window.__leafletLoadPromise) return window.__leafletLoadPromise;

  window.__leafletLoadPromise = new Promise((resolve, reject) => {
    const cssId = 'leaflet-css';
    if (!document.getElementById(cssId)) {
      const link = document.createElement('link');
      link.id = cssId;
      link.rel = 'stylesheet';
      link.href = `https://unpkg.com/leaflet@${LEAFLET_VERSION}/dist/leaflet.css`;
      document.head.appendChild(link);
    }
    const scriptId = 'leaflet-js';
    const existing = document.getElementById(scriptId) as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener('load', () => resolve(window.L));
      existing.addEventListener('error', reject);
      return;
    }
    const script = document.createElement('script');
    script.id = scriptId;
    script.src = `https://unpkg.com/leaflet@${LEAFLET_VERSION}/dist/leaflet.js`;
    script.async = true;
    script.onload = () => resolve(window.L);
    script.onerror = reject;
    document.body.appendChild(script);
  });

  return window.__leafletLoadPromise;
}

// ==========================================================================
// Komponen
// ==========================================================================
export default function MapWeather({ className = '', initialCenter, onSelectLocation }: MapWeatherProps) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const isDark = !mounted || resolvedTheme !== 'light';

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<any>(null);
  const baseLayerRef = useRef<any>(null);
  const overlayLayerRef = useRef<any>(null);
  const selectedMarkerRef = useRef<any>(null);
  const LRef = useRef<any>(null);
  const handleMapClickRef = useRef<(lat: number, lon: number) => void>(() => {});

  const [mapReady, setMapReady] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [activeLayer, setActiveLayer] = useState<LayerKey>('wind');
  const [overlayOpacity, setOverlayOpacity] = useState(0.8);

  const [selectedPoint, setSelectedPoint] = useState<PointWeather | null>(null);
  const [pointLoading, setPointLoading] = useState(false);
  const [pointError, setPointError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<GeocodeResult[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searching, setSearching] = useState(false);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [locating, setLocating] = useState(false);

  const center = initialCenter ?? DEFAULT_CENTER;
  const hasApiKey = OWM_API_KEY.length > 0;

  // ------------------------------------------------------------------
  // Inisialisasi peta (sekali saja) — persis gaya openweathermap.org
  // ------------------------------------------------------------------
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const L = await loadLeaflet();
        if (cancelled || !mapContainerRef.current || leafletMapRef.current) return;
        LRef.current = L;

        const map = L.map(mapContainerRef.current, {
          center: [center.lat, center.lon],
          zoom: center.zoom ?? 7,
          zoomControl: false,
          attributionControl: true,
          minZoom: 2,
          maxZoom: 18,
          worldCopyJump: true,
        });
        leafletMapRef.current = map;

        // Base tile: pakai CartoDB (mirip OSM default OWM)
        const base = L.tileLayer(isDark ? BASE_TILES.dark : BASE_TILES.light, {
          attribution: BASE_TILES.attribution,
          subdomains: 'abcd',
          maxZoom: 19,
        }).addTo(map);
        baseLayerRef.current = base;

        map.on('click', (e: any) => handleMapClickRef.current(e.latlng.lat, e.latlng.lng));

        setMapReady(true);
      } catch (err) {
        if (!cancelled) setMapError('Gagal memuat peta. Periksa koneksi internet Anda.');
      }
    })();

    return () => {
      cancelled = true;
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Ganti tile dasar saat tema berubah
  useEffect(() => {
    if (!baseLayerRef.current) return;
    baseLayerRef.current.setUrl(isDark ? BASE_TILES.dark : BASE_TILES.light);
  }, [isDark]);

  // ------------------------------------------------------------------
  // Overlay OpenWeatherMap (tile layer cuaca, seperti OWM)
  // ------------------------------------------------------------------
  useEffect(() => {
    const L = LRef.current;
    const map = leafletMapRef.current;
    if (!L || !map || !mapReady || !hasApiKey) return;

    if (overlayLayerRef.current) {
      map.removeLayer(overlayLayerRef.current);
      overlayLayerRef.current = null;
    }

    const code = LAYER_CONFIG[activeLayer].code;
    const url = `https://tile.openweathermap.org/map/${code}/{z}/{x}/{y}.png?appid=${OWM_API_KEY}`;
    const layer = L.tileLayer(url, {
      opacity: overlayOpacity,
      maxZoom: 18,
      maxNativeZoom: 12,
      className: 'owm-tile-layer',
    });
    layer.addTo(map);
    overlayLayerRef.current = layer;
  }, [activeLayer, mapReady, hasApiKey, overlayOpacity]);

  // ------------------------------------------------------------------
  // Klik peta -> ambil cuaca titik
  // ------------------------------------------------------------------
  const handleMapClick = useCallback(async (lat: number, lon: number) => {
    const L = LRef.current;
    const map = leafletMapRef.current;
    if (!L || !map) return;

    if (selectedMarkerRef.current) {
      map.removeLayer(selectedMarkerRef.current);
      selectedMarkerRef.current = null;
    }
    const pinIcon = L.divIcon({
      html: `<div class="selected-pin"><div class="selected-pin-dot"></div></div>`,
      className: 'selected-pin-icon',
      iconSize: [22, 22],
      iconAnchor: [11, 11],
    });
    selectedMarkerRef.current = L.marker([lat, lon], { icon: pinIcon }).addTo(map);

    setSelectedPoint(null);
    setPointError(null);

    if (!hasApiKey) {
      setPointError('NEXT_PUBLIC_OPENWEATHER_API_KEY belum diatur.');
      return;
    }

    setPointLoading(true);
    try {
      const res = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${OWM_API_KEY}&units=metric&lang=id`
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || 'Gagal mengambil data cuaca titik ini');

      const windSpeed = json?.wind?.speed ?? 0;
      setSelectedPoint({
        lat,
        lon,
        name: [json?.name, json?.sys?.country].filter(Boolean).join(', ') || 'Titik terpilih',
        temperature: json?.main?.temp ?? null,
        humidity: json?.main?.humidity ?? null,
        pressure: json?.main?.pressure ?? null,
        windSpeed,
        windGust: json?.wind?.gust ?? windSpeed,
        windDirection: json?.wind?.deg ?? 0,
        suitability: classifyKiteSuitability(windSpeed),
        updatedAt: new Date().toISOString(),
      });
    } catch (err) {
      setPointError(err instanceof Error ? err.message : 'Gagal mengambil data cuaca titik ini');
    } finally {
      setPointLoading(false);
    }
  }, [hasApiKey]);

  useEffect(() => { handleMapClickRef.current = handleMapClick; }, [handleMapClick]);

  // ------------------------------------------------------------------
  // Pencarian lokasi (OpenWeather Geocoding)
  // ------------------------------------------------------------------
  useEffect(() => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    if (!searchQuery.trim() || !hasApiKey) {
      setSearchResults([]);
      return;
    }
    searchDebounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(
          `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(searchQuery)}&limit=5&appid=${OWM_API_KEY}`
        );
        const json = await res.json();
        setSearchResults(Array.isArray(json) ? json : []);
      } catch {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 400);
    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    };
  }, [searchQuery, hasApiKey]);

  const flyTo = useCallback((lat: number, lon: number, zoom = 10) => {
    const map = leafletMapRef.current;
    if (!map) return;
    map.flyTo([lat, lon], zoom, { duration: 1 });
    setTimeout(() => handleMapClickRef.current(lat, lon), 500);
  }, []);

  const handleLocateMe = useCallback(() => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        flyTo(pos.coords.latitude, pos.coords.longitude, 11);
        setLocating(false);
      },
      () => setLocating(false),
      { timeout: 8000 }
    );
  }, [flyTo]);

  const zoomIn = () => leafletMapRef.current?.zoomIn();
  const zoomOut = () => leafletMapRef.current?.zoomOut();

  const activeSuitability = selectedPoint ? suitabilityMeta[selectedPoint.suitability] : null;
  const activeLayerConfig = LAYER_CONFIG[activeLayer];

  return (
    <div className={`w-full ${className}`}>
      <style jsx global>{`
        .leaflet-container { background: ${isDark ? '#0a0a0a' : '#f4f4f5'}; font-family: inherit; }
        .leaflet-control-attribution {
          background: ${isDark ? 'rgba(0,0,0,0.55)' : 'rgba(255,255,255,0.75)'} !important;
          color: ${isDark ? '#a1a1aa' : '#52525b'} !important;
          font-size: 9px !important;
        }
        .leaflet-control-attribution a { color: ${isDark ? '#93c5fd' : '#2563eb'} !important; }
        .owm-tile-layer { mix-blend-mode: ${isDark ? 'screen' : 'multiply'}; }

        .selected-pin-icon { display: flex; align-items: center; justify-content: center; }
        .selected-pin {
          width: 20px; height: 20px; border-radius: 9999px;
          background: rgba(37,99,235,0.18);
          display: flex; align-items: center; justify-content: center;
          animation: selected-pin-ring 1.6s ease-out infinite;
        }
        .selected-pin-dot { width: 9px; height: 9px; border-radius: 9999px; background: #2563eb; border: 2px solid white; }
        @keyframes selected-pin-ring {
          0% { box-shadow: 0 0 0 0 rgba(37,99,235,0.35); }
          70% { box-shadow: 0 0 0 12px rgba(37,99,235,0); }
          100% { box-shadow: 0 0 0 0 rgba(37,99,235,0); }
        }
      `}</style>

      <div className="bg-white dark:bg-black rounded-2xl p-4 sm:p-5 md:p-6 shadow-2xl shadow-blue-500/10 border border-zinc-200 dark:border-zinc-800 transition-colors">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-blue-600/10 rounded-lg shrink-0">
              <Layers className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">Peta Cuaca (OpenWeather)</h3>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">Klik di mana saja untuk melihat detail cuaca</p>
            </div>
          </div>

          {/* Pencarian lokasi */}
          <div className="relative w-full sm:w-64 shrink-0">
            <div className="flex items-center bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-1.5 focus-within:ring-2 focus-within:ring-blue-500/50 focus-within:border-blue-500 transition-all duration-200">
              {searching ? (
                <Loader2 className="w-3.5 h-3.5 text-blue-500 animate-spin mr-2 shrink-0" />
              ) : (
                <Search className="w-3.5 h-3.5 text-zinc-400 mr-2 shrink-0" />
              )}
              <input
                type="text"
                placeholder="Cari kota atau daerah..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setShowDropdown(true); }}
                onFocus={() => setShowDropdown(true)}
                className="bg-transparent outline-none w-full min-w-0 text-sm text-zinc-700 dark:text-zinc-200 placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
              />
              {searchQuery && (
                <button onClick={() => { setSearchQuery(''); setSearchResults([]); }} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors shrink-0">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {showDropdown && searchQuery && (
              <div className="absolute z-[1100] mt-1 w-full bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-2xl overflow-hidden max-h-52 overflow-y-auto">
                {searchResults.length > 0 ? (
                  searchResults.map((r, idx) => (
                    <button
                      key={`${r.lat}-${r.lon}-${idx}`}
                      onClick={() => {
                        flyTo(r.lat, r.lon, 10);
                        setSearchQuery([r.name, r.state, r.country].filter(Boolean).join(', '));
                        setShowDropdown(false);
                      }}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors flex items-center gap-2"
                    >
                      <MapPin className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                      <span className="truncate">{[r.name, r.state, r.country].filter(Boolean).join(', ')}</span>
                    </button>
                  ))
                ) : (
                  <div className="px-3 py-3 text-sm text-zinc-500 dark:text-zinc-400 text-center">
                    {searching ? 'Mencari...' : 'Lokasi tidak ditemukan'}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {!hasApiKey && (
          <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded-lg flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-blue-900 dark:text-blue-200">
              <p className="font-semibold">Variabel NEXT_PUBLIC_OPENWEATHER_API_KEY belum diatur.</p>
              <p className="mt-0.5">Peta dasar tetap tampil, tapi lapisan cuaca dan klik-titik membutuhkan API key OpenWeather.</p>
            </div>
          </div>
        )}

        {mapError && (
          <div className="mb-4 flex items-center gap-2 text-zinc-900 dark:text-white text-sm">
            <AlertCircle className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" /> {mapError}
          </div>
        )}

        {/* Layer switcher — seperti OWM */}
        <div className="flex items-center gap-1.5 mb-3 overflow-x-auto pb-1">
          {LAYER_ORDER.map((key) => {
            const cfg = LAYER_CONFIG[key];
            const Icon = cfg.icon;
            const isActive = activeLayer === key;
            return (
              <button
                key={key}
                onClick={() => setActiveLayer(key)}
                disabled={!hasApiKey}
                className={`inline-flex items-center gap-1.5 border rounded-full px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                  isActive
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-zinc-50 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800 hover:border-blue-400/50'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {cfg.label}
              </button>
            );
          })}

          <div className="flex items-center gap-2 ml-auto pl-2 shrink-0">
            <span className="text-[10px] text-zinc-400 dark:text-zinc-500 whitespace-nowrap">Transparansi</span>
            <input
              type="range"
              min={0.2}
              max={1}
              step={0.05}
              value={overlayOpacity}
              onChange={(e) => setOverlayOpacity(parseFloat(e.target.value))}
              disabled={!hasApiKey}
              className="w-20 accent-blue-600"
            />
          </div>
        </div>

        {/* Peta */}
        <div className="relative w-full h-[420px] sm:h-[500px] md:h-[560px] rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800">
          <div ref={mapContainerRef} className="absolute inset-0 z-0" />

          {!mapReady && !mapError && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-zinc-50 dark:bg-zinc-900">
              <div className="flex flex-col items-center gap-2 text-zinc-500 dark:text-zinc-400">
                <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                <span className="text-xs">Memuat peta...</span>
              </div>
            </div>
          )}

          {/* Kontrol zoom & lokasi */}
          {mapReady && (
            <div className="absolute top-3 right-3 z-[1000] flex flex-col gap-1.5">
              <button onClick={zoomIn} className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/95 dark:bg-zinc-900/95 border border-zinc-200 dark:border-zinc-800 shadow-md text-zinc-700 dark:text-zinc-200 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                <Plus className="w-4 h-4" />
              </button>
              <button onClick={zoomOut} className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/95 dark:bg-zinc-900/95 border border-zinc-200 dark:border-zinc-800 shadow-md text-zinc-700 dark:text-zinc-200 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                <Minus className="w-4 h-4" />
              </button>
              <button onClick={handleLocateMe} className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/95 dark:bg-zinc-900/95 border border-zinc-200 dark:border-zinc-800 shadow-md text-zinc-700 dark:text-zinc-200 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                {locating ? <Loader2 className="w-4 h-4 animate-spin" /> : <LocateFixed className="w-4 h-4" />}
              </button>
            </div>
          )}

          {/* Legenda (seperti OWM) */}
          {mapReady && hasApiKey && (
            <div className="absolute bottom-3 left-3 z-[1000] bg-white/95 dark:bg-zinc-900/95 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 shadow-md">
              <p className="text-[10px] font-semibold text-zinc-600 dark:text-zinc-300 mb-1">{activeLayerConfig.label} ({activeLayerConfig.unit})</p>
              <div className="flex items-center gap-1.5">
                <span className="text-[9px] text-zinc-400">Rendah</span>
                <div className="w-20 h-2 rounded-full overflow-hidden flex">
                  {activeLayerConfig.legend.map((c, i) => (
                    <span key={i} style={{ background: c }} className="flex-1 h-full" />
                  ))}
                </div>
                <span className="text-[9px] text-zinc-400">Tinggi</span>
              </div>
            </div>
          )}

          {/* Panel detail titik */}
          {(selectedPoint || pointLoading || pointError) && (
            <div className="absolute bottom-3 right-3 z-[1000] w-[calc(100%-1.5rem)] sm:w-72 bg-white/98 dark:bg-zinc-900/98 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-2xl p-3.5">
              <button
                onClick={() => { setSelectedPoint(null); setPointError(null); if (selectedMarkerRef.current) { leafletMapRef.current?.removeLayer(selectedMarkerRef.current); selectedMarkerRef.current = null; } }}
                className="absolute top-2.5 right-2.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>

              {pointLoading && (
                <div className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400 py-2">
                  <Loader2 className="w-4 h-4 animate-spin text-blue-500" /> Memuat data titik...
                </div>
              )}

              {pointError && !pointLoading && (
                <div className="flex items-start gap-2 text-xs text-zinc-600 dark:text-zinc-300 py-1 pr-4">
                  <AlertCircle className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" /> {pointError}
                </div>
              )}

              {selectedPoint && !pointLoading && !pointError && (
                <div>
                  <div className="flex items-center gap-1.5 pr-4">
                    <MapPin className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                    <p className="text-sm font-semibold text-zinc-900 dark:text-white truncate">{selectedPoint.name}</p>
                  </div>
                  <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mb-2">
                    {roundNumber(selectedPoint.lat, 3)}, {roundNumber(selectedPoint.lon, 3)}
                  </p>

                  <div className="flex items-end gap-1 mb-2">
                    <span className="text-2xl font-bold text-zinc-900 dark:text-white leading-none">
                      {selectedPoint.temperature !== null ? roundNumber(selectedPoint.temperature, 1) : '–'}
                    </span>
                    <span className="text-sm text-zinc-400 mb-0.5">°C</span>
                  </div>

                  <div className="grid grid-cols-3 gap-1.5 mb-2.5">
                    <div className="bg-zinc-50 dark:bg-zinc-800/60 rounded-lg px-2 py-1.5 text-center border border-zinc-200 dark:border-zinc-800">
                      <Wind className="w-3.5 h-3.5 text-blue-500 mx-auto mb-0.5" />
                      <div className="text-xs font-semibold text-zinc-900 dark:text-white">{roundNumber(selectedPoint.windSpeed, 1)}</div>
                      <div className="text-[9px] text-zinc-500 dark:text-zinc-400">m/s</div>
                    </div>
                    <div className="bg-zinc-50 dark:bg-zinc-800/60 rounded-lg px-2 py-1.5 text-center border border-zinc-200 dark:border-zinc-800">
                      <Compass className="w-3.5 h-3.5 text-blue-500 mx-auto mb-0.5" />
                      <div className="text-xs font-semibold text-zinc-900 dark:text-white">{Math.round(selectedPoint.windDirection)}°</div>
                      <div className="text-[9px] text-zinc-500 dark:text-zinc-400 truncate">{getWindDirectionText(selectedPoint.windDirection)}</div>
                    </div>
                    <div className="bg-zinc-50 dark:bg-zinc-800/60 rounded-lg px-2 py-1.5 text-center border border-zinc-200 dark:border-zinc-800">
                      <Droplets className="w-3.5 h-3.5 text-blue-500 mx-auto mb-0.5" />
                      <div className="text-xs font-semibold text-zinc-900 dark:text-white">{selectedPoint.humidity ?? '–'}%</div>
                      <div className="text-[9px] text-zinc-500 dark:text-zinc-400">Lembap</div>
                    </div>
                  </div>

                  {activeSuitability && (
                    <span className={`inline-flex items-center gap-1.5 border rounded-full px-2.5 py-1 text-[11px] font-medium mb-2.5 ${activeSuitability.className}`}>
                      <span>{activeSuitability.icon}</span>
                      {activeSuitability.label}
                    </span>
                  )}

                  {onSelectLocation && (
                    <button
                      onClick={() => onSelectLocation({ name: selectedPoint.name, latitude: selectedPoint.lat, longitude: selectedPoint.lon })}
                      className="w-full text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-1.5 transition-colors"
                    >
                      Gunakan sebagai lokasi
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <p className="text-[9px] text-zinc-400 dark:text-zinc-500 text-center mt-2.5">
          Data cuaca & peta oleh OpenWeatherMap &middot; Base map oleh OpenStreetMap & CARTO
        </p>
      </div>
    </div>
  );
}