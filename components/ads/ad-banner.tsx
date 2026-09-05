// components/ads/ad-banner.tsx
"use client";

import { useEffect, useState } from "react";

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
  position?: string; // "top", "left", "right", "global"
  className?: string;
}

export function AdBanner({ position = "global", className = "" }: AdBannerProps) {
  const [adSettings, setAdSettings] = useState<AdSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [adsLoaded, setAdsLoaded] = useState(false);

  useEffect(() => {
    const fetchAds = async () => {
      try {
        const res = await fetch("/api/admin/settings/ads");
        const data = await res.json();
        if (res.ok && data) {
          setAdSettings(data);
        }
      } catch (error) {
        console.error("Failed to fetch ads:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAds();
  }, []);

  useEffect(() => {
    if (!adSettings?.scriptUrl || !adSettings?.isActive) return;

    const scriptId = "adsbygoogle-script";
    let script = document.getElementById(scriptId) as HTMLScriptElement | null;

    if (!script) {
      script = document.createElement("script");
      script.id = scriptId;
      script.async = true;
      script.crossOrigin = "anonymous";
      script.src = adSettings.scriptUrl;
      document.head.appendChild(script);
    }

    const pushAd = () => {
      if (!adsLoaded && (window as any).adsbygoogle) {
        try {
          (window as any).adsbygoogle = (window as any).adsbygoogle || [];
          (window as any).adsbygoogle.push({});
          setAdsLoaded(true);
        } catch (e) {
          console.error("AdSense error:", e);
        }
      }
    };

    const currentScript = script;
    currentScript.onload = pushAd;

    return () => {
      currentScript.onload = null;
    };
  }, [adSettings, adsLoaded]);

  if (!adSettings?.isActive || !adSettings.clientId || isLoading) {
    return (
      <div className={`flex items-center justify-center border border-dashed border-zinc-700 bg-zinc-950 text-zinc-500 ${className}`}>
        <span className="text-sm">Ad Placeholder ({position})</span>
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center justify-center w-full bg-black ${className}`}>
      <ins
        className="adsbygoogle"
        style={{ display: "block", width: "100%", height: "100%" }}
        data-ad-client={adSettings.clientId}
        data-ad-slot={adSettings.adSlot || "9422886372"}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}