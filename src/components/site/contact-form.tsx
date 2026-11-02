"use client";
import { useActionState, useEffect, useRef, useState } from "react";
import { Paperclip, Send, X } from "lucide-react";
import { sendMessage, type ContactState } from "@/app/(site)/actions";
import { TOPICS } from "@/lib/topics";
import { Turnstile } from "./turnstile";

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
const MAX = 2.5 * 1024 * 1024;
const row = "flex flex-col gap-1.5 border-b border-[color:var(--line)] px-5 py-3 sm:flex-row sm:items-center sm:gap-4";
const label = "w-14 shrink-0 font-[family-name:var(--font-mono)] text-[0.6875rem] uppercase tracking-[0.1em] text-[color:var(--faint)]";
const field = "min-w-0 flex-1 bg-transparent py-1 text-sm text-[color:var(--fg)] outline-none placeholder:text-[color:var(--faint)]";

export function ContactForm({ to }: { to?: string | null }) {
  const [state, action, pending] = useActionState<ContactState, FormData>(sendMessage, null);
  const [token, setToken] = useState("");
  const [tick, setTick] = useState(0);
  const [file, setFile] = useState<File | null>(null);
  const [fileErr, setFileErr] = useState("");
  const [msg, setMsg] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const clearFile = () => { setFile(null); if (fileRef.current) fileRef.current.value = ""; };

  // a Turnstile token works only once, so get a fresh one after every submit
  useEffect(() => {
    if (!state) return;
    setTick((t) => t + 1);
    setToken("");
    if (state.ok) { setFile(null); setFileErr(""); setMsg(""); }
  }, [state]);

  const blocked = pending || (!!SITE_KEY && !token);

  return (
    <form action={action} className="flex flex-1 flex-col">
      <input name="website" tabIndex={-1} autoComplete="off" aria-hidden className="absolute left-[-9999px] h-0 w-0 opacity-0" />

      {to && (
        <div className={row}>
          <span className={label}>To</span>
          <span className="inline-flex w-fit items-center gap-2 rounded-full border border-[color:var(--line2)] bg-[color:var(--surface2)] py-0.5 pl-1 pr-3 text-sm">
            <span aria-hidden className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--accent)] text-[0.625rem] font-semibold text-[color:var(--on-accent)]">{to.slice(0, 1).toUpperCase()}</span>
            {to}
          </span>
        </div>
      )}

      <div className={row}>
        <label htmlFor="cf-name" className={label}>From</label>
        <div className="flex min-w-0 flex-1 flex-col gap-1 sm:flex-row sm:gap-4">
          <input id="cf-name" name="name" placeholder="Your name" required maxLength={100} className={`${field} sm:border-r sm:border-[color:var(--line)] sm:pr-4`} />
          <input name="email" type="email" placeholder="you@example.com" aria-label="Your email" required maxLength={200} className={field} />
        </div>
      </div>

      <fieldset className={row}>
        <legend className="sr-only">What is this about?</legend>
        <span aria-hidden className={label}>About</span>
        <div className="flex flex-wrap gap-1.5">
          {Object.entries(TOPICS).map(([k, t]) => (
            <label key={k} title={t.label} className="cursor-pointer">
              <input type="radio" name="topic" value={k} defaultChecked={k === "general"} className="peer sr-only" />
              <span className="inline-flex min-h-8 items-center rounded-full border border-[color:var(--line2)] px-3 text-xs text-[color:var(--muted)] transition-colors hover:text-[color:var(--fg)] peer-checked:border-[var(--accent)] peer-checked:bg-[var(--accent)] peer-checked:font-medium peer-checked:text-[color:var(--on-accent)] peer-focus-visible:ring-2 peer-focus-visible:ring-[color:var(--accent-ink)]">
                {t.tag || "Other"}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <textarea
        name="message" value={msg} onChange={(e) => setMsg(e.target.value)}
        placeholder="Write your message…" aria-label="Message" required minLength={10} maxLength={4000} rows={4}
        className="min-h-32 w-full flex-1 resize-none bg-transparent px-5 py-4 text-sm leading-relaxed text-[color:var(--fg)] outline-none placeholder:text-[color:var(--faint)]"
      />

      {SITE_KEY && (
        <div className="px-5 pb-3">
          <input type="hidden" name="cf-turnstile-response" value={token} />
          <Turnstile siteKey={SITE_KEY} onToken={setToken} resetSignal={tick} />
        </div>
      )}

      <input
        ref={fileRef} type="file" name="attachment" className="hidden"
        accept=".pdf,.png,.jpg,.jpeg,.webp,.docx,.txt"
        onChange={(e) => {
          const f = e.target.files?.[0] ?? null;
          if (f && f.size > MAX) { setFileErr("That file is over 2.5 MB."); clearFile(); return; }
          setFileErr(""); setFile(f);
        }}
      />
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-[color:var(--line)] bg-[color:var(--surface2)] px-4 py-3">
        <button
          type="button" onClick={() => fileRef.current?.click()} aria-label="Attach a file (PDF, image, DOCX or TXT, up to 2.5 MB)" title="PDF, image, DOCX or TXT, up to 2.5 MB"
          className="flex h-10 w-10 items-center justify-center rounded-md text-[color:var(--muted)] transition-colors hover:bg-[color:var(--surface)] hover:text-[color:var(--fg)]"
        >
          <Paperclip className="h-4 w-4" />
        </button>
        {file && (
          <span className="inline-flex min-w-0 max-w-[12rem] items-center gap-1 rounded-full border border-[color:var(--line2)] bg-[color:var(--surface)] py-0.5 pl-3 pr-1 text-xs sm:max-w-[16rem]">
            <span className="truncate">{file.name}</span>
            <button type="button" onClick={clearFile} aria-label="Remove attachment" className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full hover:bg-[color:var(--surface2)]"><X className="h-3.5 w-3.5" /></button>
          </span>
        )}
        <span className="ml-auto font-[family-name:var(--font-mono)] text-[0.6875rem] tabular-nums text-[color:var(--faint)]" aria-hidden>{msg.length}/4000</span>
        <button
          disabled={blocked}
          className="inline-flex min-h-10 items-center gap-2 rounded-md bg-[var(--accent)] px-5 text-sm font-semibold text-[color:var(--on-accent)] transition hover:brightness-95 disabled:opacity-60"
        >
          {pending ? "Sending…" : SITE_KEY && !token ? "Verifying…" : <>Send<Send className="h-3.5 w-3.5" aria-hidden /></>}
        </button>
      </div>
      {(fileErr || state) && (
        <div className="px-5 py-3">
          {fileErr && <p role="alert" className="text-xs text-red-400">{fileErr}</p>}
          {state && <p role="status" className={`text-sm ${state.ok ? "text-[color:var(--accent-ink)]" : "text-red-400"}`}>{state.message}</p>}
        </div>
      )}
    </form>
  );
}
