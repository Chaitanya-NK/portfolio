"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowUpRight, Check, Copy, Plus, Send, Sparkles, X } from "lucide-react";
import { askAbout } from "@/app/(site)/ask/actions";

type Msg = { role: "user" | "model"; text: string; fresh?: boolean };

const SUGGEST = ["Summarise this portfolio", "What tools and skills are used?", "Tell me about the projects", "How can I get in touch?"];
const KEY = "ask-chat-v1";
const LINK = /(https?:\/\/[^\s<>()]+[^\s<>().,;:!?'")\]]|[\w.+-]+@[\w-]+\.[\w.-]*[A-Za-z])/g;

function Linked({ text }: { text: string }) {
  return (
    <>
      {text.split(LINK).map((part, i) => {
        if (i % 2 === 0) return part;
        const mail = !/^https?:/i.test(part);
        return (
          <a
            key={i} href={mail ? `mailto:${part}` : part}
            {...(mail ? {} : { target: "_blank", rel: "noopener noreferrer nofollow" })}
            className="break-all underline underline-offset-2 hover:text-[color:var(--accent-ink)]"
          >
            {part}
          </a>
        );
      })}
    </>
  );
}

function Answer({ text }: { text: string }) {
  const blocks: ({ t: "p"; s: string } | { t: "ul"; items: string[] })[] = [];
  for (const raw of text.split("\n")) {
    const l = raw.trim();
    if (!l) continue;
    if (l.startsWith("• ")) {
      const last = blocks[blocks.length - 1];
      if (last?.t === "ul") last.items.push(l.slice(2));
      else blocks.push({ t: "ul", items: [l.slice(2)] });
    } else blocks.push({ t: "p", s: l });
  }
  return (
    <div className="flex flex-col gap-2">
      {blocks.map((b, i) =>
        b.t === "p" ? (
          <p key={i}><Linked text={b.s} /></p>
        ) : (
          <ul key={i} className="flex list-disc flex-col gap-1 pl-4">
            {b.items.map((it, j) => <li key={j}><Linked text={it} /></li>)}
          </ul>
        )
      )}
    </div>
  );
}

function Typed({ text, animate, onTick }: { text: string; animate: boolean; onTick: () => void }) {
  const [n, setN] = useState(animate ? 0 : text.length);

  useEffect(() => {
    if (!animate || window.matchMedia("(prefers-reduced-motion: reduce)").matches) { setN(text.length); return; }
    const step = Math.max(3, Math.ceil(text.length / 110));
    let pos = 0;
    const t = setInterval(() => {
      pos = Math.min(text.length, pos + step);
      setN(pos);
      if (pos >= text.length) clearInterval(t);
    }, 20);
    return () => clearInterval(t);
  }, [text, animate]);

  useEffect(() => { onTick(); }, [n, onTick]);

  return (
    <>
      <span className="sr-only">{text}</span>
      <div aria-hidden>
        <Answer text={text.slice(0, n)} />
        {n < text.length && <span className="ask-caret" />}
      </div>
    </>
  );
}

const iconBtn =
  "flex h-9 w-9 items-center justify-center rounded-md text-[color:var(--muted)] transition-colors hover:bg-[color:var(--surface2)] hover:text-[color:var(--fg)]";

export function AskWidget({ name }: { name?: string | null; photo?: string | null }) {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState<number | null>(null);
  const [mac, setMac] = useState(false);
  const end = useRef<HTMLDivElement>(null);
  const field = useRef<HTMLInputElement>(null);
  const panel = useRef<HTMLElement>(null);
  const opener = useRef<HTMLButtonElement>(null);

  const scrollEnd = useCallback(() => { end.current?.scrollIntoView({ block: "end" }); }, []);
  const close = useCallback(() => { setOpen(false); opener.current?.focus(); }, []);

  useEffect(() => { setMac(/Mac/i.test(navigator.userAgent)); }, []);

  // Ctrl/⌘ + K toggles the assistant
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setOpen((o) => !o); }
    };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, []);

  // keep the conversation for this visit
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(KEY);
      const arr = raw ? JSON.parse(raw) : [];
      if (Array.isArray(arr))
        setMsgs(arr.filter((m) => (m?.role === "user" || m?.role === "model") && typeof m.text === "string")
          .slice(-20).map((m) => ({ role: m.role, text: String(m.text).slice(0, 1500) })));
    } catch {}
  }, []);
  useEffect(() => {
    try { sessionStorage.setItem(KEY, JSON.stringify(msgs.map(({ role, text }) => ({ role, text })))); } catch {}
  }, [msgs]);

  useEffect(() => { scrollEnd(); }, [msgs, busy, open, scrollEnd]);

  // while open: Escape, initial focus, phone keyboard handling and scroll lock
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => field.current?.focus(), 80);
    const key = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
    window.addEventListener("keydown", key);

    const vv = window.visualViewport;
    const apply = () => {
      const el = panel.current;
      if (!el || !vv) return;
      el.style.setProperty("--ph", `${vv.height}px`);
      el.style.setProperty("--kb", `${Math.max(0, window.innerHeight - vv.height - vv.offsetTop)}px`);
    };
    apply();
    vv?.addEventListener("resize", apply);
    vv?.addEventListener("scroll", apply);

    const small = window.matchMedia("(max-width: 639px)").matches;
    const prev = document.body.style.overflow;
    if (small) document.body.style.overflow = "hidden";

    return () => {
      clearTimeout(t);
      window.removeEventListener("keydown", key);
      vv?.removeEventListener("resize", apply);
      vv?.removeEventListener("scroll", apply);
      document.body.style.overflow = prev;
    };
  }, [open, close]);

  // keep Tab inside the dialog
  function trap(e: React.KeyboardEvent) {
    if (e.key !== "Tab") return;
    const els = Array.from(panel.current?.querySelectorAll<HTMLElement>('button:not([disabled]), a[href], input:not([disabled])') ?? []);
    if (!els.length) return;
    const first = els[0], last = els[els.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }

  async function send(text: string) {
    const q = text.trim();
    if (q.length < 2 || busy) return;
    const history = msgs.slice(-6).map(({ role, text }) => ({ role, text }));
    setMsgs((m) => [...m, { role: "user", text: q }]);
    setInput(""); setError(""); setBusy(true);
    const r = await askAbout(history, q);
    setBusy(false);
    if (r.ok) setMsgs((m) => [...m, { role: "model", text: r.answer, fresh: true }]);
    else { setMsgs((m) => m.slice(0, -1)); setInput(q); setError(r.error); }
  }

  const reset = () => { setMsgs([]); setError(""); setInput(""); field.current?.focus(); };
  const copy = async (text: string, i: number) => {
    try { await navigator.clipboard.writeText(text); setCopied(i); setTimeout(() => setCopied(null), 1500); } catch {}
  };

  const asked = new Set(msgs.filter((m) => m.role === "user").map((m) => m.text));
  const more = SUGGEST.filter((s) => !asked.has(s));
  const lastIdx = msgs.length - 1;

  return (
    <>
      <button
        ref={opener} type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-haspopup="dialog"
        data-track="social" data-label="Ask AI"
        className="flex h-10 items-center gap-2 rounded-full border border-[color:var(--line)] bg-[color:var(--surface)] pl-3.5 pr-3 text-[0.8125rem] font-medium text-[color:var(--fg)] shadow-lg transition-colors hover:border-[color:var(--accent-ink)]"
      >
        <Sparkles className="h-4 w-4 text-[color:var(--accent-ink)]" />
        Ask AI
        <kbd className="ml-0.5 hidden rounded border border-[color:var(--line)] px-1.5 py-0.5 font-sans text-[10px] font-medium text-[color:var(--muted)] sm:inline">{mac ? "⌘K" : "Ctrl K"}</kbd>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-[59] bg-black/50 sm:bg-transparent" onClick={close} aria-hidden />
          <section
            ref={panel} role="dialog" aria-modal="true" aria-labelledby="ask-title" onKeyDown={trap}
            className="ask-pop fixed inset-x-0 bottom-[var(--kb,0px)] z-[60] flex max-h-[calc(var(--ph,100dvh)*0.88)] flex-col overflow-hidden rounded-t-2xl border border-[color:var(--line)] bg-[color:var(--surface)] text-[color:var(--fg)] shadow-2xl sm:inset-x-auto sm:bottom-[calc(max(1rem,env(safe-area-inset-bottom))+6.75rem)] sm:right-4 sm:max-h-[min(34rem,calc(100dvh-9rem))] sm:w-[22rem] sm:rounded-xl print:hidden"
          >
            <div className="mx-auto mt-2 h-1 w-9 shrink-0 rounded-full bg-[color:var(--line2)] sm:hidden" aria-hidden />

            <header className="flex shrink-0 items-center gap-3 border-b border-[color:var(--line)] px-4 py-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-[color:var(--line)] bg-[color:var(--surface2)]">
                <Sparkles className="h-4 w-4 text-[color:var(--accent-ink)]" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <h2 id="ask-title" className="text-sm font-semibold leading-none">Assistant</h2>
                  <span className="rounded border border-[color:var(--line)] px-1 py-px text-[9px] font-semibold uppercase tracking-wider text-[color:var(--muted)]">AI</span>
                </div>
                <p className="mt-1 truncate text-xs text-[color:var(--muted)]">Ask about {name || "this portfolio"}</p>
              </div>
              {msgs.length > 0 && (
                <button type="button" onClick={reset} aria-label="Start a new chat" title="New chat" className={iconBtn}><Plus className="h-4 w-4" /></button>
              )}
              <button type="button" onClick={close} aria-label="Close" title="Close (Esc)" className={iconBtn}><X className="h-4 w-4" /></button>
            </header>

            <div className="flex shrink-0 items-center gap-1.5 border-b border-[color:var(--line)] bg-[color:var(--surface2)]/50 px-4 py-1.5 text-[11px] text-[color:var(--muted)]">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden />
              Answers are based on this portfolio’s content
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4" aria-live="polite">
              {msgs.length === 0 && (
                <div>
                  <p className="text-[0.9375rem] font-semibold">How can I help?</p>
                  <p className="mt-1 text-xs text-[color:var(--muted)]">Choose a question or type your own.</p>
                  <ul className="mt-3 divide-y divide-[color:var(--line)] overflow-hidden rounded-lg border border-[color:var(--line)]">
                    {SUGGEST.map((s) => (
                      <li key={s}>
                        <button type="button" onClick={() => send(s)}
                          className="group flex min-h-11 w-full items-center justify-between gap-3 px-3 py-2 text-left text-[0.8125rem] transition-colors hover:bg-[color:var(--surface2)]">
                          {s}
                          <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-[color:var(--faint)] transition-colors group-hover:text-[color:var(--accent-ink)]" />
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex flex-col gap-4">
                {msgs.map((m, i) =>
                  m.role === "user" ? (
                    <div key={i} className="max-w-[88%] self-end whitespace-pre-wrap break-words rounded-lg bg-[color:var(--fg)] px-3 py-2 text-[0.8125rem] leading-relaxed text-[color:var(--bg)]">{m.text}</div>
                  ) : (
                    <div key={i} className="flex flex-col gap-1">
                      <div className="flex items-center gap-1.5 text-[11px] font-medium text-[color:var(--muted)]">
                        <Sparkles className="h-3 w-3 text-[color:var(--accent-ink)]" />Assistant
                      </div>
                      <div className="break-words text-[0.8125rem] leading-relaxed">
                        <Typed text={m.text} animate={Boolean(m.fresh) && i === lastIdx} onTick={scrollEnd} />
                      </div>
                      <button type="button" onClick={() => copy(m.text, i)}
                        className="inline-flex min-h-8 w-fit items-center gap-1 rounded-md pr-2 text-[11px] text-[color:var(--faint)] hover:text-[color:var(--fg)]">
                        {copied === i ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                        {copied === i ? "Copied" : "Copy"}
                      </button>
                    </div>
                  )
                )}
                {busy && (
                  <div className="flex flex-col gap-1" role="status" aria-label="The assistant is typing">
                    <div className="flex items-center gap-1.5 text-[11px] font-medium text-[color:var(--muted)]">
                      <Sparkles className="h-3 w-3 text-[color:var(--accent-ink)]" />Assistant
                    </div>
                    <div className="ask-dots text-[color:var(--muted)]"><i /><i /><i /></div>
                  </div>
                )}
                {error && (
                  <p role="alert" className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-400">{error}</p>
                )}
                <div ref={end} />
              </div>
            </div>

            <div className="shrink-0 border-t border-[color:var(--line)]">
              {msgs.length > 0 && more.length > 0 && !busy && (
                <div className="flex gap-1.5 overflow-x-auto px-3 pt-3">
                  {more.map((s) => (
                    <button key={s} type="button" onClick={() => send(s)}
                      className="min-h-8 shrink-0 whitespace-nowrap rounded-md border border-[color:var(--line)] px-2.5 text-[11px] text-[color:var(--muted)] transition-colors hover:border-[color:var(--accent-ink)] hover:text-[color:var(--fg)]">{s}</button>
                  ))}
                </div>
              )}
              <form className="flex items-center gap-2 p-3" onSubmit={(e) => { e.preventDefault(); send(input); }}>
                <div className="relative min-w-0 flex-1">
                  <input
                    ref={field} value={input} onChange={(e) => setInput(e.target.value)} maxLength={300}
                    placeholder="Ask a question…" aria-label="Your question" enterKeyHint="send" autoComplete="off"
                    className="h-10 w-full rounded-md border border-[color:var(--line)] bg-[color:var(--bg)] px-3 pr-10 text-base outline-none placeholder:text-[color:var(--faint)] focus:border-[color:var(--accent-ink)] sm:text-[0.8125rem]"
                  />
                  {input.length >= 240 && (
                    <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[11px] text-[color:var(--faint)]">{300 - input.length}</span>
                  )}
                </div>
                <button disabled={busy || input.trim().length < 2} aria-label="Send question"
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-[color:var(--fg)] text-[color:var(--bg)] transition-opacity disabled:opacity-30">
                  <Send className="h-4 w-4" />
                </button>
              </form>
              <p className="px-4 pb-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] text-[10.5px] leading-snug text-[color:var(--faint)]">
                AI can make mistakes. Questions go to Google Gemini and aren’t stored on this site. Don’t share private details. <a href="/privacy" className="underline">Privacy</a>
                <span className="hidden sm:inline"> · Enter to send · Esc to close</span>
              </p>
            </div>
          </section>
        </>
      )}
    </>
  );
}
