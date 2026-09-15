// components/landing/docs/menu-main.tsx

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Search, ChevronRight } from 'lucide-react';

// Struktur menu sidebar docs — HANYA yang diperlukan user
const docsMenu = [
  {
    group: 'Mulai',
    items: [
      { title: 'Getting Started', href: '/docs/getting-started' },
      { title: 'Panduan Layangan', href: '/docs/kite-guide' },
      { title: 'FAQ', href: '/docs/faq' },
      { title: 'Tips & Trik', href: '/docs/tips' },
    ],
  },
  {
    group: 'Cuaca & Angin',
    items: [
      { title: 'Radar Angin', href: '/docs/radar' },
      { title: 'Prakiraan Cuaca', href: '/docs/forecast' },
      { title: 'Lokasi Tersimpan', href: '/docs/locations' },
      { title: 'Tingkat Kesesuaian', href: '/docs/suitability', hasSubmenu: true },
      { title: 'Riwayat Cuaca', href: '/docs/weather-history' },
    ],
  },
  {
    group: 'Layangan',
    items: [
      { title: 'Template Layangan', href: '/docs/templates', badge: 'Beta' },
      { title: 'Desain Layangan', href: '/docs/designs' },
      { title: 'Transformasi Gambar', href: '/docs/transform', hasSubmenu: true },
      { title: 'Galeri Desain', href: '/docs/gallery' },
    ],
  },
];

export function MenuMain() {
  const pathname = usePathname();
  const [query, setQuery] = useState('');

  // Filter menu berdasarkan query pencarian
  const filteredMenu = docsMenu
    .map((section) => ({
      ...section,
      items: section.items.filter((item) =>
        item.title.toLowerCase().includes(query.toLowerCase())
      ),
    }))
    .filter((section) => section.items.length > 0);

  return (
    <aside className="w-full md:w-64 shrink-0">
      {/* Warna hitam solid seperti navbar */}
      <div className="sticky top-24 flex flex-col max-h-[calc(100vh-7rem)] rounded-xl border border-sky-200/40 dark:border-sky-900/40 bg-white dark:bg-black p-3">
        {/* Search Box */}
        <div className="relative mb-4 shrink-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-black/40 dark:text-white/40 pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search Docs"
            className="w-full rounded-lg border border-sky-200/40 dark:border-sky-900/40 bg-white dark:bg-black pl-9 pr-12 py-2 text-sm text-black dark:text-white placeholder:text-black/40 dark:placeholder:text-white/40 focus:outline-none focus:border-sky-400 dark:focus:border-sky-500 transition-colors"
          />
          {/* Shortcut Badge ⌘K */}
          <kbd className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-0.5 rounded border border-sky-200/40 dark:border-sky-900/40 bg-black/5 dark:bg-white/5 px-1.5 py-0.5 text-[10px] font-medium text-black/50 dark:text-white/50">
            <span className="text-xs">⌘</span>K
          </kbd>
        </div>

        {/* Scrollable Nav */}
        <nav className="flex-1 overflow-y-auto pr-1 space-y-6 scrollbar-thin scrollbar-thumb-sky-200/40 dark:scrollbar-thumb-sky-900/40 scrollbar-track-transparent">
          {filteredMenu.map((section) => (
            <div key={section.group} className="space-y-1.5">
              {/* Group Title */}
              <h3 className="text-[11px] font-medium uppercase tracking-wider text-black/40 dark:text-white/40 px-2">
                {section.group}
              </h3>

              {/* Items */}
              <ul className="space-y-0.5">
                {section.items.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className={`group flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-sm transition-colors ${
                          isActive
                            ? 'bg-black/5 dark:bg-white/5 text-black dark:text-white font-medium'
                            : 'text-black/70 dark:text-white/70 hover:bg-black/5 dark:hover:bg-white/5 hover:text-black dark:hover:text-white'
                        }`}
                      >
                        <span className="truncate">{item.title}</span>

                        <span className="flex items-center gap-1.5 shrink-0">
                          {item.badge && (
                            <span className="rounded-full bg-sky-400/20 dark:bg-sky-500/20 px-1.5 py-0.5 text-[10px] font-medium text-sky-600 dark:text-sky-400">
                              {item.badge}
                            </span>
                          )}
                          {item.hasSubmenu && (
                            <ChevronRight className="w-3.5 h-3.5 text-black/30 dark:text-white/30 group-hover:text-black/50 dark:group-hover:text-white/50 transition-colors" />
                          )}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}

          {/* Empty state */}
          {filteredMenu.length === 0 && (
            <p className="px-2 text-sm text-black/40 dark:text-white/40">
              Tidak ada hasil untuk &ldquo;{query}&rdquo;
            </p>
          )}
        </nav>
      </div>
    </aside>
  );
}