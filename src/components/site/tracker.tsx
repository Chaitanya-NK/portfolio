"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";

function skip() {
  try { return navigator.doNotTrack === "1" || !!localStorage.getItem("no-track"); } catch { return false; }
}
function send(data: object) {
  const body = JSON.stringify(data);
  if (navigator.sendBeacon) navigator.sendBeacon("/api/track", new Blob([body], { type: "application/json" }));
  else fetch("/api/track", { method: "POST", body, keepalive: true, headers: { "content-type": "application/json" } });
}

export function Tracker() {
  const pathname = usePathname();
  useEffect(() => {
    if (skip()) return;
    send({ path: pathname, referrer: document.referrer });
  }, [pathname]);
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (skip()) return;
      const el = (e.target as Element | null)?.closest?.("[data-track]") as HTMLElement | null;
      if (!el) return;
      send({ type: "click", kind: el.dataset.track, label: el.dataset.label ?? "", path: location.pathname });
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);
  return null;
}
