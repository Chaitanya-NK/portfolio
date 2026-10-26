"use client";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import {
  AlertCircle, Check, File as FileIcon, FileText, Film, Image as ImageIcon, Maximize2, Minus, Music, RotateCcw, X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  cancel, cancelAll, dismiss, getServerSnapshot, getSnapshot, retry, retryFailed, setMinimized, subscribe, type Item,
} from "@/lib/upload-store";

const bytes = (n: number) => (n < 1024 ? `${n} B` : n < 1048576 ? `${(n / 1024).toFixed(0)} KB` : n < 1073741824 ? `${(n / 1048576).toFixed(n < 10485760 ? 1 : 0)} MB` : `${(n / 1073741824).toFixed(1)} GB`);
const rate = (n: number) => `${bytes(Math.round(n))}/s`;
const eta = (s: number) => (!isFinite(s) || s < 0 ? "" : s < 60 ? `${Math.max(1, Math.ceil(s))}s left` : `${Math.floor(s / 60)}m ${Math.ceil(s % 60)}s left`);
const kind = (i: Item) =>
  i.type.startsWith("image/") ? "image" : i.type.startsWith("video/") ? "video" : i.type.startsWith("audio/") ? "audio"
  : i.type === "application/pdf" || /\.pdf$/i.test(i.name) ? "pdf" : "other";

function Thumb({ it }: { it: Item }) {
  const k = kind(it);
  const box = "relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-neutral-100";
  if (k === "image")
    return <span className={box}>{/* eslint-disable-next-line @next/next/no-img-element */}<img src={it.preview} alt="" className="h-full w-full object-cover" /></span>;
  if (k === "video")
    return <span className={box}><video src={`${it.preview}#t=0.1`} muted playsInline preload="metadata" className="h-full w-full object-cover" /><Film className="absolute h-4 w-4 text-white drop-shadow" /></span>;
  if (k === "audio")
    return <span className={`${box} bg-indigo-50 text-indigo-600`}>{it.status === "uploading" ? <span className="up-eq flex h-4 items-end" aria-hidden><i /><i /><i /></span> : <Music className="h-5 w-5" />}</span>;
  if (k === "pdf") return <span className={`${box} bg-red-50 text-red-600`}><FileText className="h-5 w-5" /></span>;
  return <span className={box}><FileIcon className="h-5 w-5 text-neutral-500" /></span>;
}

function Preview({ it }: { it: Item }) {
  const k = kind(it);
  return (
    <div className="mt-3 overflow-hidden rounded-lg border bg-neutral-50 p-2">
      {k === "image" && /* eslint-disable-next-line @next/next/no-img-element */ <img src={it.preview} alt={it.name} className="mx-auto max-h-64 rounded object-contain" />}
      {k === "video" && <video src={it.preview} controls playsInline preload="metadata" className="mx-auto max-h-64 w-full rounded bg-black" />}
      {k === "audio" && <audio src={it.preview} controls className="w-full" />}
      {k === "pdf" && (
        <>
          <iframe src={it.preview} title={`Preview of ${it.name}`} className="h-72 w-full rounded bg-white" />
          <a href={it.preview} target="_blank" rel="noreferrer" className="mt-2 inline-block text-xs text-indigo-600 underline">Open in a new tab</a>
        </>
      )}
      {k === "other" && <p className="p-3 text-center text-xs text-neutral-500">No preview for this file type.</p>}
    </div>
  );
}

function Row({ it, open, toggle }: { it: Item; open: boolean; toggle: () => void }) {
  const st = it.status;
  const pct = it.size ? Math.min(100, Math.round((it.loaded / it.size) * 100)) : 0;
  const line =
    st === "queued" ? "Waiting…"
    : st === "uploading" ? [`${bytes(it.loaded)} of ${bytes(it.size)}`, it.speed > 0 && rate(it.speed), it.speed > 0 && eta((it.size - it.loaded) / it.speed)].filter(Boolean).join(" · ")
    : st === "processing" ? "Finalizing…"
    : st === "done" ? `${bytes(it.size)} · Uploaded`
    : st === "canceled" ? "Canceled"
    : it.error ?? "Failed";
  const fill = st === "done" ? "done" : st === "error" ? "err" : st === "processing" ? "live indet" : st === "uploading" ? "live" : "";
  const width = st === "done" || st === "processing" ? 100 : st === "queued" || st === "canceled" ? 0 : pct;

  return (
    <li className={`rounded-xl border p-3 ${st === "error" ? "up-shake border-red-200 bg-red-50/50" : ""}`}>
      <div className="flex items-center gap-3">
        <button type="button" onClick={toggle} aria-expanded={open} aria-label={`Preview ${it.name}`} className="flex min-w-0 flex-1 items-center gap-3 text-left">
          <Thumb it={it} />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium">{it.name}</span>
            <span className={`block truncate text-xs ${st === "error" ? "text-red-600" : "text-neutral-500"}`}>{line}</span>
          </span>
        </button>
        {isActive(st) && (
          <button type="button" onClick={() => cancel(it.id)} aria-label={`Cancel ${it.name}`} className="flex h-9 w-9 items-center justify-center rounded-md text-neutral-500 hover:bg-neutral-100"><X className="h-4 w-4" /></button>
        )}
        {st === "done" && (
          <span className="up-pop flex h-7 w-7 items-center justify-center rounded-full bg-green-100 text-green-700" aria-label="Uploaded">
            <svg className="up-check h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
          </span>
        )}
        {st === "error" && (
          it.canRetry
            ? <button type="button" onClick={() => retry(it.id)} aria-label={`Retry ${it.name}`} className="flex h-9 w-9 items-center justify-center rounded-md text-red-600 hover:bg-red-100"><RotateCcw className="h-4 w-4" /></button>
            : <AlertCircle className="h-5 w-5 text-red-500" aria-label="Failed" />
        )}
      </div>
      <div className="up-bar mt-2.5" role="progressbar" aria-label={`${it.name} progress`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={width}>
        <div className={`up-fill ${fill}`} style={{ width: `${width}%` }} />
      </div>
      {open && <Preview it={it} />}
    </li>
  );
}
const isActive = (s: Item["status"]) => s === "queued" || s === "uploading" || s === "processing";

function Ring({ pct, ok }: { pct: number; ok: boolean }) {
  const c = 2 * Math.PI * 11;
  return (
    <svg width="30" height="30" viewBox="0 0 30 30" aria-hidden>
      <circle cx="15" cy="15" r="11" fill="none" stroke="#E5E7EB" strokeWidth="3.5" />
      <circle cx="15" cy="15" r="11" fill="none" stroke={ok ? "#16A34A" : "#4F46E5"} strokeWidth="3.5" strokeLinecap="round"
        strokeDasharray={c} strokeDashoffset={c * (1 - (ok ? 1 : pct / 100))} transform="rotate(-90 15 15)" style={{ transition: "stroke-dashoffset .25s" }} />
      {ok && <path d="M10 15.5l3.2 3.2L20 11.5" fill="none" stroke="#16A34A" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />}
    </svg>
  );
}

export function UploadCenter() {
  const s = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [openId, setOpenId] = useState<string | null>(null);
  const box = useRef<HTMLDivElement>(null);

  const items = s.items;
  const active = items.filter((i) => isActive(i.status));
  const done = items.filter((i) => i.status === "done").length;
  const failed = items.filter((i) => i.status === "error").length;
  const retryable = items.filter((i) => i.status === "error" && i.canRetry).length;
  const counted = items.filter((i) => i.status !== "canceled");
  const total = counted.reduce((a, i) => a + i.size, 0);
  const loaded = counted.reduce((a, i) => a + (i.status === "done" ? i.size : i.loaded), 0);
  const pct = total ? Math.min(100, Math.round((loaded / total) * 100)) : 0;
  const speed = items.reduce((a, i) => a + (i.status === "uploading" ? i.speed : 0), 0);
  const remaining = speed > 0 ? eta((total - loaded) / speed) : "";
  const allOk = items.length > 0 && active.length === 0 && failed === 0 && done > 0;
  const shown = s.open && items.length > 0;

  useEffect(() => {
    if (!active.length) return;
    const warn = (e: BeforeUnloadEvent) => { e.preventDefault(); };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [active.length]);

  useEffect(() => {
    if (!shown || s.minimized) return;
    box.current?.focus();
    const key = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (active.length) setMinimized(true); else dismiss();
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [shown, s.minimized, active.length]);

  if (!shown) return null;

  const title = active.length
    ? `Uploading ${items.length === 1 ? "file" : `${done + 1} of ${items.length}`}`
    : allOk ? (done === 1 ? "File uploaded" : `${done} files uploaded`)
    : failed ? `${failed} ${failed === 1 ? "file" : "files"} couldn’t be uploaded` : "Upload finished";
  const sub = active.length
    ? [`${pct}%`, `${bytes(loaded)} of ${bytes(total)}`, speed > 0 && rate(speed), remaining].filter(Boolean).join(" · ")
    : allOk ? "Everything is saved." : `${done} uploaded${failed ? `, ${failed} failed` : ""}`;

  if (s.minimized)
    return (
      <button type="button" onClick={() => setMinimized(false)} aria-label="Show upload details" data-upload-center
        className="up-in pointer-events-auto fixed bottom-4 right-4 z-[90] flex items-center gap-3 rounded-full border bg-white py-2 pl-2.5 pr-4 text-left shadow-xl">
        <Ring pct={pct} ok={allOk} />
        <span className="flex flex-col leading-tight">
          <span className="text-sm font-medium">{title}</span>
          <span className="text-xs text-neutral-500">{active.length ? `${pct}%${remaining ? ` · ${remaining}` : ""}` : "Click to view"}</span>
        </span>
        <Maximize2 className="h-4 w-4 text-neutral-400" />
      </button>
    );

  const finished = active.length === 0;
  return (
    <div data-upload-center className="pointer-events-auto fixed inset-0 z-[90] flex items-center justify-center bg-neutral-900/50 p-3 backdrop-blur-[2px] sm:p-6"
      onMouseDown={(e) => { if (e.target === e.currentTarget) { if (active.length) setMinimized(true); else dismiss(); } }}>
      <div ref={box} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="upload-title"
        className="up-in flex max-h-[88dvh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl outline-none">
        <div className="flex items-start gap-3 p-5 pb-3">
          <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${allOk ? "up-pop bg-green-100 text-green-700" : failed && finished ? "bg-red-100 text-red-600" : "bg-indigo-50 text-indigo-600"}`}>
            {allOk ? <Check className="h-5 w-5" /> : failed && finished ? <AlertCircle className="h-5 w-5" /> : <ImageIcon className="h-5 w-5" />}
          </span>
          <div className="min-w-0 flex-1" aria-live="polite">
            <h2 id="upload-title" className="text-base font-semibold">{title}</h2>
            <p className="truncate text-sm text-neutral-500">{sub}</p>
          </div>
          {active.length > 0
            ? <button type="button" onClick={() => setMinimized(true)} aria-label="Minimize" title="Run in background" className="flex h-9 w-9 items-center justify-center rounded-md text-neutral-500 hover:bg-neutral-100"><Minus className="h-4 w-4" /></button>
            : <button type="button" onClick={dismiss} aria-label="Close" className="flex h-9 w-9 items-center justify-center rounded-md text-neutral-500 hover:bg-neutral-100"><X className="h-4 w-4" /></button>}
        </div>

        <div className="px-5 pb-4">
          <div className="up-bar h-2" role="progressbar" aria-label="Overall progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct}>
            <div className={`up-fill ${allOk ? "done" : failed && finished ? "err" : "live"}`} style={{ width: `${finished ? (failed && !done ? pct : 100) : pct}%` }} />
          </div>
        </div>

        <ul className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto border-t px-5 py-4">
          {items.map((it) => <Row key={it.id} it={it} open={openId === it.id} toggle={() => setOpenId(openId === it.id ? null : it.id)} />)}
        </ul>

        <div className="flex flex-wrap items-center justify-end gap-2 border-t bg-neutral-50 px-5 py-3">
          {active.length > 0 ? (
            <>
              <Button variant="ghost" size="sm" onClick={cancelAll}>Cancel all</Button>
              <Button size="sm" onClick={() => setMinimized(true)}>Run in background</Button>
            </>
          ) : (
            <>
              {retryable > 0 && <Button variant="outline" size="sm" onClick={retryFailed}><RotateCcw className="mr-1.5 h-3.5 w-3.5" />Retry {retryable} failed</Button>}
              <Button size="sm" onClick={dismiss}>{allOk ? "Done" : "Close"}</Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
