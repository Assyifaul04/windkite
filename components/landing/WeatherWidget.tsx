// components/landing/WeatherWidget.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTheme } from 'next-themes';
import { 
  MapPin, Search, ArrowUp, Sun, Cloud, Wind, Loader2, AlertCircle, 
  X, Droplets, Thermometer, Compass, Calendar, CloudRain, 
  Moon, CloudSun, Sunrise, Sunset, Gauge 
} from 'lucide-react';
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

interface ForecastPoint {
  timestamp: Date;
  time: string;
  date: string;
  temperature: number | null;
  humidity: number | null;
  windSpeed: number;
  windGust: number;
  windDirection: number;
  kiteSuitability: KiteSuitability;
  weatherDesc: string | null;
  isDaytime: boolean | null;
  precipitation?: number;
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
  forecast?: ForecastPoint[];
}

interface WeatherWidgetProps {
  className?: string;
}

// ==========================================
// Utility & Constants
// ==========================================
const getWindDirectionText = (degrees: number): string => {
  const normalizedDeg = ((degrees % 360) + 360) % 360;
  const directions = ['Utara', 'Timur Laut', 'Timur', 'Tenggara', 'Selatan', 'Barat Daya', 'Barat', 'Barat Laut'];
  const sector = Math.round(normalizedDeg / 22.5) % 16;
  return directions[Math.floor(sector / 2)] || 'Tidak diketahui';
};

const getWindDirectionShort = (degrees: number): string => {
  const normalizedDeg = ((degrees % 360) + 360) % 360;
  const directions = ['U', 'TL', 'T', 'TG', 'S', 'BD', 'B', 'BL'];
  const sector = Math.round(normalizedDeg / 22.5) % 16;
  return directions[Math.floor(sector / 2)] || '?';
};

const roundNumber = (num: number, decimals: number = 1): number => {
  return Math.round(num * Math.pow(10, decimals)) / Math.pow(10, decimals);
};

// Palet dibatasi: hitam, putih, biru (zinc dipakai sebagai abu netral di antara hitam & putih)
const suitabilityMeta: Record<KiteSuitability, { label: string; className: string; icon: string }> = {
  TIDAK_LAYAK: { label: 'Tidak layak terbang', className: 'bg-zinc-900/5 text-zinc-700 dark:text-zinc-300 dark:bg-white/5 border-zinc-400/30', icon: '❌' },
  RINGAN: { label: 'Layangan ringan', className: 'bg-blue-400/10 text-blue-500 dark:text-blue-300 border-blue-400/30', icon: '🪁' },
  BERAT: { label: 'Layangan berat', className: 'bg-blue-600/10 text-blue-700 dark:text-blue-400 border-blue-600/30', icon: '💪' },
  SEMUA: { label: 'Semua jenis layangan', className: 'bg-blue-900/10 text-blue-900 dark:text-blue-300 dark:bg-blue-400/10 border-blue-900/30 dark:border-blue-400/30', icon: '✨' },
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
      <div className={`h-64 w-full rounded-xl ${isDark ? 'bg-zinc-800' : 'bg-zinc-100'}`} />
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

        const res = await fetch(`/api/weather?locationId=${encodeURIComponent(selectedId)}&includeForecast=true`);
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
  
  // Palet grafik dibatasi ke biru (aktual & prediksi) + abu netral untuk garis bantu
  const chartColors = {
    line: '#2563eb',           // biru - data aktual
    lineForecast: '#93c5fd',   // biru muda - prediksi
    fill: 'rgba(37,99,235,0.15)',
    fillForecast: 'rgba(147,197,253,0.15)',
    grid: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
    dot: '#2563eb',
    dotForecast: '#93c5fd',
    dotNow: '#1e3a8a',
    text: isDark ? '#9ca3af' : '#71717a',
    separator: isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.2)',
  };

  const hourlyData = useMemo(() => {
    if (!weatherData?.hourly) return [];
    return [...weatherData.hourly].sort((a, b) => {
      if (a.timestamp && b.timestamp) {
        return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
      }
      return 0;
    });
  }, [weatherData]);

  // Gabungkan hourly dan forecast untuk grafik
  const allHourlyData = useMemo(() => {
    const hourly = hourlyData.map(h => ({
      ...h,
      isForecast: false,
    }));
    
    const forecast = (weatherData?.forecast || []).map(f => ({
      time: f.time,
      timestamp: f.timestamp.toString(),
      temp: f.temperature ?? 0,
      humidity: f.humidity ?? 0,
      windSpeed: f.windSpeed,
      windGust: f.windGust,
      windDirection: f.windDirection,
      kiteSuitability: f.kiteSuitability,
      isForecast: true,
    }));
    
    return [...hourly, ...forecast];
  }, [hourlyData, weatherData]);

  // Chart - dibuat lebih besar & scrollable secara horizontal
  const chart = useMemo(() => {
    const data = allHourlyData;
    if (data.length === 0) return null;

    // Lebar dasar per titik data agar grafik tetap lega saat data banyak (scrollable)
    const perPoint = 70;
    const width = Math.max(900, data.length * perPoint);
    const height = 320;
    const padTop = 36;
    const padBottom = 46;
    const padLeft = 56;
    const padRight = 24;

    const speeds = data.map((h) => h.windSpeed);
    const maxSpeed = Math.max(...speeds, 5);
    const minSpeed = 0;
    const range = maxSpeed - minSpeed || 1;

    const chartWidth = width - padLeft - padRight;
    const chartHeight = height - padTop - padBottom;

    const points = data.map((h, i) => {
      const x = padLeft + (i / (data.length - 1 || 1)) * chartWidth;
      const y = padTop + chartHeight - ((h.windSpeed - minSpeed) / range) * chartHeight;
      return { x, y, speed: h.windSpeed, isForecast: h.isForecast };
    });

    // Cari titik tengah untuk garis pemisah (hari ini vs besok)
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    let separatorIndex = -1;
    for (let i = 0; i < data.length; i++) {
      const item = data[i];
      if (item.timestamp) {
        const date = new Date(item.timestamp);
        if (date >= tomorrow) {
          separatorIndex = i;
          break;
        }
      }
    }
    // Jika tidak ditemukan, gunakan 2/3 dari data
    if (separatorIndex === -1) {
      separatorIndex = Math.floor(data.length * 0.6);
    }

    // Y-axis labels (5 steps)
    const ySteps = 5;
    const yLabels = [];
    for (let i = 0; i <= ySteps; i++) {
      const value = minSpeed + (i / ySteps) * range;
      yLabels.push({
        value: roundNumber(value, 1),
        y: padTop + chartHeight - (i / ySteps) * chartHeight
      });
    }

    // X-axis labels: tampilkan setiap titik karena grafik sudah lebar & scrollable
    const labelIndices = Array.from({ length: data.length }, (_, i) => i);

    // Pisahkan data real dan forecast untuk garis
    const realPoints = points.filter((_, i) => !data[i].isForecast);
    const forecastPoints = points.filter((_, i) => data[i].isForecast);
    
    const realPath = buildSmoothPath(realPoints);
    const forecastPath = buildSmoothPath(forecastPoints);
    
    // Area path
    const areaPath = points.length > 0 
      ? `${buildSmoothPath(points)} L ${points[points.length - 1].x} ${height - padBottom} L ${points[0].x} ${height - padBottom} Z` 
      : '';

    return { 
      width, 
      height, 
      padTop, 
      padBottom, 
      padLeft, 
      padRight,
      points, 
      realPath,
      forecastPath,
      areaPath, 
      labelIndices,
      yLabels,
      data,
      maxSpeed,
      minSpeed,
      chartHeight,
      chartWidth,
      separatorIndex,
      realPoints,
      forecastPoints,
    };
  }, [allHourlyData]);

  const suitability = weatherData ? suitabilityMeta[weatherData.current.kiteSuitability] : null;
  const todayLabel = new Date().toLocaleDateString('id-ID', { weekday: 'long' });
  const isCloudyNow = (weatherData?.current.humidity ?? 0) > 70;

  const formattedLocation = weatherData?.location ? {
    ...weatherData.location,
    latitude: roundNumber(weatherData.location.latitude, 2),
    longitude: roundNumber(weatherData.location.longitude, 2)
  } : null;

  const windDirectionText = weatherData?.current?.windDirection !== undefined 
    ? getWindDirectionText(weatherData.current.windDirection) 
    : 'Tidak diketahui';

  const windDirectionShort = weatherData?.current?.windDirection !== undefined
    ? getWindDirectionShort(weatherData.current.windDirection)
    : '?';

  const roundedWindSpeed = weatherData?.current?.windSpeed !== undefined 
    ? roundNumber(weatherData.current.windSpeed, 1) 
    : 0;
  const roundedWindGust = weatherData?.current?.windGust !== undefined 
    ? roundNumber(weatherData.current.windGust, 1) 
    : 0;

  // Ambil data forecast untuk daily
  const forecastData = weatherData?.forecast || [];
  
  // Buat daily forecast dari data forecast
  const dailyForecast = useMemo(() => {
    const dailyMap = new Map();
    forecastData.forEach(f => {
      const date = new Date(f.timestamp);
      const dateKey = date.toDateString();
      if (!dailyMap.has(dateKey)) {
        dailyMap.set(dateKey, {
          day: date.toLocaleDateString('id-ID', { weekday: 'short' }),
          tempMax: f.temperature || 0,
          tempMin: f.temperature || 0,
          isToday: dateKey === new Date().toDateString(),
          cloudy: f.weatherDesc?.includes('cloud') || f.weatherDesc?.includes('rain') || false,
          weatherDesc: f.weatherDesc || '',
        });
      } else {
        const existing = dailyMap.get(dateKey);
        existing.tempMax = Math.max(existing.tempMax, f.temperature || 0);
        existing.tempMin = Math.min(existing.tempMin, f.temperature || 0);
      }
    });
    return Array.from(dailyMap.values()).slice(0, 8);
  }, [forecastData]);

  const getWeatherIcon = (cloudy: boolean, isToday: boolean) => {
    if (isToday) {
      return cloudy ? <Cloud className="w-5 h-5 text-zinc-500 dark:text-zinc-300" /> : <Sun className="w-5 h-5 text-blue-500 fill-blue-500/20" />;
    }
    return cloudy ? <Cloud className="w-5 h-5 text-zinc-400/60" /> : <Sun className="w-5 h-5 text-blue-400/50 fill-blue-400/10" />;
  };

  return (
    <div className={`flex-1 flex flex-col items-center w-full bg-white dark:bg-black text-zinc-900 dark:text-white min-h-screen px-3 sm:px-4 py-4 md:py-8 font-sans transition-colors ${className}`}>
      
      {/* Header Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-5xl w-full mb-6"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <div className="p-1.5 bg-blue-600/10 rounded-lg shrink-0">
              <MapPin className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="min-w-0">
              <h3 className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Lokasi Pantauan</h3>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-base font-semibold text-zinc-900 dark:text-white truncate max-w-[220px] sm:max-w-none">
                  {formattedLocation?.name || 'Memuat...'}
                </span>
                <span className="text-[10px] text-zinc-500 dark:text-zinc-400 whitespace-nowrap">
                  {formattedLocation?.latitude?.toFixed(2)}, {formattedLocation?.longitude?.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Search Dropdown */}
          <div className="relative w-full sm:w-64 shrink-0">
            <div className="flex items-center bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-1.5 focus-within:ring-2 focus-within:ring-blue-500/50 focus-within:border-blue-500 transition-all duration-200">
              {loadingLocations ? (
                <Loader2 className="w-3.5 h-3.5 text-blue-500 animate-spin mr-2 shrink-0" />
              ) : (
                <Search className="w-3.5 h-3.5 text-zinc-400 mr-2 shrink-0" />
              )}
              <input
                type="text"
                placeholder="Cari lokasi..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setShowDropdown(true); }}
                onFocus={() => setShowDropdown(true)}
                className="bg-transparent outline-none w-full min-w-0 text-sm text-zinc-700 dark:text-zinc-200 placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')} 
                  className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors shrink-0"
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
                  className="absolute z-20 mt-1 w-full bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-2xl overflow-hidden max-h-52 overflow-y-auto"
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
                        className={`w-full text-left px-3 py-2 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors flex items-center justify-between gap-2 ${
                          selectedId === loc.id ? 'bg-blue-50 dark:bg-blue-950/40 font-medium text-blue-600 dark:text-blue-400' : ''
                        }`}
                      >
                        <span className="truncate">{loc.name}</span>
                        {selectedId === loc.id && (
                          <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
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
          className="max-w-5xl w-full mb-4 p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded-lg flex items-start gap-2"
        >
          <AlertCircle className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
          <div className="text-xs text-blue-900 dark:text-blue-200">
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
        className="max-w-5xl w-full bg-white dark:bg-black rounded-2xl p-4 sm:p-5 md:p-7 shadow-2xl shadow-blue-500/10 border border-zinc-200 dark:border-zinc-800 transition-colors relative overflow-hidden"
      >
        {error && (
          <div className="flex items-center gap-2 text-zinc-900 dark:text-white text-sm mb-3">
            <AlertCircle className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" /> {error}
          </div>
        )}

        {loadingWeather && !error && (
          <div className="py-3">
            <WeatherSkeleton isDark={isDark} />
          </div>
        )}

        {!loadingWeather && weatherData && !error && (
          <div className="relative z-10">
            {/* Top Section - Current Weather */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 pb-4 border-b border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
                <div className="relative shrink-0">
                  <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br ${isCloudyNow ? 'from-zinc-400/20 to-zinc-500/10' : 'from-blue-400/20 to-blue-600/10'} flex items-center justify-center`}>
                    {isCloudyNow ? (
                      <Cloud className="w-8 h-8 sm:w-9 sm:h-9 text-zinc-500 dark:text-zinc-300" />
                    ) : (
                      <Sun className="w-8 h-8 sm:w-9 sm:h-9 text-blue-500 fill-blue-500/20" />
                    )}
                  </div>
                </div>

                <div>
                  <div className="flex items-start">
                    <span className="text-4xl sm:text-5xl md:text-6xl font-bold leading-none tracking-tighter text-zinc-900 dark:text-white">
                      {weatherData.current.temperature !== null ? roundNumber(weatherData.current.temperature, 1) : '–'}
                    </span>
                    <span className="text-xl sm:text-2xl mt-1 text-zinc-400 font-light ml-0.5">°C</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="text-sm text-zinc-500 dark:text-zinc-400 capitalize">
                      {isCloudyNow ? '☁️ Berawan' : '☀️ Cerah'}
                    </span>
                    <span className="text-zinc-300 dark:text-zinc-600">•</span>
                    <span className="text-sm text-zinc-500 dark:text-zinc-400 capitalize">
                      {todayLabel}
                    </span>
                  </div>
                </div>
              </div>

              {/* Weather Stats */}
              <div className="grid grid-cols-3 gap-1.5 sm:gap-2 w-full lg:w-auto">
                <div className="bg-zinc-50 dark:bg-zinc-900 rounded-xl px-2 sm:px-3 py-1.5 sm:py-2 text-center min-w-0 sm:min-w-[70px] border border-zinc-200 dark:border-zinc-800">
                  <Droplets className="w-4 h-4 text-blue-500 mx-auto mb-1" />
                  <div className="text-sm font-semibold text-zinc-900 dark:text-white">
                    {weatherData.current.humidity !== null ? roundNumber(weatherData.current.humidity, 0) : '–'}%
                  </div>
                  <div className="text-[10px] text-zinc-500 dark:text-zinc-400">Kelembapan</div>
                </div>
                <div className="bg-zinc-50 dark:bg-zinc-900 rounded-xl px-2 sm:px-3 py-1.5 sm:py-2 text-center min-w-0 sm:min-w-[70px] border border-zinc-200 dark:border-zinc-800">
                  <Wind className="w-4 h-4 text-blue-500 mx-auto mb-1" />
                  <div className="text-sm font-semibold text-zinc-900 dark:text-white">
                    {roundedWindSpeed} <span className="text-[10px] font-normal text-zinc-500 dark:text-zinc-400">km/h</span>
                  </div>
                  <div className="text-[10px] text-zinc-500 dark:text-zinc-400">Angin</div>
                </div>
                <div className="bg-zinc-50 dark:bg-zinc-900 rounded-xl px-2 sm:px-3 py-1.5 sm:py-2 text-center min-w-0 sm:min-w-[70px] border border-zinc-200 dark:border-zinc-800">
                  <Compass className="w-4 h-4 text-blue-500 mx-auto mb-1" />
                  <div className="text-sm font-semibold text-zinc-900 dark:text-white">
                    {windDirectionShort}
                  </div>
                  <div className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate">{windDirectionText}</div>
                </div>
              </div>
            </div>

            {/* Suitability Badge */}
            {suitability && (
              <div className="mt-4 flex items-center gap-3 flex-wrap">
                <span className={`inline-flex items-center gap-2 border rounded-full px-3 py-1 text-xs font-medium ${suitability.className}`}>
                  <span className="text-base">{suitability.icon}</span>
                  {suitability.label}
                </span>
                <span className="text-[10px] text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
                  <Gauge className="w-3 h-3" />
                  Hembusan {roundedWindGust} km/h
                </span>
              </div>
            )}

            {/* Wind Chart Section - Lebih besar & bisa di-scroll */}
            <div className="mt-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-1.5 bg-blue-600/10 rounded-lg shrink-0">
                  <Gauge className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
                <h4 className="text-sm font-semibold text-zinc-900 dark:text-white whitespace-nowrap">Kecepatan Angin per Jam</h4>
                <div className="flex-1 h-px bg-gradient-to-r from-zinc-200 dark:from-zinc-800 to-transparent" />
              </div>

              {chart && allHourlyData.length > 0 ? (
                <div className="w-full bg-zinc-50 dark:bg-zinc-900/60 rounded-xl p-2 sm:p-3 border border-zinc-200 dark:border-zinc-800">
                  {/* Wrapper scrollable secara horizontal, grafik dirender pada lebar tetap sesuai jumlah titik data */}
                  <div className="w-full overflow-x-auto">
                    <svg
                      viewBox={`0 0 ${chart.width} ${chart.height}`}
                      style={{ width: chart.width, height: 260, minWidth: chart.width }}
                      className="sm:!h-[300px]"
                      preserveAspectRatio="xMidYMid meet"
                    >
                      <defs>
                        <linearGradient id="windFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={chartColors.fill} />
                          <stop offset="100%" stopColor="rgba(37,99,235,0.02)" />
                        </linearGradient>
                        <linearGradient id="forecastFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={chartColors.fillForecast} />
                          <stop offset="100%" stopColor="rgba(147,197,253,0.02)" />
                        </linearGradient>
                      </defs>
                      
                      {/* Y-axis grid lines */}
                      {chart.yLabels.map((label, i) => (
                        <g key={i}>
                          <line
                            x1={chart.padLeft}
                            y1={label.y}
                            x2={chart.width - chart.padRight}
                            y2={label.y}
                            stroke={chartColors.grid}
                            strokeWidth={1}
                            strokeDasharray="5 5"
                          />
                          <text
                            x={chart.padLeft - 10}
                            y={label.y + 4}
                            textAnchor="end"
                            className="text-[12px] fill-zinc-400 dark:fill-zinc-500 font-medium"
                          >
                            {label.value}
                          </text>
                        </g>
                      ))}

                      {/* Separator line (hari ini vs besok) */}
                      {chart.separatorIndex > 0 && chart.separatorIndex < chart.points.length && (
                        <line
                          x1={chart.points[chart.separatorIndex].x}
                          y1={chart.padTop}
                          x2={chart.points[chart.separatorIndex].x}
                          y2={chart.height - chart.padBottom}
                          stroke={chartColors.separator}
                          strokeWidth={2}
                          strokeDasharray="8 6"
                        />
                      )}

                      {/* Area fill - real data */}
                      {chart.areaPath && (
                        <path 
                          d={chart.areaPath} 
                          fill="url(#windFill)" 
                          stroke="none" 
                          opacity="0.6"
                        />
                      )}

                      {/* Area fill - forecast */}
                      {chart.forecastPath && chart.forecastPoints.length > 0 && (
                        <path 
                          d={`${chart.forecastPath} L ${chart.forecastPoints[chart.forecastPoints.length - 1].x} ${chart.height - chart.padBottom} L ${chart.forecastPoints[0].x} ${chart.height - chart.padBottom} Z`}
                          fill="url(#forecastFill)" 
                          stroke="none" 
                          opacity="0.4"
                        />
                      )}
                      
                      {/* Line - real data */}
                      {chart.realPath && (
                        <path 
                          d={chart.realPath} 
                          fill="none" 
                          stroke={chartColors.line} 
                          strokeWidth={3.5} 
                          strokeLinecap="round" 
                          strokeLinejoin="round"
                        />
                      )}
                      
                      {/* Line - forecast (putus-putus) */}
                      {chart.forecastPath && chart.forecastPoints.length > 1 && (
                        <path 
                          d={chart.forecastPath} 
                          fill="none" 
                          stroke={chartColors.lineForecast} 
                          strokeWidth={3.5} 
                          strokeLinecap="round" 
                          strokeLinejoin="round"
                          strokeDasharray="8 5"
                        />
                      )}
                      
                      {/* Points - real data */}
                      {chart.points.map((p, i) => {
                        const isForecast = allHourlyData[i]?.isForecast || false;
                        const isLast = i === chart.points.length - 1;
                        if (isForecast) return null;
                        return (
                          <circle 
                            key={`real-${i}`} 
                            cx={p.x} 
                            cy={p.y} 
                            r={isLast ? 6 : 5} 
                            fill={isLast ? chartColors.dotNow : chartColors.dot} 
                            stroke="white" 
                            strokeWidth="2"
                          />
                        );
                      })}
                      
                      {/* Points - forecast */}
                      {chart.points.map((p, i) => {
                        const isForecast = allHourlyData[i]?.isForecast || false;
                        if (!isForecast) return null;
                        return (
                          <circle 
                            key={`forecast-${i}`} 
                            cx={p.x} 
                            cy={p.y} 
                            r={5} 
                            fill={chartColors.dotForecast} 
                            stroke="white" 
                            strokeWidth="2"
                          />
                        );
                      })}

                      {/* Separator label */}
                      {chart.separatorIndex > 0 && chart.separatorIndex < chart.points.length && (
                        <text
                          x={chart.points[chart.separatorIndex].x}
                          y={chart.padTop - 10}
                          textAnchor="middle"
                          className="text-[10px] fill-zinc-400 dark:fill-zinc-500 font-medium"
                        >
                          │ Besok
                        </text>
                      )}

                      {/* X-axis labels */}
                      {chart.labelIndices.map((idx) => {
                        const point = allHourlyData[idx];
                        if (!point) return null;
                        const x = chart.points[idx]?.x || 0;
                        const isNow = idx === allHourlyData.length - 1;
                        const isForecast = point.isForecast;
                        
                        return (
                          <g key={idx}>
                            <text
                              x={x}
                              y={chart.height - 14}
                              textAnchor="middle"
                              className={`text-[11px] ${
                                isNow ? 'fill-blue-700 dark:fill-blue-400 font-bold' : 
                                isForecast ? 'fill-blue-400 dark:fill-blue-300' : 
                                'fill-zinc-500 dark:fill-zinc-400'
                              }`}
                            >
                              {point.time}
                            </text>
                            {isForecast && (
                              <text
                                x={x}
                                y={chart.height + 2}
                                textAnchor="middle"
                                className="text-[9px] fill-blue-400 dark:fill-blue-300 font-medium"
                              >
                                *
                              </text>
                            )}
                          </g>
                        );
                      })}

                      {/* Y-axis label */}
                      <text
                        x={12}
                        y={20}
                        className="text-[10px] fill-zinc-400 dark:fill-zinc-500 font-medium"
                      >
                        km/h
                      </text>
                    </svg>
                  </div>

                  {/* Legend */}
                  <div className="flex flex-wrap justify-center items-center gap-3 sm:gap-4 mt-2 text-[11px] sm:text-xs text-zinc-500 dark:text-zinc-400">
                    <span className="flex items-center gap-1.5">
                      <span className="w-4 h-0.5 bg-blue-600 rounded"></span>
                      Data Aktual
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-4 h-0.5 bg-blue-300 rounded border border-dashed border-blue-300"></span>
                      Prediksi
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-4 h-0.5 bg-zinc-400 rounded border border-dashed border-zinc-400"></span>
                      Batas Hari
                    </span>
                  </div>

                  <p className="text-[10px] text-zinc-400 dark:text-zinc-500 text-center mt-1.5">
                    Geser ke samping untuk melihat seluruh data →
                  </p>
                </div>
              ) : (
                <div className="text-sm text-zinc-500 py-8 text-center bg-zinc-50 dark:bg-zinc-900/60 rounded-xl border border-zinc-200 dark:border-zinc-800">
                  <Wind className="w-10 h-10 mx-auto mb-2 text-zinc-400/50" />
                  Belum ada data angin untuk lokasi ini.
                </div>
              )}
            </div>

            {/* Daily Forecast - 7 Hari */}
            <div className="mt-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-1.5 bg-blue-600/10 rounded-lg shrink-0">
                  <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
                <h4 className="text-sm font-semibold text-zinc-900 dark:text-white whitespace-nowrap">Prakiraan 7 Hari</h4>
                <div className="flex-1 h-px bg-gradient-to-r from-zinc-200 dark:from-zinc-800 to-transparent" />
              </div>

              <div className="flex sm:justify-between items-center overflow-x-auto gap-2 pb-1.5">
                {(dailyForecast.length > 0 ? dailyForecast : weatherData.daily).map((day, idx) => {
                  const isToday = day.isToday || (idx === 0 && !dailyForecast.length);
                  return (
                    <div 
                      key={idx}
                      className={`flex flex-col items-center gap-1.5 px-2.5 sm:px-3 py-2 sm:py-2.5 rounded-xl min-w-[48px] sm:min-w-[52px] shrink-0 transition-all duration-200 ${
                        isToday 
                          ? 'bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900' 
                          : 'hover:bg-zinc-50 dark:hover:bg-zinc-900 border border-transparent hover:border-zinc-200 dark:hover:border-zinc-800'
                      }`}
                    >
                      <span className={`text-xs font-medium ${isToday ? 'text-blue-600 dark:text-blue-400' : 'text-zinc-600 dark:text-zinc-300'}`}>
                        {day.day}
                      </span>
                      <div className="relative w-7 h-7 flex justify-center items-center">
                        {getWeatherIcon(day.cloudy, isToday)}
                      </div>
                      <div className="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium whitespace-nowrap flex items-center gap-0.5">
                        <span className={`${isToday ? 'text-blue-600 dark:text-blue-400' : 'text-zinc-900 dark:text-white'} font-semibold`}>
                          {roundNumber(day.tempMax, 0)}°
                        </span>
                        <span className="text-zinc-400">/</span>
                        <span className="text-zinc-500 dark:text-zinc-400">{roundNumber(day.tempMin, 0)}°</span>
                      </div>
                      {isToday && (
                        <span className="text-[6px] text-blue-600 dark:text-blue-400 font-medium bg-blue-500/10 px-1.5 py-0.5 rounded whitespace-nowrap">Hari ini</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Updated At */}
            <div className="mt-4 pt-3 border-t border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row gap-1 sm:gap-0 justify-between items-start sm:items-center">
              <p className="text-[9px] text-zinc-400 dark:text-zinc-500 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
                Data real-time & prediksi
              </p>
              <p className="text-[9px] text-zinc-400 dark:text-zinc-500">
                Diperbarui: {weatherData.current.updatedAt ? new Date(weatherData.current.updatedAt).toLocaleString('id-ID', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' }) : 'Belum diperbarui'}
              </p>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}