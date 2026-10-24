"use client";
import { useEffect, useRef } from "react";

declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, o: Record<string, unknown>) => string;
      reset: (id?: string) => void;
      remove: (id?: string) => void;
    };
  }
}

const SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

export function Turnstile({ siteKey, onToken, resetSignal }: { siteKey: string; onToken: (t: string) => void; resetSignal: number }) {
  const box = useRef<HTMLDivElement>(null);
  const widget = useRef<string | null>(null);
  const cb = useRef(onToken);
  useEffect(() => { cb.current = onToken; });

  useEffect(() => {
    let dead = false;
    const mount = () => {
      if (dead || !box.current || !window.turnstile || widget.current) return;
      widget.current = window.turnstile.render(box.current, {
        sitekey: siteKey,
        theme: document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark",
        callback: (t: string) => cb.current(t),
        "expired-callback": () => cb.current(""),
        "error-callback": () => cb.current(""),
      });
    };
    let script: HTMLScriptElement | null = null;
    if (window.turnstile) mount();
    else {
      script = document.querySelector<HTMLScriptElement>('script[src^="https://challenges.cloudflare.com/turnstile"]');
      if (!script) {
        script = document.createElement("script");
        script.src = SRC; script.async = true; script.defer = true;
        document.head.appendChild(script);
      }
      script.addEventListener("load", mount);
    }
    return () => {
      dead = true;
      script?.removeEventListener("load", mount);
      if (widget.current && window.turnstile) { window.turnstile.remove(widget.current); widget.current = null; }
    };
  }, [siteKey]);

  useEffect(() => {
    if (resetSignal && widget.current) window.turnstile?.reset(widget.current);
  }, [resetSignal]);

  return <div ref={box} className="min-h-[65px]" />;
}
