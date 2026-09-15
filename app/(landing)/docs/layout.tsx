// app/(landing)/docs/layout.tsx

import { MenuMain } from '@/components/landing/docs/menu-main';

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // Warna hitam solid seperti navbar
    <div className="min-h-screen bg-white dark:bg-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col md:flex-row gap-10">
          {/* Sidebar Menu */}
          <MenuMain />

          {/* Konten Docs */}
          <main className="flex-1 min-w-0">
            <article className="prose prose-slate dark:prose-invert max-w-none">
              {children}
            </article>
          </main>
        </div>
      </div>
    </div>
  );
}