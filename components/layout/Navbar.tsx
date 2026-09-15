'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useTheme } from 'next-themes';
import { 
  LogIn, 
  Sun, 
  Moon, 
  BookOpen, 
  LayoutTemplate,
  ChevronDown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { UserDropdown } from '@/components/layout/dropdown-menu';
import { DropdownDocs } from '@/components/landing/docs/dropdown-docs';
import { DropdownTemplate } from '@/components/landing/template/dropdown-template';

export function Navbar() {
  // Mengambil session dari NextAuth
  const { data: session, status } = useSession();
  
  // Mengambil theme dari next-themes
  const { theme, setTheme } = useTheme();

  // Mengambil pathname saat ini
  const pathname = usePathname();

  // Deteksi apakah user sedang berada di halaman docs (termasuk sub-path)
  const isDocsPage = pathname?.startsWith('/docs');

  // State untuk hover dropdown
  const [showDocs, setShowDocs] = useState(false);
  const [showTemplate, setShowTemplate] = useState(false);

  // Menentukan URL Dashboard berdasarkan role pengguna
  const dashboardUrl = session?.user?.role === 'ADMIN' ? '/admin/dashboard' : '/dashboard';

  return (
    <header className="sticky top-0 z-50 w-full border-b border-sky-200/40 bg-white/90 dark:bg-black/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Logo + Menu Kanan Dekat Logo */}
        <div className="flex items-center gap-6">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <Image 
              src="/image/logo-hitam.png" 
              alt="WindKite Logo Light" 
              width={160} 
              height={40} 
              priority
              className="h-8 w-auto object-contain dark:hidden block"
            />
            <Image 
              src="/image/logo-putih.png" 
              alt="WindKite Logo Dark" 
              width={160} 
              height={40} 
              priority
              className="h-8 w-auto object-contain hidden dark:block"
            />
          </Link>

          {/* Menu Template & Docs - Di kanan dekat logo */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-black/70 dark:text-white/70">
            {/* Template Layangan - dengan hover dropdown & chevron */}
            <div
              className="relative"
              onMouseEnter={() => setShowTemplate(true)}
              onMouseLeave={() => setShowTemplate(false)}
            >
              <Link 
                href="#template" 
                className="hover:text-sky-500 transition-colors flex items-center gap-1 py-5"
              >
                <LayoutTemplate className="w-3.5 h-3.5 text-sky-400" /> Template
                <ChevronDown 
                  className={`w-3 h-3 text-sky-400 transition-transform duration-200 ${showTemplate ? 'rotate-180' : ''}`} 
                />
              </Link>
            </div>

            {/* Docs - dengan hover dropdown & chevron icon */}
            {/* Jika sedang di halaman /docs, dropdown dinonaktifkan */}
            <div
              className="relative"
              onMouseEnter={() => {
                if (!isDocsPage) setShowDocs(true);
              }}
              onMouseLeave={() => setShowDocs(false)}
            >
              <Link 
                href="/docs" 
                className="hover:text-sky-500 transition-colors flex items-center gap-1 py-5"
              >
                <BookOpen className="w-3.5 h-3.5 text-sky-400" /> Docs
                {/* Chevron hanya tampil & berputar jika BUKAN di halaman docs */}
                {!isDocsPage && (
                  <ChevronDown 
                    className={`w-3 h-3 text-sky-400 transition-transform duration-200 ${showDocs ? 'rotate-180' : ''}`} 
                  />
                )}
              </Link>
            </div>
          </nav>
        </div>

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
            <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 animate-pulse" />
          ) : session ? (
            <UserDropdown 
              user={session.user} 
              dashboardUrl={dashboardUrl} 
            />
          ) : (
            <Link href="/login">
              <Button variant="default" size="sm" className="gap-2 font-mono text-xs shadow-sm cursor-pointer bg-sky-400 hover:bg-sky-500 text-black font-semibold">
                <LogIn className="w-3.5 h-3.5 text-black" />
                <span>Masuk Google</span>
              </Button>
            </Link>
          )}
        </div>

      </div>

      {/* Dropdown Template — full-width & menyatu dengan navbar */}
      {showTemplate && (
        <div
          onMouseEnter={() => setShowTemplate(true)}
          onMouseLeave={() => setShowTemplate(false)}
        >
          <DropdownTemplate />
        </div>
      )}

      {/* Dropdown Docs — HANYA muncul jika BUKAN di halaman docs */}
      {showDocs && !isDocsPage && (
        <div
          onMouseEnter={() => setShowDocs(true)}
          onMouseLeave={() => setShowDocs(false)}
        >
          <DropdownDocs />
        </div>
      )}
    </header>
  );
}