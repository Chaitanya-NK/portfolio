"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { Play, X } from "lucide-react";
import { embedUrl, parseVideo } from "@/lib/video";

type V = { url?: string | null; file_url?: string | null; poster_url?: string | null };

export function IntroVideo({ v }: { v: V }) {
  const [open, setOpen] = useState(false);
  const opener = useRef<HTMLButtonElement>(null);
  const closeBtn = useRef<HTMLButtonElement>(null);
  const embed = v.file_url ? null : v.url ? parseVideo(v.url) : null;

  const close = useCallback(() => { setOpen(false); opener.current?.focus(); }, []);

  useEffect(() => {
    if (!open) return;
    const key = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
    window.addEventListener("keydown", key);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeBtn.current?.focus();
    return () => { window.removeEventListener("keydown", key); document.body.style.overflow = prev; };
  }, [open, close]);

  if (!v.file_url && !embed) return null;

  return (
    <>
      <button
        ref={opener} type="button" onClick={() => setOpen(true)} aria-haspopup="dialog"
        data-track="social" data-label="Intro video"
        className="flex min-h-11 items-center gap-3 rounded-md border border-[color:var(--line)] py-1.5 pl-1.5 pr-4 text-sm font-medium transition-colors hover:border-[color:var(--accent-ink)]"
      >
        <span className="relative flex h-9 w-14 shrink-0 items-center justify-center overflow-hidden rounded bg-[color:var(--surface2)]">
          {v.poster_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={v.poster_url} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
          )}
          <span className="relative flex h-6 w-6 items-center justify-center rounded-full bg-[var(--accent)] text-[color:var(--on-accent)]">
            <Play className="h-3 w-3 fill-current" />
          </span>
        </span>
        Watch intro
      </button>

      {open && (
        <div role="dialog" aria-modal="true" aria-label="Intro video" onClick={close}
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/85 p-3 sm:p-6">
          <div className="relative w-full max-w-4xl" onClick={(e) => e.stopPropagation()}>
            <button ref={closeBtn} type="button" onClick={close} aria-label="Close video"
              className="absolute -top-12 right-0 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20">
              <X className="h-5 w-5" />
            </button>
            <div className="aspect-video w-full overflow-hidden rounded-xl bg-black">
              {v.file_url ? (
                <video src={v.file_url} poster={v.poster_url ?? undefined} controls autoPlay playsInline preload="metadata" className="h-full w-full" />
              ) : (
                <iframe
                  src={embed ? embedUrl(embed) : undefined} title="Intro video" className="h-full w-full border-0"
                  allow="autoplay; fullscreen; picture-in-picture" allowFullScreen referrerPolicy="strict-origin-when-cross-origin"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
