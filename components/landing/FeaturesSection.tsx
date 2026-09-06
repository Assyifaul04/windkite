// components/landing/FeaturesSection.tsx
'use client';

import { Cloud, Wind, MapPin, Compass, Activity, Image } from 'lucide-react';

const features = [
  {
    icon: Wind,
    title: 'Data Angin Real-time',
    description: 'Pantau kecepatan dan arah angin secara real-time dari berbagai lokasi.',
  },
  {
    icon: MapPin,
    title: 'Multi Lokasi',
    description: 'Pilih dari berbagai lokasi pantauan di seluruh Indonesia.',
  },
  {
    icon: Compass,
    title: 'Analisis Arah Angin',
    description: 'Visualisasi arah angin dengan wind rose dan grafik interaktif.',
  },
  {
    icon: Cloud,
    title: 'Prakiraan Cuaca',
    description: 'Dapatkan prakiraan cuaca dan kondisi angin untuk beberapa hari ke depan.',
  },
  {
    icon: Activity,
    title: 'Kelayakan Layangan',
    description: 'Informasi kelayakan bermain layangan berdasarkan kondisi angin.',
  },
  {
    icon: Image,
    title: 'Desain AI',
    description: 'Buat dan kustomisasi desain layangan dengan teknologi AI.',
  },
];

export default function FeaturesSection() {
  return (
    <section className="w-full bg-zinc-950 py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-white">
            Fitur <span className="text-yellow-400">Lengkap</span> untuk Pemantauan Angin
          </h2>
          <p className="mt-4 text-zinc-400 text-lg">
            Nikmati berbagai fitur canggih untuk pengalaman bermain layangan yang lebih baik.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className="bg-zinc-800/30 backdrop-blur-sm rounded-xl p-6 border border-zinc-700/50 hover:border-yellow-500/30 transition-all duration-300 hover:bg-zinc-800/50 group"
              >
                <div className="w-12 h-12 bg-yellow-500/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-yellow-500/20 transition-all">
                  <Icon className="w-6 h-6 text-yellow-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-zinc-400 text-sm leading-relaxed">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}