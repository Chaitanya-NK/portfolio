"use client";
import { useEffect, useState } from "react";
import { X } from "lucide-react";

type A = {
  enabled: boolean; text: string; link_label?: string | null; link_url?: string | null;
  start?: string | null; end?: string | null;
} | null;

const hash = (s: string) => {
  let h = 0;
  for (const c of s) h = (h * 31 + c.charCodeAt(0)) | 0;
  return String(h);
};

export function AnnouncementBar({ a }: { a: A }) {
  const [show, setShow] = useState(false);
  const key = a ? `ann-${hash(a.text + (a.link_url ?? ""))}` : "";

  // checked in the browser so the time window is always correct, even on cached pages
  useEffect(() => {
    if (!a || !a.enabled || !a.text) { setShow(false); return; }
    const now = Date.now();
    if (a.start && now < new Date(a.start).getTime()) { setShow(false); return; }
    if (a.end && now > new Date(a.end).getTime()) { setShow(false); return; }
    try { if (localStorage.getItem(key)) { setShow(false); return; } } catch {}
    setShow(true);
  }, [a, key]);

  if (!show || !a) return null;
  const external = a.link_url && /^https?:/i.test(a.link_url);
  return (
    <div
      role="region" aria-label="Announcement"
      className="relative flex items-center justify-center bg-[var(--accent)] py-2.5 pl-4 pr-14 text-center text-sm font-medium text-[color:var(--on-accent)] print:hidden"
    >
      <span>
        {a.text}
        {a.link_url && (
          <a href={a.link_url} {...(external ? { target: "_blank", rel: "noreferrer" } : {})} className="ml-2 underline underline-offset-4">
            {a.link_label || "Learn more"}
          </a>
        )}
      </span>
      <button
        aria-label="Dismiss announcement"
        className="absolute right-1 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full hover:bg-black/10"
        onClick={() => { try { localStorage.setItem(key, "1"); } catch {} setShow(false); }}
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
