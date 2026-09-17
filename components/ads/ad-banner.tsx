// components/ads/ad-banner.tsx
"use client";

import { useEffect, useRef, useState } from "react";

// ============ TIPE ============
interface AdSettings {
  id: string;
  provider: string;
  name: string | null;
  scriptUrl: string | null;
  clientId: string | null;
  adSlot: string | null;
  adCode: string | null;
  adType: string | null;
  adSize: string | null;
  isActive: boolean;
  position: string;
}

interface AdBannerProps {
  position?: string;
  className?: string;
}

// ============ KOMPONEN ============
export function AdBanner({ position = "top", className = "" }: AdBannerProps) {
  const [adSettings, setAdSettings] = useState<AdSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const adContainerRef = useRef<HTMLDivElement>(null);

  // ============ FETCH AD AKTIF ============
  useEffect(() => {
    const fetchAds = async () => {
      try {
        const res = await fetch(`/api/ads/active?position=${position}`);
        if (res.ok) {
          const data = await res.json();
          setAdSettings(data || null);
        }
      } catch (error) {
        console.error("Failed to fetch ads:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAds();
  }, [position]);

  // ============ RENDER AD SESUAI PROVIDER ============
  useEffect(() => {
    if (!adSettings || !adSettings.isActive || !adContainerRef.current) return;

    const container = adContainerRef.current;
    container.innerHTML = ""; // reset

    // === Google AdSense ===
    if (adSettings.provider === "google_adsense") {
      // Inject script AdSense sekali
      const scriptId = "adsbygoogle-script";
      let script = document.getElementById(scriptId) as HTMLScriptElement | null;

      if (!script) {
        script = document.createElement("script");
        script.id = scriptId;
        script.async = true;
        script.crossOrigin = "anonymous";
        script.src =
          adSettings.scriptUrl ||
          `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adSettings.clientId}`;
        document.head.appendChild(script);
        console.log("AdSense script injected");
      }

      // Init adsbygoogle array
      if (!(window as any).adsbygoogle) {
        (window as any).adsbygoogle = [];
      }

      // Buat elemen <ins>
      const ins = document.createElement("ins");
      ins.className = "adsbygoogle";
      ins.style.display = "block";
      ins.style.width = "100%";
      ins.style.minHeight = "100px";
      ins.setAttribute("data-ad-client", adSettings.clientId || "");
      ins.setAttribute("data-ad-slot", adSettings.adSlot || "");
      ins.setAttribute("data-ad-format", "auto");
      ins.setAttribute("data-full-width-responsive", "true");
      container.appendChild(ins);

      // Push setelah DOM ready
      const timer = setTimeout(() => {
        try {
          (window as any).adsbygoogle.push({});
          console.log("AdSense pushed for position:", position);
        } catch (e) {
          console.error("AdSense push error:", e);
        }
      }, 500);

      return () => clearTimeout(timer);
    }

    // === Adsterra / Monetag / PropellerAds ===
    if (adSettings.adCode) {
      const temp = document.createElement("div");
      temp.innerHTML = adSettings.adCode;

      // Pindahkan semua node termasuk <script> agar dieksekusi ulang
      Array.from(temp.childNodes).forEach((node) => {
        if (node.nodeName === "SCRIPT") {
          const oldScript = node as HTMLScriptElement;
          const newScript = document.createElement("script");
          Array.from(oldScript.attributes).forEach((attr) =>
            newScript.setAttribute(attr.name, attr.value)
          );
          newScript.text = oldScript.text;
          container.appendChild(newScript);
        } else {
          container.appendChild(node.cloneNode(true));
        }
      });

      console.log(`${adSettings.provider} script injected for position:`, position);
    }
  }, [adSettings, position]);

  // ============ LOADING ============
  if (isLoading) {
    return (
      <div
        className={`flex items-center justify-center border border-dashed border-zinc-700 bg-zinc-950 text-zinc-500 ${className}`}
      >
        <span className="text-sm">Loading ad...</span>
      </div>
    );
  }

  // ============ NO ACTIVE AD ============
  if (!adSettings || !adSettings.isActive) {
    return (
      <div
        className={`flex items-center justify-center border border-dashed border-zinc-700 bg-zinc-950 text-zinc-500 ${className}`}
      >
        <span className="text-sm">No active ad ({position})</span>
      </div>
    );
  }

  // ============ RENDER ============
  return (
    <div
      ref={adContainerRef}
      data-provider={adSettings.provider}
      data-position={position}
      className={`flex flex-col items-center justify-center w-full bg-black min-h-[100px] overflow-hidden ${className}`}
    />
  );
}