'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import { useTheme } from 'next-themes';
import { Compass, LogIn, Sun, Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { UserDropdown } from '@/components/layout/dropdown-menu';

export function Navbar() {
  // Mengambil session dari NextAuth
  const { data: session, status } = useSession();
  
  // Mengambil theme dari next-themes
  const { theme, setTheme } = useTheme();

  // Menentukan URL Dashboard berdasarkan role pengguna
  const dashboardUrl = session?.user?.role === 'ADMIN' ? '/admin/dashboard' : '/dashboard';

  return (
    <header className="sticky top-0 z-50 w-full border-b border-sky-200/40 bg-white/90 dark:bg-black/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Logo */}
        <Link href="/" className="flex items-center">
          {/* Logo untuk Light Mode (Sembunyi saat Dark Mode) */}
          <Image 
            src="/image/logo-hitam.png" 
            alt="WindKite Logo Light" 
            width={160} 
            height={40} 
            priority
            className="h-8 w-auto object-contain dark:hidden block"
          />
          {/* Logo untuk Dark Mode (Sembunyi saat Light Mode) */}
          <Image 
            src="/image/logo-putih.png" 
            alt="WindKite Logo Dark" 
            width={160} 
            height={40} 
            priority
            className="h-8 w-auto object-contain hidden dark:block"
          />
        </Link>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-black/70 dark:text-white/70">
          <Link href="/" className="hover:text-sky-500 transition-colors">
            Beranda
          </Link>
          <Link href="#radar" className="hover:text-sky-500 transition-colors flex items-center gap-1">
            <Compass className="w-3.5 h-3.5 text-sky-400" /> Radar Angin
          </Link>
          <Link href="#panduan" className="hover:text-sky-500 transition-colors">
            Panduan Layangan
          </Link>
        </nav>

        {/* Action / Auth Button */}
        <div className="flex items-center gap-3">
          
          {/* Theme Toggle Button */}
          <Button 
            variant="ghost" 
            size="sm" 
            className="px-2 text-black/70 dark:text-white/70 hover:text-sky-500"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            aria-label="Toggle Theme"
          >
            <Sun className="h-4 w-4 dark:hidden block" />
            <Moon className="h-4 w-4 hidden dark:block" />
          </Button>

          {status === 'loading' ? (
            // Skeleton loader saat memeriksa sesi
            <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 animate-pulse" />
          ) : session ? (
            // Dropdown User
            <UserDropdown 
              user={session.user} 
              dashboardUrl={dashboardUrl} 
            />
          ) : (
            // Tombol masuk saat belum login
            <Link href="/login">
              <Button variant="default" size="sm" className="gap-2 font-mono text-xs shadow-sm cursor-pointer bg-sky-400 hover:bg-sky-500 text-black font-semibold">
                <LogIn className="w-3.5 h-3.5 text-black" />
                <span>Masuk Google</span>
              </Button>
            </Link>
          )}
        </div>

      </div>
    </header>
  );
}