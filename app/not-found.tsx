// app/not-found.tsx
'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Home, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().catch(() => {
        // Ignore autoplay error
      });
    }
  }, []);

  return (
    <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center px-4 py-8">
      <div className="max-w-6xl w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          
          {/* Kolom Kiri - Video Logo */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="flex justify-center"
          >
            <div className="relative w-full max-w-md aspect-square">
              {/* Background Glow */}
              <div className="absolute -inset-4 bg-blue-500/10 rounded-3xl blur-3xl animate-pulse" />
              
              {/* Container Video */}
              <div className="relative w-full h-full bg-gradient-to-br from-zinc-100 to-zinc-200 dark:from-zinc-900 dark:to-zinc-800 rounded-2xl overflow-hidden shadow-2xl border border-zinc-200 dark:border-zinc-800">
                <video
                  ref={videoRef}
                  className="w-full h-full object-contain p-4"
                  autoPlay
                  loop
                  muted
                  playsInline
                  preload="auto"
                >
                  <source src="/logo.mp4" type="video/mp4" />
                </video>

                {/* Decorative Elements */}
                <div className="absolute top-2 right-2">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                    <div className="w-2 h-2 rounded-full bg-green-400/50" />
                    <div className="w-2 h-2 rounded-full bg-green-400/30" />
                  </div>
                </div>

                {/* Badge */}
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/50 backdrop-blur-sm px-3 py-1 rounded-full">
                  <span className="text-[10px] text-white/70 font-medium">WindKite Studio</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Kolom Kanan - Konten Error */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-center lg:text-left"
          >
            {/* Status Code */}
            <div className="inline-block mb-4">
              <span className="text-sm font-mono text-blue-500 dark:text-blue-400 bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20">
                404 - Angin Nggak Nentu Arah
              </span>
            </div>

            {/* Title */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-zinc-900 dark:text-white mb-4 leading-tight">
              Halaman Ini
              <span className="block text-blue-500 dark:text-blue-400 mt-1">
                Terbang Terlalu Jauh
              </span>
            </h1>

            {/* Description - Lebih Lucu */}
            <div className="space-y-3 mb-8 max-w-lg mx-auto lg:mx-0">
              <p className="text-base md:text-lg text-zinc-600 dark:text-zinc-400">
                Sepertinya halaman ini ikut terbawa angin kencang dan sekarang 
                lagi main layang-layang di atas sana.
              </p>
              <p className="text-sm text-zinc-500 dark:text-zinc-500 italic">
                "Anginnya lagi kencang banget, lebih kencang dari layang-layang 
                yang putus talinya!"
              </p>
            </div>

            {/* Button Actions */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
              <Link href="/">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="w-full sm:w-auto px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-medium flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40"
                >
                  <Home className="w-4 h-4" />
                  Turun ke Tanah
                </motion.button>
              </Link>
              
              <button
                onClick={() => window.history.back()}
                className="w-full sm:w-auto px-6 py-3 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-xl font-medium flex items-center justify-center gap-2 transition-all border border-zinc-200 dark:border-zinc-700"
              >
                <ArrowLeft className="w-4 h-4" />
                Cari Angin Lain
              </button>
            </div>

            {/* Additional Info - Lebih Lucu */}
            <div className="mt-6 flex flex-wrap items-center gap-3 justify-center lg:justify-start text-xs text-zinc-500 dark:text-zinc-500">
              <span>Halaman ini lagi berpetualang</span>
              <span className="w-px h-3 bg-zinc-300 dark:bg-zinc-700" />
              <span>Semoga cepat kembali</span>
              <span className="w-px h-3 bg-zinc-300 dark:bg-zinc-700" />
              <span>Anginnya lagi 404 km/jam</span>
            </div>
          </motion.div>
        </div>

        {/* Footer Kecil */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mt-12 text-center text-xs text-zinc-400 dark:text-zinc-600 border-t border-zinc-200 dark:border-zinc-800 pt-6"
        >
          <p>
            © {new Date().getFullYear()} WindKite. All rights reserved. 
            <span className="mx-2">•</span>
            Made with for kite lovers
            <span className="mx-2">•</span>
            Angin bertiup, layangan melayang
          </p>
        </motion.div>
      </div>
    </div>
  );
}