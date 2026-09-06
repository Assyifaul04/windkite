// components/ads/ad-banner.tsx
"use client";

import { useEffect, useRef, useState } from "react";

interface AdSettings {
  id: string;
  provider: string;
  scriptUrl: string | null;
  clientId: string | null;
  adSlot: string | null;
  isActive: boolean;
  position: string;
}

interface AdBannerProps {
  position?: string;
  className?: string;
}

export function AdBanner({ position = "top", className = "" }: AdBannerProps) {
  const [adSettings, setAdSettings] = useState<AdSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [adLoaded, setAdLoaded] = useState(false);
  const adContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchAds = async () => {
      try {
        const res = await fetch("/api/admin/settings/ads");
        const data = await res.json();
        if (res.ok && data) {
          const matchedAd = data.find(
            (ad: AdSettings) => ad.position === position && ad.isActive
          );
          setAdSettings(matchedAd || null);
        }
      } catch (error) {
        console.error("Failed to fetch ads:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAds();
  }, [position]);

  // Load AdSense script once
  useEffect(() => {
    // Cek apakah script sudah ada
    if (typeof window === "undefined") return;
    
    const scriptId = "adsbygoogle-script";
    let script = document.getElementById(scriptId) as HTMLScriptElement | null;

    if (!script) {
      script = document.createElement("script");
      script.id = scriptId;
      script.async = true;
      script.crossOrigin = "anonymous";
      script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adSettings?.clientId || "ca-pub-7542754799825568"}`;
      document.head.appendChild(script);
      console.log("AdSense script injected");
    }

    // Initialize adsbygoogle
    if (!(window as any).adsbygoogle) {
      (window as any).adsbygoogle = [];
    }

    // Push ad after a short delay to ensure DOM is ready
    const timer = setTimeout(() => {
      try {
        if (adSettings?.isActive && adSettings?.clientId) {
          (window as any).adsbygoogle.push({});
          setAdLoaded(true);
          console.log("Ad pushed for position:", position);
        }
      } catch (e) {
        console.error("AdSense error:", e);
      }
    }, 500);

    return () => {
      clearTimeout(timer);
    };
  }, [adSettings, position]);

  // Loading state
  if (isLoading) {
    return (
      <div className={`flex items-center justify-center border border-dashed border-zinc-700 bg-zinc-950 text-zinc-500 ${className}`}>
        <span className="text-sm">Loading ad...</span>
      </div>
    );
  }

  // No active ad
  if (!adSettings || !adSettings.isActive) {
    return (
      <div className={`flex items-center justify-center border border-dashed border-zinc-700 bg-zinc-950 text-zinc-500 ${className}`}>
        <span className="text-sm">No active ad ({position})</span>
      </div>
    );
  }

  return (
    <div 
      ref={adContainerRef}
      className={`flex flex-col items-center justify-center w-full bg-black min-h-[100px] overflow-hidden ${className}`}
    >
      <ins
        className="adsbygoogle"
        style={{ display: "block", width: "100%", minHeight: "100px", height: "100%" }}
        data-ad-client={adSettings.clientId!}
        data-ad-slot={adSettings.adSlot || "9422886372"}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}