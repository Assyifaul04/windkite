// components/weather-map.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import { Cloud, Wind, Thermometer, CloudRain, Gauge } from 'lucide-react';

let L: any = null;
let leafletLoaded = false;

const loadLeaflet = async () => {
  if (leafletLoaded) return L;

  try {
    const leafletModule = await import('leaflet');
    L = leafletModule.default;

    await import('leaflet/dist/leaflet.css');

    if (L && L.Icon && L.Icon.Default) {
      // @ts-ignore
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });
    }

    leafletLoaded = true;
    return L;
  } catch (error) {
    console.error('Failed to load Leaflet:', error);
    return null;
  }
};

export interface MapLocation {
  name: string;
  lat: number;
  lng: number;
  province: string;
  regency?: string;
  district?: string;
  village?: string;
  isPending?: boolean;
}

interface WeatherMapProps {
  apiKey: string;
  locations: MapLocation[];
  selectedLocation: MapLocation | null;
  onSelectLocation: (loc: MapLocation) => void;
  pendingLocations?: MapLocation[];
  height?: number;
}

type WeatherLayerKey =
  | 'precipitation_new'
  | 'clouds_new'
  | 'wind_new'
  | 'temp_new'
  | 'pressure_new'
  | null;

const LAYER_OPTIONS: { key: WeatherLayerKey; label: string; icon: any }[] = [
  { key: 'precipitation_new', label: 'Hujan', icon: CloudRain },
  { key: 'clouds_new', label: 'Awan', icon: Cloud },
  { key: 'wind_new', label: 'Angin', icon: Wind },
  { key: 'temp_new', label: 'Suhu', icon: Thermometer },
  { key: 'pressure_new', label: 'Tekanan', icon: Gauge },
];

export default function WeatherMap({
  apiKey,
  locations,
  selectedLocation,
  onSelectLocation,
  pendingLocations = [],
  height = 400,
}: WeatherMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const weatherLayerRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const [activeLayer, setActiveLayer] = useState<WeatherLayerKey>('precipitation_new');
  const [isMounted, setIsMounted] = useState(false);
  const [isLeafletReady, setIsLeafletReady] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const initLeaflet = async () => {
      const leaflet = await loadLeaflet();
      if (leaflet) {
        L = leaflet;
        setIsLeafletReady(true);
      }
    };
    initLeaflet();
    return () => setIsMounted(false);
  }, []);

  // Init map
  useEffect(() => {
    if (!isMounted || !isLeafletReady || !containerRef.current || mapRef.current || !L) return;

    // Default center - menggunakan pusat Jember
    const map = L.map(containerRef.current, {
      center: [-8.1724, 113.7003],
      zoom: 10,
      minZoom: 4,
      maxZoom: 18,
      scrollWheelZoom: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    mapRef.current = map;

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [isMounted, isLeafletReady]);

  // Weather layer
  useEffect(() => {
    if (!isMounted || !isLeafletReady || !mapRef.current || !L) return;
    const map = mapRef.current;
    if (weatherLayerRef.current) {
      map.removeLayer(weatherLayerRef.current);
      weatherLayerRef.current = null;
    }
    if (activeLayer && apiKey) {
      const layer = L.tileLayer(
        `https://tile.openweathermap.org/map/${activeLayer}/{z}/{x}/{y}.png?appid=${apiKey}`,
        { 
          opacity: 0.65, 
          maxZoom: 18,
          attribution: '&copy; <a href="https://openweathermap.org/">OpenWeatherMap</a>'
        }
      );
      layer.addTo(map);
      weatherLayerRef.current = layer;
    }
  }, [activeLayer, apiKey, isMounted, isLeafletReady]);

  const getMarkerIcon = (type: 'saved' | 'selected' | 'pending') => {
    const styles = {
      saved: { color: '#ef4444', shadow: 'rgba(239,68,68,0.3)', size: 14 },
      selected: { color: '#10b981', shadow: 'rgba(16,185,129,0.4)', size: 20 },
      pending: { color: '#f59e0b', shadow: 'rgba(245,158,11,0.4)', size: 16 },
    };
    return styles[type];
  };

  // Redraw location markers
  useEffect(() => {
    if (!isMounted || !isLeafletReady || !mapRef.current || !L) return;

    const map = mapRef.current;

    // Bersihkan marker lama
    markersRef.current.forEach((m) => map.removeLayer(m));
    markersRef.current = [];

    // Render Marker Lokasi Tersimpan
    locations.forEach((loc) => {
      // Validasi koordinat
      if (typeof loc.lat !== 'number' || typeof loc.lng !== 'number') {
        console.warn('Invalid coordinates for location:', loc);
        return;
      }

      const isSelected = selectedLocation?.name === loc.name && 
                         selectedLocation?.lat === loc.lat && 
                         selectedLocation?.lng === loc.lng;
      const style = getMarkerIcon(isSelected ? 'selected' : 'saved');
      const containerSize = style.size + 12;

      const icon = L.divIcon({
        className: 'wk-marker',
        html: `
          <div style="
            width:${containerSize}px;
            height:${containerSize}px;
            position:relative;
            display:flex;
            align-items:center;
            justify-content:center;
          ">
            <div style="
              position:absolute;
              inset:0;
              border-radius:9999px;
              background:${style.shadow};
              animation:${isSelected ? 'pulse 1.5s ease-in-out infinite' : 'none'};
            "></div>
            <div style="
              width:${style.size}px;
              height:${style.size}px;
              border-radius:9999px;
              background:${style.color};
              border:2px solid white;
              box-shadow:0 2px 6px rgba(0,0,0,0.3);
              position:relative;
              z-index:1;
            "></div>
          </div>
        `,
        iconSize: [containerSize, containerSize],
        iconAnchor: [containerSize / 2, containerSize / 2],
      });

      const locationInfo = loc.village || loc.district || loc.name;
      const tooltipText = isSelected 
        ? `<b>${locationInfo}</b><br/>📍 ${loc.province}${loc.regency ? `, ${loc.regency}` : ''}<br/><span style="color:#10b981;">✓ Dipilih</span>`
        : `<b>${locationInfo}</b><br/>📍 ${loc.province}${loc.regency ? `, ${loc.regency}` : ''}`;

      const marker = L.marker([loc.lat, loc.lng], { icon })
        .addTo(map)
        .bindTooltip(tooltipText, { 
          direction: 'top', 
          offset: [0, -(containerSize / 2)],
          className: 'custom-tooltip',
          permanent: false,
          interactive: true,
        })
        .on('click', () => {
          onSelectLocation(loc);
        });

      markersRef.current.push(marker);
    });

    // Render Marker Pending Locations
    pendingLocations.forEach((loc) => {
      if (typeof loc.lat !== 'number' || typeof loc.lng !== 'number') {
        console.warn('Invalid coordinates for pending location:', loc);
        return;
      }

      const style = getMarkerIcon('pending');
      const containerSize = style.size + 12;

      const icon = L.divIcon({
        className: 'wk-marker-pending',
        html: `
          <div style="
            width:${containerSize}px;
            height:${containerSize}px;
            position:relative;
            display:flex;
            align-items:center;
            justify-content:center;
          ">
            <div style="
              position:absolute;
              inset:0;
              border-radius:9999px;
              background:${style.shadow};
              animation:pulse 2s ease-in-out infinite;
            "></div>
            <div style="
              width:${style.size}px;
              height:${style.size}px;
              border-radius:9999px;
              background:${style.color};
              border:2px solid white;
              box-shadow:0 2px 6px rgba(0,0,0,0.3);
              position:relative;
              z-index:1;
              display:flex;
              align-items:center;
              justify-content:center;
              color:white;
              font-size:9px;
              font-weight:bold;
            ">?</div>
          </div>
        `,
        iconSize: [containerSize, containerSize],
        iconAnchor: [containerSize / 2, containerSize / 2],
      });

      const locationInfo = loc.village || loc.district || loc.name;
      const marker = L.marker([loc.lat, loc.lng], { icon })
        .addTo(map)
        .bindTooltip(
          `<b>${locationInfo}</b><br/>🟡 <span style="color:#f59e0b;">Belum disimpan</span>`,
          { direction: 'top', offset: [0, -(containerSize / 2)] }
        );

      markersRef.current.push(marker);
    });

    // CSS styling kustom
    if (typeof document !== 'undefined') {
      const styleId = 'weather-map-custom-styles';
      if (!document.getElementById(styleId)) {
        const styleEl = document.createElement('style');
        styleEl.id = styleId;
        styleEl.textContent = `
          @keyframes pulse {
            0%, 100% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.25); opacity: 0.5; }
          }
          .custom-tooltip {
            background: rgba(15, 23, 42, 0.85) !important;
            backdrop-filter: blur(4px) !important;
            border: 1px solid rgba(255,255,255,0.15) !important;
            border-radius: 6px !important;
            padding: 4px 8px !important;
            color: white !important;
            font-size: 11px !important;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3) !important;
          }
          .custom-tooltip::before {
            border-top-color: rgba(15, 23, 42, 0.85) !important;
          }
        `;
        document.head.appendChild(styleEl);
      }
    }
  }, [locations, pendingLocations, selectedLocation, onSelectLocation, isMounted, isLeafletReady]);

  // Fly to selected location
  useEffect(() => {
    if (isMounted && isLeafletReady && selectedLocation && mapRef.current) {
      // Validasi koordinat
      if (typeof selectedLocation.lat === 'number' && typeof selectedLocation.lng === 'number') {
        mapRef.current.flyTo([selectedLocation.lat, selectedLocation.lng], 12, { 
          duration: 0.8,
          easeLinearity: 0.25,
        });
      }
    }
  }, [selectedLocation, isMounted, isLeafletReady]);

  if (!isMounted || !isLeafletReady) {
    return (
      <div
        className="relative rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 animate-pulse flex items-center justify-center"
        style={{ height }}
      >
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 rounded-full border-4 border-slate-300 dark:border-slate-600 border-t-slate-600 dark:border-t-slate-300 animate-spin" />
          <p className="text-sm text-muted-foreground">Loading map...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="relative rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700"
      style={{ height }}
    >
      <div ref={containerRef} className="w-full h-full z-0" />

      {/* Layer switcher */}
      <div className="absolute top-2 left-2 z-[500] flex flex-col gap-1 bg-white/90 dark:bg-slate-900/90 backdrop-blur rounded-lg p-1 shadow-md">
        {LAYER_OPTIONS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            type="button"
            onClick={() => setActiveLayer((prev) => (prev === key ? null : key))}
            className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium transition-colors ${
              activeLayer === key
                ? 'bg-sky-500 text-white'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
            title={label}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        ))}
      </div>

      {!apiKey && (
        <div className="absolute inset-x-0 bottom-0 z-[500] bg-yellow-500/90 text-white text-[11px] text-center py-1 px-2">
          Masukkan & simpan API Key OpenWeatherMap untuk menampilkan overlay cuaca
        </div>
      )}

      {/* Legend */}
      <div className="absolute bottom-2 right-2 z-[500] bg-black/70 backdrop-blur-sm px-3 py-2 rounded-lg text-[10px] text-white space-y-1 border border-white/10">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-red-500 inline-block shadow-lg" />
          <span>Lokasi Tersimpan</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-green-500 inline-block shadow-lg ring-2 ring-green-500/50" />
          <span>Lokasi Dipilih</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-amber-500 inline-block shadow-lg animate-pulse" />
          <span>Belum Disimpan</span>
        </div>
      </div>

      {/* Info counter */}
      <div className="absolute top-2 right-2 z-[500] bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-lg text-[10px] text-white/80 border border-white/10">
        <span>📍 {locations.length + pendingLocations.length} lokasi</span>
        {pendingLocations.length > 0 && (
          <span className="ml-2 text-amber-400">+{pendingLocations.length} pending</span>
        )}
      </div>
    </div>
  );
}