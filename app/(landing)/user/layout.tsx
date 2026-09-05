// app/(landing)/user/layout.tsx
"use client";

import { SettingsDialog } from "@/components/user/settings-dialog";
import { AdBanner } from "@/components/ads/ad-banner";

export default function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {/* Iklan Atas (Top) - Full Width */}
      <div className="w-full h-[90px] shrink-0 px-4 pt-4 pb-2">
        <AdBanner position="top" className="w-full h-full rounded-lg" />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col lg:flex-row items-stretch justify-center gap-4 p-2 sm:p-4 overflow-hidden">
        
        {/* Iklan Kiri - Hanya di Desktop */}
        <div className="hidden lg:block w-[300px] shrink-0">
          <div className="sticky top-4 h-[calc(100vh-130px)]">
            <AdBanner position="left" className="w-full h-full rounded-lg" />
          </div>
        </div>

        {/* Konten Utama - Scrollable di dalam */}
        <div className="flex-1 flex items-center justify-center min-w-0 overflow-y-auto max-h-[calc(100vh-130px)]">
          <SettingsDialog>
            <div className="w-full max-w-full">
              {children}
            </div>
          </SettingsDialog>
        </div>

        {/* Iklan Kanan - Hanya di Desktop */}
        <div className="hidden lg:block w-[300px] shrink-0">
          <div className="sticky top-4 h-[calc(100vh-130px)]">
            <AdBanner position="right" className="w-full h-full rounded-lg" />
          </div>
        </div>
        
      </div>
    </div>
  );
}