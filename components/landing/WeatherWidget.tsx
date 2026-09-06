// components/landing/WeatherWidget.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTheme } from 'next-themes';
import { MapPin, Search, ArrowUp, Sun, Cloud, Wind, Loader2, AlertCircle, X } from 'lucide-react';

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
  <div className="w-full animate-pulse space-y-6">
    {/* Top Section Skeleton */}
    <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
      <div className="flex items-center gap-4">
        <div className={`w-16 h-16 rounded-full ${isDark ? 'bg-zinc-700' : 'bg-zinc-200'}`} />
        <div className="space-y-2">
          <div className={`h-12 w-24 rounded-lg ${isDark ? 'bg-zinc-700' : 'bg-zinc-200'}`} />
          <div className={`h-4 w-48 rounded ${isDark ? 'bg-zinc-700' : 'bg-zinc-200'}`} />
        </div>
      </div>
      <div className="flex flex-col items-end gap-2">
        <div className={`h-6 w-20 rounded ${isDark ? 'bg-zinc-700' : 'bg-zinc-200'}`} />
        <div className={`h-4 w-16 rounded ${isDark ? 'bg-zinc-700' : 'bg-zinc-200'}`} />
      </div>
    </div>

    {/* Chart Skeleton */}
    <div className="space-y-4">
      <div className={`h-4 w-32 rounded ${isDark ? 'bg-zinc-700' : 'bg-zinc-200'}`} />
      <div className={`h-36 w-full rounded-xl ${isDark ? 'bg-zinc-800' : 'bg-zinc-100'}`} />
    </div>

    {/* Daily Skeleton */}
    <div className="flex justify-between gap-2">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex flex-col items-center gap-3 w-16">
          <div className={`h-4 w-10 rounded ${isDark ? 'bg-zinc-700' : 'bg-zinc-200'}`} />
          <div className={`h-8 w-8 rounded-full ${isDark ? 'bg-zinc-700' : 'bg-zinc-200'}`} />
          <div className={`h-4 w-12 rounded ${isDark ? 'bg-zinc-700' : 'bg-zinc-200'}`} />
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

  // 1. Ambil daftar lokasi publik
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

  // 2. Ambil data cuaca
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

  // Filter lokasi berdasarkan pencarian
  const filteredLocations = useMemo(() => {
    return locations.filter(loc => 
      loc.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [locations, searchQuery]);

  const weatherData = data || fallbackData;
  
  // Chart colors - Blue theme
  const chartColors = isDark
    ? { line: '#60a5fa', fillFrom: 'rgba(96,165,250,0.35)', fillTo: 'rgba(96,165,250,0)', grid: 'rgba(255,255,255,0.08)', axis: '#9ca3af', now: '#93c5fd' }
    : { line: '#2563eb', fillFrom: 'rgba(37,99,235,0.20)', fillTo: 'rgba(37,99,235,0)', grid: 'rgba(0,0,0,0.08)', axis: '#71717a', now: '#4f46e5' };

  // Get hourly data - make sure it's in chronological order (oldest to newest)
  const hourlyData = useMemo(() => {
    if (!weatherData?.hourly) return [];
    // Sort by timestamp if available, otherwise keep as is
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
    const height = 150;
    const padTop = 20;
    const padBottom = 10;

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
    // Show all points if less than 8, otherwise show evenly spaced
    const markerIdx = hourly.length <= 8 
      ? Array.from({ length: hourly.length }, (_, i) => i)
      : evenlySpacedIndices(hourly.length, 8);

    return { width, height, points, linePath, areaPath, markerIdx };
  }, [hourlyData]);

  const suitability = weatherData ? suitabilityMeta[weatherData.current.kiteSuitability] : null;
  const todayLabel = new Date().toLocaleDateString('id-ID', { weekday: 'long' });
  const isCloudyNow = (weatherData?.current.humidity ?? 0) > 70;

  return (
    <div className={`flex-1 flex flex-col items-center w-full bg-white dark:bg-black text-zinc-900 dark:text-white min-h-screen px-4 py-8 md:py-12 font-sans transition-colors ${className}`}>
      
      {/* Region Selector dengan Search Dropdown */}
      <div className="max-w-3xl w-full mb-8 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-300">
          <MapPin className="w-5 h-5 text-blue-500" />
          <span className="text-sm font-medium">Lokasi Pantauan:</span>
        </div>

        <div className="relative w-full md:w-72">
          <div className="flex items-center bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-full px-4 py-2">
            {loadingLocations ? (
              <Loader2 className="w-4 h-4 text-blue-500 animate-spin mr-2" />
            ) : (
              <Search className="w-4 h-4 text-blue-500 mr-2" />
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
              <button onClick={() => setSearchQuery('')} className="text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {showDropdown && (
            <div className="absolute z-20 mt-2 w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-lg overflow-hidden max-h-60 overflow-y-auto">
              {filteredLocations.length > 0 ? (
                filteredLocations.map((loc) => (
                  <button
                    key={loc.id}
                    onClick={() => {
                      setSelectedId(loc.id);
                      setSearchQuery(loc.name.split('(')[0].trim());
                      setShowDropdown(false);
                    }}
                    className={`w-full text-left px-4 py-2.5 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors ${
                      selectedId === loc.id ? 'bg-blue-50 dark:bg-blue-900/20 font-semibold' : ''
                    }`}
                  >
                    {loc.name}
                  </button>
                ))
              ) : (
                <div className="px-4 py-3 text-sm text-zinc-500 dark:text-zinc-400">
                  Lokasi tidak ditemukan.
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Notifikasi jika lokasi tidak tersedia di database */}
      {locations.length === 0 && !loadingLocations && (
        <div className="max-w-3xl w-full mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
          <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
          <div className="text-sm text-blue-800 dark:text-blue-200">
            <p className="font-semibold">Lokasi belum tersedia di database.</p>
            <p className="mt-1">Saat ini Anda melihat data default <b>Jember</b>. Silakan hubungi admin untuk menambahkan lokasi Anda.</p>
          </div>
        </div>
      )}

      {/* Main Weather Widget Box */}
      <div className="max-w-3xl w-full bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-xl dark:shadow-2xl border border-zinc-200 dark:border-zinc-800 transition-colors relative overflow-hidden">
        {error && (
          <div className="flex items-center gap-2 text-red-500 text-sm mb-4 animate-in fade-in slide-in-from-top-2 duration-300">
            <AlertCircle className="w-4 h-4" /> {error}
          </div>
        )}

        {loadingWeather && !error && (
          <div className="py-8">
            <WeatherSkeleton isDark={isDark} />
          </div>
        )}

        {!loadingWeather && weatherData && !error && (
          <div className="animate-in fade-in duration-500">
            {/* Top Section */}
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
              <div className="flex items-center gap-4 flex-wrap">
                <div className="w-16 h-16 bg-yellow-400 rounded-full flex items-center justify-center blur-[1px] shadow-[0_0_15px_rgba(250,204,21,0.4)] shrink-0">
                  {isCloudyNow ? (
                    <Cloud className="w-9 h-9 text-yellow-50 fill-zinc-100 dark:fill-zinc-300" />
                  ) : (
                    <Sun className="w-10 h-10 text-yellow-100 fill-yellow-200" />
                  )}
                </div>

                <div className="flex items-start ml-2">
                  <span className="text-7xl font-normal leading-none tracking-tighter">
                    {weatherData.current.temperature ?? '–'}
                  </span>
                  <span className="text-xl mt-1 text-zinc-500 dark:text-zinc-400 font-light ml-1">°C</span>
                </div>

                <div className="text-sm text-zinc-600 dark:text-zinc-400 ml-2 flex flex-col justify-center">
                  <div>Kelembapan: {weatherData.current.humidity ?? '–'}%</div>
                  <div>Angin: {weatherData.current.windSpeed} km/h (hembusan {weatherData.current.windGust} km/h)</div>
                  {suitability && (
                    <span className={`mt-1 inline-flex w-fit items-center gap-1 border rounded-full px-2 py-0.5 text-xs font-medium ${suitability.className}`}>
                      <Wind className="w-3 h-3" /> {suitability.label}
                    </span>
                  )}
                </div>
              </div>

              <div className="text-right flex flex-col">
                <span className="text-2xl font-medium mb-1">Cuaca</span>
                <span className="text-zinc-500 dark:text-zinc-400 text-lg leading-tight capitalize">{todayLabel}</span>
                <span className="text-zinc-500 dark:text-zinc-400 text-lg leading-tight">
                  {isCloudyNow ? 'Berawan' : 'Cerah'}
                </span>
              </div>
            </div>

            {/* Wind Chart Section */}
            <div className="mt-10">
              <div className="flex items-center gap-2 text-sm font-medium text-zinc-900 dark:text-white border-b-2 border-blue-500 w-fit pb-2 mb-4">
                <Wind className="w-4 h-4 text-blue-500" /> Angin per Jam
              </div>

              {chart && hourlyData.length > 0 ? (
                <div className="w-full">
                  <svg viewBox={`0 0 ${chart.width} ${chart.height}`} className="w-full h-36" preserveAspectRatio="none">
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
                    <path d={chart.linePath} fill="none" stroke={chartColors.line} strokeWidth={2.5} strokeLinecap="round" />
                    {chart.points.map((p, i) => (
                      <circle key={i} cx={p.x} cy={p.y} r={i === chart.points.length - 1 ? 4 : 2.5} fill={i === chart.points.length - 1 ? chartColors.now : chartColors.line} />
                    ))}
                  </svg>

                  <div className="flex justify-between items-end mt-2 pb-2 overflow-x-auto gap-2">
                    {chart.markerIdx.map((idx) => {
                      const point = hourlyData[idx];
                      if (!point) return null;
                      const isNow = idx === hourlyData.length - 1;
                      // Wind direction: 0° = North (up), 90° = East (right), etc.
                      // ArrowUp points up by default (0°), so we rotate accordingly
                      const windDirection = point.windDirection || 0;
                      
                      return (
                        <div key={idx} className="flex flex-col items-center gap-1 min-w-[44px]">
                          <span className={`text-[12px] ${isNow ? 'text-blue-500 dark:text-blue-300 font-semibold' : 'text-zinc-700 dark:text-zinc-200'}`}>
                            {Math.round(point.windSpeed)} km/h
                          </span>
                          <ArrowUp 
                            className={`${isNow ? 'w-5 h-5 text-blue-500 dark:text-blue-300' : 'w-4 h-4 text-zinc-400'}`} 
                            style={{ 
                              transform: `rotate(${windDirection}deg)`,
                              transition: 'transform 0.3s ease'
                            }} 
                          />
                          <span className="text-[11px] text-zinc-500 dark:text-zinc-400">{point.time}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="text-sm text-zinc-500 py-8 text-center">Belum ada data angin untuk lokasi ini.</div>
              )}
            </div>

            {/* Daily Forecast */}
            {weatherData.daily.length > 0 && (
              <div className="flex justify-between items-center mt-6 pt-2 overflow-x-auto gap-1">
                {weatherData.daily.map((day, idx) => (
                  <div key={idx} className={`flex flex-col items-center gap-3 px-3 py-4 rounded-2xl w-16 shrink-0 ${day.isToday ? 'bg-zinc-100 dark:bg-zinc-800' : 'bg-transparent'}`}>
                    <span className="text-[15px] text-zinc-700 dark:text-zinc-200">{day.day}</span>
                    <div className="relative w-8 h-8 flex justify-center items-center">
                      <div className="absolute w-6 h-6 bg-yellow-400 rounded-full blur-[0.5px]" />
                      {day.cloudy && (
                        <div className="absolute -bottom-1 -right-1 w-6 h-4 bg-gray-300 dark:bg-gray-600 rounded-full blur-[0.5px] opacity-90 z-10" />
                      )}
                    </div>
                    <div className="text-[13px] text-zinc-500 dark:text-zinc-400 font-medium whitespace-nowrap mt-1">
                      <span className="text-zinc-900 dark:text-white mr-1">{day.tempMax}°</span>
                      {day.tempMin}°
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}