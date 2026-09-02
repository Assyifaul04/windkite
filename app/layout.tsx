import type { Metadata } from "next";
import { Geist, Geist_Mono, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Providers } from "@/components/layout/providers"; // Import Provider

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains',
});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "WindKite - Cek Cuaca Angin",
  description: "Aplikasi pengecekan angin untuk layangan",
};

export default function RootLayout({ 
  children 
}: { 
  children: React.ReactNode 
}) {
  return (
    <html
      lang="en"
      className={cn(
        "h-full", 
        "antialiased", 
        geistSans.variable, 
        geistMono.variable, 
        jetbrainsMono.variable
      )}
    >
      {/* UBAH DI SINI: ganti font-mono menjadi font-sans */}
      <body className="min-h-full flex flex-col font-sans">
        {/* Bungkus children dengan Providers */}
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}