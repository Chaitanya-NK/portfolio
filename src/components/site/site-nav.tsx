"use client";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";

type L = { label: string; href: string };

export function SiteNav({ name, links, cta }: { name: string; links: L[]; cta?: L }) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState("");
  const key = links.map((l) => l.href).join("|");

  // highlight the link of the section being read
  useEffect(() => {
    const els = links.map((l) => document.getElementById(l.href.replace(/^#/, ""))).filter(Boolean) as HTMLElement[];
    if (!els.length) return;
    const io = new IntersectionObserver(
      (entries) => {
        const hit = entries.filter((e) => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (hit) setActive(hit.target.id);
      },
      { rootMargin: "-25% 0px -65% 0px" }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const link = "rounded-md px-2.5 py-1.5 text-[0.8125rem] text-[color:var(--muted)] transition-colors hover:text-[color:var(--fg)] aria-[current=true]:bg-[color:var(--surface2)] aria-[current=true]:text-[color:var(--fg)]";

  return (
    <header className="sticky top-0 z-40 border-b border-[color:var(--line)] bg-[color-mix(in_srgb,var(--bg)_85%,transparent)] backdrop-blur">
      <div className="mx-auto flex h-14 w-[min(92%,64rem)] items-center justify-between gap-6">
        <a href="#" className="min-w-0 truncate text-sm font-semibold tracking-tight">{name}</a>
        <nav className="hidden items-center gap-0.5 lg:flex" aria-label="Sections">
          {links.map((l) => (
            <a key={l.href} href={l.href} aria-current={active === l.href.slice(1) ? "true" : undefined} className={link}>{l.label}</a>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          {cta && (
            <a href={cta.href} className="hidden h-9 items-center rounded-md bg-[var(--accent)] px-3.5 text-[0.8125rem] font-medium text-[color:var(--on-accent)] transition hover:brightness-95 sm:inline-flex">
              {cta.label}
            </a>
          )}
          <button type="button" aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open} onClick={() => setOpen((o) => !o)}
            className="flex h-11 w-11 items-center justify-center rounded-md text-[color:var(--muted)] hover:bg-[color:var(--surface2)] lg:hidden">
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>
      {open && (
        <nav className="border-t border-[color:var(--line)] bg-[color:var(--bg)] lg:hidden" aria-label="Sections">
          <div className="mx-auto flex max-h-[70dvh] w-[min(92%,64rem)] flex-col overflow-y-auto py-2">
            {links.map((l) => (
              <a key={l.href} href={l.href} onClick={() => setOpen(false)} className="flex min-h-11 items-center rounded-md px-2 text-sm text-[color:var(--fg2)] hover:bg-[color:var(--surface2)]">{l.label}</a>
            ))}
            {cta && <a href={cta.href} onClick={() => setOpen(false)} className="mt-1 flex min-h-11 items-center rounded-md px-2 text-sm font-medium text-[color:var(--accent-ink)]">{cta.label}</a>}
          </div>
        </nav>
      )}
    </header>
  );
}
