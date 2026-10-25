"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

type Img = { url: string; alt?: string; caption?: string };

export function Gallery({ items }: { items: Img[] }) {
  const [i, setI] = useState<number | null>(null);
  const opener = useRef<HTMLElement | null>(null);
  const closeBtn = useRef<HTMLButtonElement>(null);
  const touchX = useRef<number | null>(null);
  const isOpen = i !== null;

  const close = useCallback(() => { setI(null); opener.current?.focus(); }, []);
  const go = useCallback((d: number) => setI((c) => (c === null ? c : (c + d + items.length) % items.length)), [items.length]);

  useEffect(() => {
    if (!isOpen) return;
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      else if (e.key === "ArrowLeft") go(-1);
      else if (e.key === "ArrowRight") go(1);
    };
    window.addEventListener("keydown", key);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeBtn.current?.focus();
    return () => { window.removeEventListener("keydown", key); document.body.style.overflow = prev; };
  }, [isOpen, close, go]);

  const cur = i !== null ? items[i] : null;
  const nav = "absolute top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20";

  return (
    <>
      <ul className="grid gap-3 sm:grid-cols-2">
        {items.map((g, n) => (
          <li key={n}>
            <button
              type="button" onClick={(e) => { opener.current = e.currentTarget; setI(n); }}
              className="group block w-full overflow-hidden rounded-xl border border-[color:var(--line)] bg-[color:var(--surface2)] text-left"
              aria-label={`View image ${n + 1} of ${items.length}${g.caption ? `: ${g.caption}` : ""}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={g.url} alt={g.alt || g.caption || ""} loading="lazy" className="aspect-[16/10] w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]" />
            </button>
            {g.caption && <p className="mt-2 text-sm text-[color:var(--muted)]">{g.caption}</p>}
          </li>
        ))}
      </ul>

      {cur && (
        <div
          role="dialog" aria-modal="true" aria-label="Image viewer"
          className="fixed inset-0 z-[70] flex flex-col items-center justify-center bg-black/90 p-4"
          onClick={close}
          onTouchStart={(e) => { touchX.current = e.touches[0].clientX; }}
          onTouchEnd={(e) => {
            if (touchX.current === null) return;
            const dx = e.changedTouches[0].clientX - touchX.current;
            touchX.current = null;
            if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
          }}
        >
          <button ref={closeBtn} type="button" onClick={close} aria-label="Close viewer"
            className="absolute right-3 top-[max(0.75rem,env(safe-area-inset-top))] flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20">
            <X className="h-5 w-5" />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={cur.url} alt={cur.alt || cur.caption || ""} onClick={(e) => e.stopPropagation()} className="max-h-[78dvh] max-w-full rounded-lg object-contain" />
          <div className="mt-3 max-w-2xl text-center text-sm text-white/90" onClick={(e) => e.stopPropagation()}>
            {cur.caption && <p>{cur.caption}</p>}
            <p className="mt-1 text-xs text-white/60">{(i ?? 0) + 1} / {items.length}</p>
          </div>
          {items.length > 1 && (
            <>
              <button type="button" onClick={(e) => { e.stopPropagation(); go(-1); }} aria-label="Previous image" className={`${nav} left-2 sm:left-4`}><ChevronLeft className="h-5 w-5" /></button>
              <button type="button" onClick={(e) => { e.stopPropagation(); go(1); }} aria-label="Next image" className={`${nav} right-2 sm:right-4`}><ChevronRight className="h-5 w-5" /></button>
            </>
          )}
        </div>
      )}
    </>
  );
}
