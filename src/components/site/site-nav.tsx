"use client";
import { useState } from "react";

type L = { label: string; href: string };

export function SiteNav({ name, links, cta }: { name: string; links: L[]; cta?: L }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="sticky top-3 z-40 mx-auto mt-3 w-[min(1120px,92%)]">
      <div className="flex items-center justify-between rounded-full border border-[#23232F] bg-[#12121A]/85 py-2 pl-5 pr-2 backdrop-blur-md">
        <a href="#" className="font-[family-name:var(--font-display)] text-lg font-bold">
          {name}<span className="text-[var(--accent)]">.</span>
        </a>
        <nav className="hidden gap-7 text-sm text-[#9A9AAE] lg:flex">
          {links.map((l) => <a key={l.href} href={l.href} className="transition-colors hover:text-white">{l.label}</a>)}
        </nav>
        <div className="flex items-center gap-2">
          {cta && (
            <a href={cta.href} className="rounded-full bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-[#0A0A0F]">{cta.label}</a>
          )}
          <button aria-label="Menu" aria-expanded={open} onClick={() => setOpen((o) => !o)}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-[#23232F] text-[#9A9AAE] lg:hidden">
            {open ? "✕" : "☰"}
          </button>
        </div>
      </div>
      {open && (
        <div className="mt-2 flex flex-col rounded-2xl border border-[#23232F] bg-[#12121A]/95 p-2 backdrop-blur-md lg:hidden">
          {links.map((l) => (
            <a key={l.href} href={l.href} onClick={() => setOpen(false)} className="rounded-xl px-4 py-3 text-[#C9C9D6] hover:bg-white/5">{l.label}</a>
          ))}
        </div>
      )}
    </div>
  );
}
