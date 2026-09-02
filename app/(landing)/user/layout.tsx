// app/(landing)/user/layout.tsx
"use client";

import { SettingsDialog } from "@/components/user/settings-dialog";

export default function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <div className="flex-1 flex items-center justify-center p-2 sm:p-4">
        <SettingsDialog>
          <div className="w-full max-w-full">
            {children}
          </div>
        </SettingsDialog>
      </div>
    </div>
  );
}