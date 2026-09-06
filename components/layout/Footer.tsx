// components/layout/Footer.tsx
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useTheme } from 'next-themes';
import { 
  Compass, 
  Mail, 
  MapPin, 
  Phone, 
  Wind,
  Heart,
  ArrowUp,
  Shield,
  Lock,
  Users
} from 'lucide-react';
import { useState, useEffect } from 'react';

// ==========================================
// Social Media Icons (Custom SVG)
// ==========================================
const InstagramIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
  </svg>
);

const YoutubeIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z" />
    <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" />
  </svg>
);

const TiktokIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
    <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
  </svg>
);

export function Footer() {
  const { theme } = useTheme();
  const [isDark, setIsDark] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    setIsDark(theme === 'dark');
  }, [theme]);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative w-full border-t border-sky-200/40 bg-white/90 dark:bg-black/90 backdrop-blur-md">
      {/* Scroll to Top Button */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 z-50 p-2.5 rounded-full bg-sky-400 hover:bg-sky-500 text-black shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110"
          aria-label="Scroll to top"
        >
          <ArrowUp className="w-5 h-5" />
        </button>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Main Footer Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          
          {/* Brand / About */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center">
              <Image 
                src={isDark ? "/image/logo-putih.png" : "/image/logo-hitam.png"} 
                alt="WindKite Logo" 
                width={140} 
                height={35} 
                priority
                className="h-8 w-auto object-contain"
              />
            </Link>
            <p className="text-sm text-black/60 dark:text-white/60 leading-relaxed max-w-xs">
              Platform cek cuaca angin terpercaya untuk para pecinta layangan di Indonesia. 
              Dapatkan data angin real-time dan desain layangan impianmu.
            </p>
            <div className="flex items-center gap-3 pt-2">
              <div className="flex items-center gap-1.5 text-xs text-black/50 dark:text-white/50">
                <Wind className="w-3.5 h-3.5 text-sky-400" />
                <span>Powered by WindKite</span>
              </div>
              <span className="text-black/20 dark:text-white/20">|</span>
              <div className="flex items-center gap-1.5 text-xs text-black/50 dark:text-white/50">
                <Heart className="w-3.5 h-3.5 text-red-400 fill-red-400/30" />
                <span>Made with love</span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-semibold text-black/80 dark:text-white/80 mb-4 flex items-center gap-2">
              <Compass className="w-4 h-4 text-sky-400" />
              Navigasi
            </h3>
            <ul className="space-y-2.5">
              <li>
                <Link href="/" className="text-sm text-black/60 dark:text-white/60 hover:text-sky-500 transition-colors flex items-center gap-2">
                  <span className="w-1 h-1 rounded-full bg-sky-400/50" />
                  Beranda
                </Link>
              </li>
              <li>
                <Link href="/weather" className="text-sm text-black/60 dark:text-white/60 hover:text-sky-500 transition-colors flex items-center gap-2">
                  <span className="w-1 h-1 rounded-full bg-sky-400/50" />
                  Radar Angin
                </Link>
              </li>
              <li>
                <Link href="/user/designs" className="text-sm text-black/60 dark:text-white/60 hover:text-sky-500 transition-colors flex items-center gap-2">
                  <span className="w-1 h-1 rounded-full bg-sky-400/50" />
                  Desain Layangan
                </Link>
              </li>
              <li>
                <Link href="/guide" className="text-sm text-black/60 dark:text-white/60 hover:text-sky-500 transition-colors flex items-center gap-2">
                  <span className="w-1 h-1 rounded-full bg-sky-400/50" />
                  Panduan Layangan
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources / Layanan */}
          <div>
            <h3 className="text-sm font-semibold text-black/80 dark:text-white/80 mb-4 flex items-center gap-2">
              <Shield className="w-4 h-4 text-sky-400" />
              Layanan
            </h3>
            <ul className="space-y-2.5">
              <li>
                <Link href="/about" className="text-sm text-black/60 dark:text-white/60 hover:text-sky-500 transition-colors flex items-center gap-2">
                  <span className="w-1 h-1 rounded-full bg-sky-400/50" />
                  Tentang Kami
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-sm text-black/60 dark:text-white/60 hover:text-sky-500 transition-colors flex items-center gap-2">
                  <span className="w-1 h-1 rounded-full bg-sky-400/50" />
                  Kontak
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-sm text-black/60 dark:text-white/60 hover:text-sky-500 transition-colors flex items-center gap-2">
                  <span className="w-1 h-1 rounded-full bg-sky-400/50" />
                  Kebijakan Privasi
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-sm text-black/60 dark:text-white/60 hover:text-sky-500 transition-colors flex items-center gap-2">
                  <span className="w-1 h-1 rounded-full bg-sky-400/50" />
                  Syarat & Ketentuan
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact & Social */}
          <div>
            <h3 className="text-sm font-semibold text-black/80 dark:text-white/80 mb-4 flex items-center gap-2">
              <Users className="w-4 h-4 text-sky-400" />
              Hubungi Kami
            </h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-3 text-sm text-black/60 dark:text-white/60">
                <MapPin className="w-4 h-4 text-sky-400 mt-0.5 flex-shrink-0" />
                <span>Indonesia</span>
              </li>
              <li className="flex items-start gap-3 text-sm text-black/60 dark:text-white/60">
                <Mail className="w-4 h-4 text-sky-400 mt-0.5 flex-shrink-0" />
                <a href="mailto:info@windkite.com" className="hover:text-sky-500 transition-colors">
                  info@windkite.com
                </a>
              </li>
              <li className="flex items-start gap-3 text-sm text-black/60 dark:text-white/60">
                <Phone className="w-4 h-4 text-sky-400 mt-0.5 flex-shrink-0" />
                <a href="tel:+62123456789" className="hover:text-sky-500 transition-colors">
                  +62 123 4567 89
                </a>
              </li>
            </ul>

            {/* Social Media */}
            <div className="mt-4 pt-4 border-t border-black/10 dark:border-white/10">
              <p className="text-xs text-black/50 dark:text-white/50 mb-3">Ikuti kami di</p>
              <div className="flex items-center gap-2">
                <a
                  href="https://instagram.com/windkite"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-full bg-black/5 dark:bg-white/5 hover:bg-sky-500/10 hover:text-sky-500 transition-all duration-300"
                  aria-label="Instagram"
                >
                  <InstagramIcon className="w-4 h-4" />
                </a>
                <a
                  href="https://youtube.com/windkite"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-full bg-black/5 dark:bg-white/5 hover:bg-sky-500/10 hover:text-sky-500 transition-all duration-300"
                  aria-label="YouTube"
                >
                  <YoutubeIcon className="w-4 h-4" />
                </a>
                <a
                  href="https://tiktok.com/@windkite"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-full bg-black/5 dark:bg-white/5 hover:bg-sky-500/10 hover:text-sky-500 transition-all duration-300"
                  aria-label="TikTok"
                >
                  <TiktokIcon className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-10 pt-6 border-t border-black/10 dark:border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-black/40 dark:text-white/40 text-center sm:text-left">
            &copy; {currentYear} WindKite. All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-xs text-black/40 dark:text-white/40">
            <Link href="/privacy" className="hover:text-sky-500 transition-colors flex items-center gap-1">
              <Lock className="w-3 h-3" />
              Privasi
            </Link>
            <span className="text-black/20 dark:text-white/20">|</span>
            <Link href="/terms" className="hover:text-sky-500 transition-colors">
              Syarat
            </Link>
            <span className="text-black/20 dark:text-white/20">|</span>
            <Link href="/sitemap" className="hover:text-sky-500 transition-colors">
              Sitemap
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}