// components/landing/WeatherWidget.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTheme } from 'next-themes';
import { MapPin, Search, ArrowUp, Sun, Cloud, Wind, Loader2, AlertCircle, X, Droplets, Thermometer, Compass, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// ==========================================
// Interface Data
// ==========================================
interface LocationOption {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
}

interface HourlyPoint {
  time: string;
  timestamp: string;
  temp: number;
  humidity: number;
  windSpeed: number;
  windGust: number;
  windDirection: number;
  kiteSuitability: KiteSuitability;
}

interface DailyPoint {
  day: string;
  tempMax: number;
  tempMin: number;
  cloudy: boolean;
  isToday: boolean;
}

type KiteSuitability = 'TIDAK_LAYAK' | 'RINGAN' | 'BERAT' | 'SEMUA';

interface WeatherResponse {
  location: { id: string; name: string; latitude: number; longitude: number };
  current: {
    temperature: number | null;
    humidity: number | null;
    windSpeed: number;
    windGust: number;
    windDirection: number;
    kiteSuitability: KiteSuitability;
    updatedAt: string | null;
  };
  hourly: HourlyPoint[];
  daily: DailyPoint[];
}

interface WeatherWidgetProps {
  className?: string;
}

// ==========================================
// Utility & Constants
// ==========================================
const suitabilityMeta: Record<KiteSuitability, { label: string; className: string }> = {
  TIDAK_LAYAK: { label: 'Tidak layak terbang', className: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30' },
  RINGAN: { label: 'Layangan ringan', className: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/30' },
  BERAT: { label: 'Layangan berat', className: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30' },
  SEMUA: { label: 'Semua jenis layangan', className: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30' },
};

const fallbackData: WeatherResponse = {
  location: { id: 'jember-default', name: 'Jember, Jawa Timur', latitude: -8.18, longitude: 113.67 },
  current: { temperature: 30, humidity: 75, windSpeed: 12, windGust: 18, windDirection: 120, kiteSuitability: 'RINGAN', updatedAt: new Date().toISOString() },
  hourly: [
    { time: '05.00', timestamp: '', temp: 24, humidity: 85, windSpeed: 4, windGust: 8, windDirection: 225, kiteSuitability: 'TIDAK_LAYAK' },
    { time: '08.00', timestamp: '', temp: 26, humidity: 75, windSpeed: 10, windGust: 14, windDirection: 315, kiteSuitability: 'RINGAN' },
    { time: '11.00', timestamp: '', temp: 28, humidity: 65, windSpeed: 14, windGust: 20, windDirection: 45, kiteSuitability: 'RINGAN' },
    { time: '14.00', timestamp: '', temp: 30, humidity: 55, windSpeed: 16, windGust: 22, windDirection: 0, kiteSuitability: 'SEMUA' },
    { time: '17.00', timestamp: '', temp: 29, humidity: 60, windSpeed: 12, windGust: 16, windDirection: 315, kiteSuitability: 'RINGAN' },
    { time: '20.00', timestamp: '', temp: 26, humidity: 70, windSpeed: 8, windGust: 12, windDirection: 225, kiteSuitability: 'TIDAK_LAYAK' },
    { time: '23.00', timestamp: '', temp: 24, humidity: 80, windSpeed: 4, windGust: 6, windDirection: 225, kiteSuitability: 'TIDAK_LAYAK' },
    { time: '02.00', timestamp: '', temp: 23, humidity: 85, windSpeed: 3, windGust: 5, windDirection: 225, kiteSuitability: 'TIDAK_LAYAK' },
  ],
  daily: [
    { day: 'Min', tempMax: 30, tempMin: 23, cloudy: false, isToday: true },
    { day: 'Sen', tempMax: 30, tempMin: 23, cloudy: false, isToday: false },
    { day: 'Sel', tempMax: 29, tempMin: 23, cloudy: true, isToday: false },
    { day: 'Rab', tempMax: 29, tempMin: 23, cloudy: true, isToday: false },
    { day: 'Kam', tempMax: 30, tempMin: 23, cloudy: false, isToday: false },
    { day: 'Jum', tempMax: 31, tempMin: 24, cloudy: false, isToday: false },
    { day: 'Sab', tempMax: 31, tempMin: 24, cloudy: false, isToday: false },
    { day: 'Min', tempMax: 30, tempMin: 23, cloudy: true, isToday: false },
  ],
};

// Skeleton Loading Component
const WeatherSkeleton = ({ isDark }: { isDark: boolean }) => (
  <div className="w-full animate-pulse space-y-4">
    <div className="flex flex-col sm:flex-row justify-between items-start gap-3">
      <div className="flex items-center gap-3">
        <div className={`w-12 h-12 rounded-full ${isDark ? 'bg-zinc-700' : 'bg-zinc-200'}`} />
        <div className="space-y-1.5">
          <div className={`h-8 w-20 rounded-lg ${isDark ? 'bg-zinc-700' : 'bg-zinc-200'}`} />
          <div className={`h-3 w-36 rounded ${isDark ? 'bg-zinc-700' : 'bg-zinc-200'}`} />
        </div>
      </div>
      <div className="flex flex-col items-end gap-1.5">
        <div className={`h-4 w-16 rounded ${isDark ? 'bg-zinc-700' : 'bg-zinc-200'}`} />
        <div className={`h-3 w-12 rounded ${isDark ? 'bg-zinc-700' : 'bg-zinc-200'}`} />
      </div>
    </div>
    <div className="space-y-3">
      <div className={`h-3 w-24 rounded ${isDark ? 'bg-zinc-700' : 'bg-zinc-200'}`} />
      <div className={`h-28 w-full rounded-xl ${isDark ? 'bg-zinc-800' : 'bg-zinc-100'}`} />
    </div>
    <div className="flex justify-between gap-1.5">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex flex-col items-center gap-2 w-12">
          <div className={`h-3 w-8 rounded ${isDark ? 'bg-zinc-700' : 'bg-zinc-200'}`} />
          <div className={`h-6 w-6 rounded-full ${isDark ? 'bg-zinc-700' : 'bg-zinc-200'}`} />
          <div className={`h-3 w-10 rounded ${isDark ? 'bg-zinc-700' : 'bg-zinc-200'}`} />
        </div>
      ))}
    </div>
  </div>
);

function buildSmoothPath(points: { x: number; y: number }[]) {
  if (points.length === 0) return '';
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const midX = (prev.x + curr.x) / 2;
    const midY = (prev.y + curr.y) / 2;
    d += ` Q ${prev.x} ${prev.y} ${midX} ${midY}`;
  }
  const last = points[points.length - 1];
  d += ` L ${last.x} ${last.y}`;
  return d;
}

function evenlySpacedIndices(length: number, count: number) {
  if (length <= count) return Array.from({ length }, (_, i) => i);
  const step = (length - 1) / (count - 1);
  return Array.from({ length: count }, (_, i) => Math.round(i * step));
}

export default function WeatherWidget({ className = '' }: WeatherWidgetProps) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const isDark = !mounted || resolvedTheme !== 'light';

  const [locations, setLocations] = useState<LocationOption[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [data, setData] = useState<WeatherResponse | null>(null);
  const [loadingLocations, setLoadingLocations] = useState(true);
  const [loadingWeather, setLoadingWeather] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoadingLocations(true);
        const res = await fetch('/api/locations');
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Gagal memuat lokasi');
        if (cancelled) return;
        setLocations(json.locations);
        if (json.locations.length > 0) {
          setSelectedId(json.locations[0].id);
        } else {
          setSelectedId('jember-default');
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Gagal memuat lokasi');
      } finally {
        if (!cancelled) setLoadingLocations(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    let cancelled = false;
    (async () => {
      try {
        setLoadingWeather(true);
        setError(null);
        
        if (selectedId === 'jember-default') {
          setData(fallbackData);
          setLoadingWeather(false);
          return;
        }

        const res = await fetch(`/api/weather?locationId=${encodeURIComponent(selectedId)}`);
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Gagal memuat cuaca');
        if (!cancelled) setData(json);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Gagal memuat cuaca');
      } finally {
        if (!cancelled) setLoadingWeather(false);
      }
    })();
    return () => { cancelled = true; };
  }, [selectedId]);

  const filteredLocations = useMemo(() => {
    return locations.filter(loc => 
      loc.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [locations, searchQuery]);

  const weatherData = data || fallbackData;
  
  const chartColors = isDark
    ? { line: '#60a5fa', fillFrom: 'rgba(96,165,250,0.35)', fillTo: 'rgba(96,165,250,0)', grid: 'rgba(255,255,255,0.08)', axis: '#9ca3af', now: '#93c5fd' }
    : { line: '#2563eb', fillFrom: 'rgba(37,99,235,0.20)', fillTo: 'rgba(37,99,235,0)', grid: 'rgba(0,0,0,0.08)', axis: '#71717a', now: '#4f46e5' };

  const hourlyData = useMemo(() => {
    if (!weatherData?.hourly) return [];
    return [...weatherData.hourly].sort((a, b) => {
      if (a.timestamp && b.timestamp) {
        return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
      }
      return 0;
    });
  }, [weatherData]);

  const chart = useMemo(() => {
    const hourly = hourlyData;
    if (hourly.length === 0) return null;

    const width = 700;
    const height = 130;
    const padTop = 16;
    const padBottom = 8;

    const speeds = hourly.map((h) => h.windSpeed);
    const min = Math.min(...speeds, 0);
    const max = Math.max(...speeds, 1);
    const range = max - min || 1;

    const points = hourly.map((h, i) => {
      const x = hourly.length === 1 ? width / 2 : (i / (hourly.length - 1)) * width;
      const y = height - padBottom - ((h.windSpeed - min) / range) * (height - padTop - padBottom);
      return { x, y };
    });

    const linePath = buildSmoothPath(points);
    const areaPath = points.length > 0 ? `${linePath} L ${points[points.length - 1].x} ${height} L ${points[0].x} ${height} Z` : '';
    const markerIdx = hourly.length <= 8 
      ? Array.from({ length: hourly.length }, (_, i) => i)
      : evenlySpacedIndices(hourly.length, 8);

    return { width, height, points, linePath, areaPath, markerIdx };
  }, [hourlyData]);

  const suitability = weatherData ? suitabilityMeta[weatherData.current.kiteSuitability] : null;
  const todayLabel = new Date().toLocaleDateString('id-ID', { weekday: 'long' });
  const isCloudyNow = (weatherData?.current.humidity ?? 0) > 70;

  return (
    <div className={`flex-1 flex flex-col items-center w-full bg-white dark:bg-black text-zinc-900 dark:text-white min-h-screen px-3 py-4 md:py-8 font-sans transition-colors ${className}`}>
      
      {/* Header Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-4xl w-full mb-6"
      >
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-blue-500/10 rounded-lg">
              <MapPin className="w-4 h-4 text-blue-500" />
            </div>
            <div>
              <h3 className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Lokasi Pantauan</h3>
              <div className="flex items-center gap-2">
                <span className="text-base font-semibold text-zinc-900 dark:text-white">
                  {weatherData?.location?.name || 'Memuat...'}
                </span>
                <span className="text-[10px] text-zinc-500 dark:text-zinc-400">
                  {weatherData?.location?.latitude?.toFixed(2)}, {weatherData?.location?.longitude?.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Search Dropdown */}
          <div className="relative w-full md:w-64">
            <div className="flex items-center bg-zinc-100 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-1.5 focus-within:ring-2 focus-within:ring-blue-500/50 focus-within:border-blue-500 transition-all duration-200">
              {loadingLocations ? (
                <Loader2 className="w-3.5 h-3.5 text-blue-500 animate-spin mr-2" />
              ) : (
                <Search className="w-3.5 h-3.5 text-zinc-400 mr-2" />
              )}
              <input
                type="text"
                placeholder="Cari lokasi..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setShowDropdown(true); }}
                onFocus={() => setShowDropdown(true)}
                className="bg-transparent outline-none w-full text-sm text-zinc-700 dark:text-zinc-200 placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')} 
                  className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <AnimatePresence>
              {showDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="absolute z-20 mt-1 w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-2xl overflow-hidden max-h-52 overflow-y-auto"
                >
                  {filteredLocations.length > 0 ? (
                    filteredLocations.map((loc) => (
                      <button
                        key={loc.id}
                        onClick={() => {
                          setSelectedId(loc.id);
                          setSearchQuery(loc.name.split('(')[0].trim());
                          setShowDropdown(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors flex items-center justify-between ${
                          selectedId === loc.id ? 'bg-blue-50 dark:bg-blue-900/20 font-medium text-blue-600 dark:text-blue-400' : ''
                        }`}
                      >
                        <span>{loc.name}</span>
                        {selectedId === loc.id && (
                          <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                        )}
                      </button>
                    ))
                  ) : (
                    <div className="px-3 py-3 text-sm text-zinc-500 dark:text-zinc-400 text-center">
                      Lokasi tidak ditemukan
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>

      {/* Notifikasi */}
      {locations.length === 0 && !loadingLocations && (
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="max-w-4xl w-full mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg flex items-start gap-2"
        >
          <AlertCircle className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
          <div className="text-xs text-blue-800 dark:text-blue-200">
            <p className="font-semibold">Lokasi belum tersedia di database.</p>
            <p className="mt-0.5">Saat ini Anda melihat data default <b>Jember</b>.</p>
          </div>
        </motion.div>
      )}

      {/* Main Weather Widget Box */}
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="max-w-4xl w-full bg-white dark:bg-zinc-900/80 rounded-2xl p-5 md:p-6 shadow-2xl shadow-blue-500/5 dark:shadow-blue-500/10 border border-zinc-200 dark:border-zinc-800 backdrop-blur-sm transition-colors relative overflow-hidden"
      >
        {/* Decorative gradient blob */}
        <div className="absolute -top-20 -right-20 w-48 h-48 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

        {error && (
          <div className="flex items-center gap-2 text-red-500 text-sm mb-3">
            <AlertCircle className="w-4 h-4" /> {error}
          </div>
        )}

        {loadingWeather && !error && (
          <div className="py-3">
            <WeatherSkeleton isDark={isDark} />
          </div>
        )}

        {!loadingWeather && weatherData && !error && (
          <div className="relative z-10">
            {/* Top Section */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
              <div className="flex items-center gap-4 flex-wrap">
                {/* Weather Icon */}
                <div className="relative">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-yellow-400/20 to-orange-400/20 flex items-center justify-center">
                    {isCloudyNow ? (
                      <Cloud className="w-8 h-8 text-zinc-400 dark:text-zinc-300" />
                    ) : (
                      <Sun className="w-8 h-8 text-yellow-400 fill-yellow-400/30" />
                    )}
                  </div>
                  <div className="absolute -inset-1 bg-yellow-400/20 rounded-xl blur-lg -z-10" />
                </div>

                <div>
                  <div className="flex items-start">
                    <span className="text-5xl md:text-6xl font-bold leading-none tracking-tighter text-zinc-900 dark:text-white">
                      {weatherData.current.temperature ?? '–'}
                    </span>
                    <span className="text-xl mt-0.5 text-zinc-400 font-light ml-0.5">°C</span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-zinc-500 dark:text-zinc-400 capitalize">
                      {isCloudyNow ? '☁️ Berawan' : '☀️ Cerah'}
                    </span>
                    <span className="text-zinc-300 dark:text-zinc-600">•</span>
                    <span className="text-xs text-zinc-500 dark:text-zinc-400 capitalize">
                      {todayLabel}
                    </span>
                  </div>
                </div>
              </div>

              {/* Weather Stats */}
              <div className="grid grid-cols-3 gap-2 w-full lg:w-auto">
                <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-lg px-3 py-2 text-center min-w-[65px]">
                  <Droplets className="w-3.5 h-3.5 text-blue-400 mx-auto mb-0.5" />
                  <div className="text-sm font-semibold text-zinc-900 dark:text-white">
                    {weatherData.current.humidity ?? '–'}%
                  </div>
                  <div className="text-[9px] text-zinc-500 dark:text-zinc-400">Kelembapan</div>
                </div>
                <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-lg px-3 py-2 text-center min-w-[65px]">
                  <Wind className="w-3.5 h-3.5 text-blue-400 mx-auto mb-0.5" />
                  <div className="text-sm font-semibold text-zinc-900 dark:text-white">
                    {weatherData.current.windSpeed} km/h
                  </div>
                  <div className="text-[9px] text-zinc-500 dark:text-zinc-400">Angin</div>
                </div>
                <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-lg px-3 py-2 text-center min-w-[65px]">
                  <Compass className="w-3.5 h-3.5 text-blue-400 mx-auto mb-0.5" />
                  <div className="text-sm font-semibold text-zinc-900 dark:text-white">
                    {weatherData.current.windDirection}°
                  </div>
                  <div className="text-[9px] text-zinc-500 dark:text-zinc-400">Arah</div>
                </div>
              </div>
            </div>

            {/* Suitability Badge */}
            {suitability && (
              <div className="mt-3 flex items-center gap-2">
                <span className={`inline-flex items-center gap-1.5 border rounded-full px-2.5 py-0.5 text-[10px] font-medium ${suitability.className}`}>
                  <Wind className="w-3 h-3" /> {suitability.label}
                </span>
                <span className="text-[10px] text-zinc-500 dark:text-zinc-400">
                  Hembusan {weatherData.current.windGust} km/h
                </span>
              </div>
            )}

            {/* Wind Chart Section */}
            <div className="mt-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-1 bg-blue-500/10 rounded-lg">
                  <Wind className="w-3.5 h-3.5 text-blue-500" />
                </div>
                <h4 className="text-xs font-semibold text-zinc-900 dark:text-white">Angin per Jam</h4>
                <div className="flex-1 h-px bg-gradient-to-r from-zinc-200 dark:from-zinc-700 to-transparent" />
              </div>

              {chart && hourlyData.length > 0 ? (
                <div className="w-full">
                  <svg viewBox={`0 0 ${chart.width} ${chart.height}`} className="w-full h-28" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="windFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={chartColors.fillFrom} />
                        <stop offset="100%" stopColor={chartColors.fillTo} />
                      </linearGradient>
                    </defs>
                    {[0.25, 0.5, 0.75].map((frac) => (
                      <line key={frac} x1={0} x2={chart.width} y1={chart.height * frac} y2={chart.height * frac} stroke={chartColors.grid} strokeWidth={1} />
                    ))}
                    <path d={chart.areaPath} fill="url(#windFill)" stroke="none" />
                    <path d={chart.linePath} fill="none" stroke={chartColors.line} strokeWidth={2} strokeLinecap="round" />
                    {chart.points.map((p, i) => (
                      <circle key={i} cx={p.x} cy={p.y} r={i === chart.points.length - 1 ? 3.5 : 2} fill={i === chart.points.length - 1 ? chartColors.now : chartColors.line} />
                    ))}
                  </svg>

                  <div className="flex justify-between items-end mt-1.5 pb-1 overflow-x-auto gap-1.5">
                    {chart.markerIdx.map((idx) => {
                      const point = hourlyData[idx];
                      if (!point) return null;
                      const isNow = idx === hourlyData.length - 1;
                      const windDirection = point.windDirection || 0;
                      
                      return (
                        <div key={idx} className="flex flex-col items-center gap-0.5 min-w-[36px]">
                          <span className={`text-[10px] ${isNow ? 'text-blue-600 dark:text-blue-400 font-bold' : 'text-zinc-600 dark:text-zinc-300'}`}>
                            {Math.round(point.windSpeed)} km/h
                          </span>
                          <div className={`p-0.5 rounded-full ${isNow ? 'bg-blue-500/10' : ''}`}>
                            <ArrowUp 
                              className={`${isNow ? 'w-4 h-4 text-blue-500' : 'w-3.5 h-3.5 text-zinc-400'}`} 
                              style={{ 
                                transform: `rotate(${windDirection}deg)`,
                                transition: 'transform 0.3s ease'
                              }} 
                            />
                          </div>
                          <span className="text-[9px] text-zinc-500 dark:text-zinc-400">{point.time}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="text-sm text-zinc-500 py-4 text-center">Belum ada data angin untuk lokasi ini.</div>
              )}
            </div>

            {/* Daily Forecast */}
            {weatherData.daily.length > 0 && (
              <div className="mt-5">
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-1 bg-blue-500/10 rounded-lg">
                    <Calendar className="w-3.5 h-3.5 text-blue-500" />
                  </div>
                  <h4 className="text-xs font-semibold text-zinc-900 dark:text-white">Prakiraan 7 Hari</h4>
                  <div className="flex-1 h-px bg-gradient-to-r from-zinc-200 dark:from-zinc-700 to-transparent" />
                </div>

                <div className="flex justify-between items-center overflow-x-auto gap-1.5 pb-1.5">
                  {weatherData.daily.map((day, idx) => (
                    <div 
                      key={idx} 
                      className={`flex flex-col items-center gap-1.5 px-2.5 py-2 rounded-xl min-w-[50px] transition-all duration-200 ${
                        day.isToday ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800' : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
                      }`}
                    >
                      <span className={`text-xs font-medium ${day.isToday ? 'text-blue-600 dark:text-blue-400' : 'text-zinc-600 dark:text-zinc-300'}`}>
                        {day.day}
                      </span>
                      <div className="relative w-6 h-6 flex justify-center items-center">
                        <div className="absolute w-4 h-4 bg-yellow-400 rounded-full blur-[0.5px]" />
                        {day.cloudy && (
                          <div className="absolute -bottom-0.5 -right-0.5 w-4 h-2.5 bg-zinc-300 dark:bg-zinc-600 rounded-full blur-[0.5px] opacity-90 z-10" />
                        )}
                      </div>
                      <div className="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium whitespace-nowrap">
                        <span className={`${day.isToday ? 'text-blue-600 dark:text-blue-400' : 'text-zinc-900 dark:text-white'} font-semibold mr-0.5`}>
                          {day.tempMax}°
                        </span>
                        {day.tempMin}°
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Updated At */}
            <div className="mt-4 text-right">
              <p className="text-[9px] text-zinc-400 dark:text-zinc-500">
                Terakhir diperbarui: {weatherData.current.updatedAt ? new Date(weatherData.current.updatedAt).toLocaleString('id-ID') : 'Belum diperbarui'}
              </p>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}