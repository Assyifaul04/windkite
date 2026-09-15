// components/landing/template/dropdown-template.tsx

'use client';

import Link from 'next/link';

// Struktur menu Template — HANYA yang diperlukan user
// Menu admin (KiteFrame DRAFT/ARCHIVED, marker editor, dll) DISEMBUNYIKAN
const templateMenu = [
  {
    group: 'Jelajahi',
    items: [
      { title: 'Semua Template', href: '/template' },
      { title: 'Template Populer', href: '/template/popular' },
      { title: 'Template Terbaru', href: '/template/latest' },
      { title: 'Template Publik', href: '/template/public' },
    ],
  },
  {
    group: 'Kategori',
    items: [
      { title: 'Layangan Tradisional', href: '/template/traditional' },
      { title: 'Layangan Modern', href: '/template/modern' },
      { title: 'Layangan 3D', href: '/template/3d' },
      { title: 'Layangan Mini', href: '/template/mini' },
      { title: 'Layangan Besar', href: '/template/large' },
    ],
  },
  {
    group: 'Buat & Kelola',
    items: [
      { title: 'Buat Desain', href: '/template/create' },
      { title: 'Desain Saya', href: '/dashboard/designs' },
      { title: 'Transformasi Gambar', href: '/docs/transform' },
      { title: 'Galeri Desain', href: '/docs/gallery' },
    ],
  },
];

export function DropdownTemplate() {
  return (
    // Full-width, menyatu dengan navbar: tanpa rounded atas, background solid,
    // border hanya di bawah, langsung menempel di bawah header (top-full)
    <div className="absolute top-full left-0 right-0 w-full border-b border-sky-200/40 bg-white dark:bg-black shadow-lg z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 3 Kolom seperti Vercel */}
        <div className="grid grid-cols-3 gap-x-12 gap-y-6">
          {templateMenu.map((section) => (
            <div key={section.group} className="space-y-3">
              {/* Group Title — abu-abu kecil seperti Vercel */}
              <h3 className="text-[11px] font-medium uppercase tracking-wider text-black/40 dark:text-white/40">
                {section.group}
              </h3>

              {/* Items — teks polos, tanpa ikon, hover halus */}
              <ul className="space-y-2">
                {section.items.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="block text-sm text-black/70 dark:text-white/70 hover:text-sky-500 dark:hover:text-sky-400 transition-colors"
                    >
                      {item.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}