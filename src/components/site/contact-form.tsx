"use client";
import { useActionState, useEffect, useRef, useState } from "react";
import { ChevronDown, Paperclip, X } from "lucide-react";
import { sendMessage, type ContactState } from "@/app/(site)/actions";
import { TOPICS } from "@/lib/topics";
import { Turnstile } from "./turnstile";

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
const MAX = 2.5 * 1024 * 1024;
const input = "w-full rounded-md border border-[color:var(--line)] bg-[color:var(--bg)] px-3 py-2.5 text-sm text-[color:var(--fg)] outline-none placeholder:text-[color:var(--faint)] focus:border-[color:var(--accent-ink)]";

export function ContactForm() {
  const [state, action, pending] = useActionState<ContactState, FormData>(sendMessage, null);
  const [token, setToken] = useState("");
  const [tick, setTick] = useState(0);
  const [file, setFile] = useState<File | null>(null);
  const [fileErr, setFileErr] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const clearFile = () => { setFile(null); if (fileRef.current) fileRef.current.value = ""; };

  // a Turnstile token works only once, so get a fresh one after every submit
  useEffect(() => {
    if (!state) return;
    setTick((t) => t + 1);
    setToken("");
    if (state.ok) { setFile(null); setFileErr(""); }
  }, [state]);

  return (
    <form action={action} className="flex flex-col gap-3">
      <input name="website" tabIndex={-1} autoComplete="off" aria-hidden className="absolute left-[-9999px] h-0 w-0 opacity-0" />
      <input name="name" placeholder="Your name" aria-label="Your name" required maxLength={100} className={input} />
      <input name="email" type="email" placeholder="Your email" aria-label="Your email" required maxLength={200} className={input} />

      <div className="relative">
        <select name="topic" defaultValue="general" aria-label="What is this about?" className={`${input} appearance-none pr-10`}>
          {Object.entries(TOPICS).map(([k, t]) => <option key={k} value={k}>{t.label}</option>)}
        </select>
        <ChevronDown aria-hidden className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--muted)]" />
      </div>

      <textarea name="message" placeholder="How can I help?" aria-label="Message" required minLength={10} maxLength={4000} rows={5} className={input} />

      <div className="flex flex-col gap-1">
        <input
          ref={fileRef} type="file" name="attachment" className="hidden"
          accept=".pdf,.png,.jpg,.jpeg,.webp,.docx,.txt"
          onChange={(e) => {
            const f = e.target.files?.[0] ?? null;
            if (f && f.size > MAX) { setFileErr("That file is over 2.5 MB."); clearFile(); return; }
            setFileErr(""); setFile(f);
          }}
        />
        {file ? (
          <div className="flex items-center justify-between gap-2 rounded-md border border-[color:var(--line)] px-4 py-2.5 text-sm">
            <span className="flex min-w-0 items-center gap-2"><Paperclip className="h-4 w-4 shrink-0" /><span className="truncate">{file.name}</span></span>
            <button type="button" onClick={clearFile} aria-label="Remove attachment" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full hover:bg-[color:var(--surface2)]"><X className="h-4 w-4" /></button>
          </div>
        ) : (
          <button type="button" onClick={() => fileRef.current?.click()}
            className="flex min-h-11 items-center gap-2 self-start rounded-md border border-dashed border-[color:var(--line2)] px-4 text-sm text-[color:var(--muted)] hover:border-[color:var(--accent-ink)] hover:text-[color:var(--fg)]">
            <Paperclip className="h-4 w-4" />Attach a file (optional)
          </button>
        )}
        <span className="text-xs text-[color:var(--faint)]">PDF, image, DOCX or TXT, up to 2.5 MB.</span>
        {fileErr && <span role="alert" className="text-xs text-red-400">{fileErr}</span>}
      </div>

      {SITE_KEY && (
        <>
          <input type="hidden" name="cf-turnstile-response" value={token} />
          <Turnstile siteKey={SITE_KEY} onToken={setToken} resetSignal={tick} />
        </>
      )}

      <button disabled={pending || (!!SITE_KEY && !token)} className="min-h-11 rounded-md bg-[var(--accent)] px-5 text-sm font-semibold text-[color:var(--on-accent)] disabled:opacity-60">
        {pending ? "Sending…" : SITE_KEY && !token ? "Verifying you’re human…" : "Send message"}
      </button>
      {state && <p role="status" className={`text-sm ${state.ok ? "text-[color:var(--accent-ink)]" : "text-red-400"}`}>{state.message}</p>}
    </form>
  );
}
