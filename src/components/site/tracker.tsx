"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";

export function Tracker() {
  const pathname = usePathname();
  useEffect(() => {
    try {
      if (navigator.doNotTrack === "1" || localStorage.getItem("no-track")) return;
      const body = JSON.stringify({ path: pathname, referrer: document.referrer });
      if (navigator.sendBeacon) navigator.sendBeacon("/api/track", new Blob([body], { type: "application/json" }));
      else fetch("/api/track", { method: "POST", body, keepalive: true, headers: { "content-type": "application/json" } });
    } catch {}
  }, [pathname]);
  return null;
}
