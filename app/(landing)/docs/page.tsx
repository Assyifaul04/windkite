// app/(landing)/docs/page.tsx

import Link from 'next/link';

export const metadata = {
  title: 'Docs — WindKite',
  description: 'Dokumentasi WindKite untuk pengguna: cuaca, angin, template, dan desain layangan.',
};

export default function DocsPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-black dark:text-white">
          Dokumentasi WindKite
        </h1>
        <p className="mt-2 text-black/60 dark:text-white/60">
          Panduan lengkap untuk menggunakan WindKite — dari memantau cuaca hingga membuat desain layangan.
        </p>
      </div>

      {/* Kartu Navigasi Cepat */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[
          {
            title: 'Getting Started',
            desc: 'Pengenalan WindKite & cara pakai',
            href: '/docs/getting-started',
          },
          {
            title: 'Radar Angin',
            desc: 'Data cuaca & lokasi real-time',
            href: '/docs/radar',
          },
          {
            title: 'Template Layangan',
            desc: 'Jelajahi template kerangka layangan',
            href: '/docs/templates',
          },
          {
            title: 'Desain Layangan',
            desc: 'Upload & transformasi gambar Anda',
            href: '/docs/designs',
          },
        ].map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="group rounded-xl border border-sky-200/40 dark:border-sky-900/40 bg-white dark:bg-black p-5 transition-colors hover:border-sky-400 dark:hover:border-sky-500"
          >
            <h3 className="text-base font-semibold text-black dark:text-white group-hover:text-sky-500 transition-colors">
              {card.title}
            </h3>
            <p className="mt-1 text-sm text-black/60 dark:text-white/60">
              {card.desc}
            </p>
          </Link>
        ))}
      </div>

      {/* Section: Tentang */}
      <div className="pt-4 border-t border-sky-200/40 dark:border-sky-900/40">
        <h2 className="text-xl font-semibold text-black dark:text-white">
          Tentang Dokumentasi Ini
        </h2>
        <p className="mt-2 text-sm text-black/60 dark:text-white/60 leading-relaxed">
          Dokumentasi ini hanya menampilkan fitur yang dapat diakses oleh pengguna.
          Pengaturan sistem, konfigurasi API, dan manajemen admin tidak ditampilkan di sini.
        </p>
      </div>
    </div>
  );
}