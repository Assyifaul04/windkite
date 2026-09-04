// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "qrpddmkcqryxskezdmby.supabase.co",
        port: "",
        pathname: "/storage/v1/object/public/**",
      },
      // Tambahkan pattern untuk local development jika diperlukan
      {
        protocol: "http",
        hostname: "localhost",
        port: "3000",
        pathname: "/uploads/**",
      },
    ],
    // Untuk development, bisa juga gunakan domains (cara lama)
    // domains: ['qrpddmkcqryxskezdmby.supabase.co'],
  },
  // ... konfigurasi lain
};

export default nextConfig;