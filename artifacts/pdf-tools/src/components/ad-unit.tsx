import { useEffect, useRef } from "react";

declare global {
  interface Window {
    adsbygoogle: any[];
  }
}

interface AdUnitProps {
  className?: string;
  slot?: string;
  format?: "auto" | "horizontal" | "rectangle" | "vertical";
  responsive?: boolean;
}

export function AdUnit({
  className = "",
  slot = "",
  format = "auto",
  responsive = true,
}: AdUnitProps) {
  const ref = useRef<HTMLInsElement>(null);
  const pushed = useRef(false);

  useEffect(() => {
    if (pushed.current) return;
    try {
      if (typeof window !== "undefined") {
        window.adsbygoogle = window.adsbygoogle || [];
        window.adsbygoogle.push({});
        pushed.current = true;
      }
    } catch (e) {
      console.error("AdSense error:", e);
    }
  }, []);

  return (
    <div className={`overflow-hidden text-center ${className}`}>
      <ins
        ref={ref}
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client="ca-pub-5039414507016105"
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive={responsive ? "true" : "false"}
      />
    </div>
  );
}

export function HorizontalAd({ className = "" }: { className?: string }) {
  return (
    <AdUnit
      className={className}
      format="horizontal"
      responsive={true}
    />
  );
}

export function RectangleAd({ className = "" }: { className?: string }) {
  return (
    <AdUnit
      className={className}
      format="rectangle"
      responsive={false}
    />
  );
}
