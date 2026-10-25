"use client";
import { useEffect, useState } from "react";
import { getLive } from "@/app/admin/(panel)/live-actions";

type Live = { count: number; pages: { path: string; n: number }[] };

export function LiveVisitors() {
  const [live, setLive] = useState<Live | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let dead = false;
    const load = async () => {
      if (document.visibilityState !== "visible") return;
      try { const r = await getLive(); if (!dead) { setLive(r); setFailed(false); } }
      catch { if (!dead) setFailed(true); }
    };
    load();
    const t = setInterval(load, 15000);
    document.addEventListener("visibilitychange", load);
    return () => { dead = true; clearInterval(t); document.removeEventListener("visibilitychange", load); };
  }, []);

  const n = live?.count ?? 0;
  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-3 rounded-xl border bg-white p-5">
      <div className="flex items-center gap-3">
        <span className="relative flex h-3 w-3" aria-hidden>
          {n > 0 && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />}
          <span className={`relative inline-flex h-3 w-3 rounded-full ${n > 0 ? "bg-green-500" : "bg-neutral-300"}`} />
        </span>
        <div>
          <div className="text-3xl font-semibold leading-none" aria-live="polite">{failed ? "–" : live ? n : "…"}</div>
          <div className="mt-1 text-sm text-neutral-500">{n === 1 ? "person on your site now" : "people on your site now"}</div>
        </div>
      </div>
      {live && live.pages.length > 0 && (
        <ul className="flex flex-wrap gap-2 text-xs">
          {live.pages.map((p) => (
            <li key={p.path} className="rounded-full bg-neutral-100 px-3 py-1.5">
              <span className="font-medium">{p.path}</span> <span className="text-neutral-500">· {p.n}</span>
            </li>
          ))}
        </ul>
      )}
      {failed && <span className="text-xs text-neutral-500">Couldn’t refresh. Retrying…</span>}
    </div>
  );
}
