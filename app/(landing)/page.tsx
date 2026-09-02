'use client';

import { useState } from 'react';
import { MapPin, ArrowUp, ArrowUpRight, ArrowRight, ArrowDownRight, Sun } from 'lucide-react';

export default function LandingPage() {
  const [selectedRegion, setSelectedRegion] = useState('jakarta');

  const regions: Record<string, { name: string; speed: number; direction: number }> = {
    jakarta: { name: 'Jakarta (Lapangan Banteng)', speed: 14, direction: 45 },
    surabaya: { name: 'Surabaya (Kenjeran Beach)', speed: 22, direction: 120 },
    malang: { name: 'Malang (Arjowinangun)', speed: 3, direction: 200 },
    bandung: { name: 'Bandung (Tegallega)', speed: 16, direction: 90 },
  };

  const currentData = regions[selectedRegion];

  // Data mock untuk grafik per jam (seperti di gambar)
  const hourlyWind = [
    { speed: '5 km/h', time: '05.00', rotate: 'rotate-[225deg]' },
    { speed: '3 km/h', time: '08.00', rotate: 'rotate-[225deg]' },
    { speed: '10 km/h', time: '11.00', rotate: 'rotate-[315deg]' },
    { speed: '14 km/h', time: '14.00', rotate: 'rotate-0' }, // Current
    { speed: '10 km/h', time: '17.00', rotate: 'rotate-[315deg]' },
    { speed: '6 km/h', time: '20.00', rotate: 'rotate-[225deg]' },
    { speed: '3 km/h', time: '23.00', rotate: 'rotate-[225deg]' },
    { speed: '3 km/h', time: '02.00', rotate: 'rotate-[225deg]' },
  ];

  // Data mock untuk hari (seperti di gambar)
  const dailyForecast = [
    { day: 'Min', temp: '32° 22°', active: true },
    { day: 'Sen', temp: '32° 23°', active: false },
    { day: 'Sel', temp: '32° 23°', active: false, cloudy: true },
    { day: 'Rab', temp: '32° 23°', active: false, cloudy: true },
    { day: 'Kam', temp: '31° 22°', active: false },
    { day: 'Jum', temp: '31° 22°', active: false },
    { day: 'Sab', temp: '30° 22°', active: false, cloudy: true },
    { day: 'Min', temp: '30° 23°', active: false, cloudy: true },
  ];

  return (
    <div className="flex-1 flex flex-col items-center w-full bg-zinc-950 text-white min-h-screen px-4 py-8 md:py-12 font-sans">
      
      {/* Region Selector Header */}
      <div className="max-w-3xl w-full mb-8 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-zinc-300">
          <MapPin className="w-5 h-5 text-yellow-500" />
          <span className="text-sm font-medium">Lokasi Pantauan:</span>
        </div>
        <div className="flex flex-wrap gap-2 justify-center">
          {Object.keys(regions).map((key) => (
            <button
              key={key}
              onClick={() => setSelectedRegion(key)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                selectedRegion === key 
                  ? 'bg-yellow-500 text-black' 
                  : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
              }`}
            >
              {key.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Main Weather Widget Box */}
      <div className="max-w-3xl w-full bg-[#202124] rounded-2xl p-6 shadow-2xl">
        
        {/* Top Section */}
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-4">
            {/* Sun Icon */}
            <div className="w-16 h-16 bg-yellow-400 rounded-full flex items-center justify-center blur-[1px] shadow-[0_0_15px_rgba(250,204,21,0.4)]">
               <Sun className="w-10 h-10 text-yellow-100 fill-yellow-200" />
            </div>
            
            {/* Temperature */}
            <div className="flex items-start ml-2">
              <span className="text-7xl font-normal leading-none tracking-tighter">32</span>
              <span className="text-xl mt-1 text-zinc-400 font-light ml-1">°C | °F</span>
            </div>

            {/* Weather Details */}
            <div className="text-sm text-zinc-400 ml-4 flex flex-col justify-center">
              <div>Presipitasi: 10%</div>
              <div>Kelembapan: 67%</div>
              <div>Angin: {currentData.speed} km/h</div>
            </div>
          </div>

          {/* Right aligned status */}
          <div className="text-right flex flex-col">
            <span className="text-2xl font-medium text-white mb-1">Cuaca</span>
            <span className="text-zinc-400 text-lg leading-tight">Minggu</span>
            <span className="text-zinc-400 text-lg leading-tight">Cerah</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-6 mt-10 border-b border-zinc-700/50 text-sm font-medium">
          <span className="pb-3 text-zinc-400 cursor-pointer hover:text-zinc-200">Suhu</span>
          <span className="pb-3 text-zinc-400 cursor-pointer hover:text-zinc-200">Presipitasi</span>
          <span className="pb-3 text-white border-b-2 border-yellow-400 cursor-pointer">Angin</span>
        </div>

        {/* Hourly Forecast (Angin View) */}
        <div className="flex justify-between items-end mt-8 pb-4">
          {hourlyWind.map((item, idx) => (
            <div key={idx} className="flex flex-col items-center gap-6">
              <span className="text-[13px] text-zinc-200">{item.speed}</span>
              <ArrowUp className={`w-5 h-5 text-zinc-400 ${item.rotate} ${item.time === '14.00' ? 'w-6 h-6 text-indigo-300' : ''}`} />
              <span className="text-[13px] text-zinc-400">{item.time}</span>
            </div>
          ))}
        </div>

        {/* Daily Forecast */}
        <div className="flex justify-between items-center mt-6 pt-2">
          {dailyForecast.map((day, idx) => (
            <div 
              key={idx} 
              className={`flex flex-col items-center gap-3 px-3 py-4 rounded-2xl w-16 ${
                day.active ? 'bg-[#303134]' : 'bg-transparent'
              }`}
            >
              <span className="text-[15px] text-zinc-200">{day.day}</span>
              <div className="relative w-8 h-8 flex justify-center items-center">
                <div className="absolute w-6 h-6 bg-yellow-400 rounded-full blur-[0.5px]"></div>
                {day.cloudy && (
                   <div className="absolute -bottom-1 -right-1 w-6 h-4 bg-gray-200 rounded-full blur-[0.5px] opacity-90 z-10"></div>
                )}
              </div>
              <div className="text-[13px] text-zinc-400 font-medium whitespace-nowrap mt-1">
                <span className="text-white mr-1">{day.temp.split(' ')[0]}</span> 
                {day.temp.split(' ')[1]}
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}