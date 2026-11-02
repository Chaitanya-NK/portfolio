"use client";

import { useEffect, useRef, useState } from "react";
import { SocialIcon } from "./social-icon";

type Social = { platform?: string; label?: string; url: string };
type Props = {
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  location?: string | null;
  socials: Social[];
  canSave: boolean;
};

const link = "underline decoration-[color:var(--line2)] underline-offset-4 transition-colors hover:text-[color:var(--accent-ink)] hover:decoration-[color:var(--accent-ink)]";
const cmd = "inline-flex min-h-9 items-center rounded border border-[color:var(--line2)] px-2.5 text-[0.8125rem] text-[color:var(--fg2)] transition-colors hover:border-[color:var(--accent-ink)] hover:text-[color:var(--accent-ink)]";
const Caret = ({ blink = true }: { blink?: boolean }) => (
  <span aria-hidden className={`${blink ? "term-cursor " : ""}ml-0.5 inline-block h-[1.05em] w-2 translate-y-[0.2em] bg-[var(--accent)]`} />
);

export function WindowBar({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-2 border-b border-[color:var(--line)] bg-[color:var(--surface2)] px-4 py-2.5" aria-hidden>
      <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
      <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
      <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
      <span className="ml-3 truncate font-[family-name:var(--font-mono)] text-xs text-[color:var(--muted)]">{title}</span>
    </div>
  );
}

export function ContactTerminal({ name, email, phone, location, socials, canSave }: Props) {
  const [done, setDone] = useState(false);
  // "static": everything visible (SSR, no JS, reduced motion). "idle": hidden, waiting to scroll into view. "run": typing.
  const [mode, setMode] = useState<"static" | "idle" | "run">("static");
  const [shown, setShown] = useState(0);
  const [typed, setTyped] = useState(0);
  const box = useRef<HTMLDivElement>(null);
  const user = (name ?? "guest").trim().split(/\s+/)[0].toLowerCase().replace(/[^a-z0-9]/g, "") || "guest";

  async function copy() {
    if (!email) return;
    try { await navigator.clipboard.writeText(email); }
    catch {
      const t = document.createElement("textarea");
      t.value = email; document.body.appendChild(t); t.select(); document.execCommand("copy"); t.remove();
    }
    setDone(true);
    setTimeout(() => setDone(false), 2000);
  }

  const rows: [string, string, string | null][] = [];
  if (email) rows.push(["email", email, `mailto:${email}`]);
  if (phone) rows.push(["phone", phone, `tel:${String(phone).replace(/[^\d+]/g, "")}`]);
  if (location) rows.push(["location", location, null]);

  const blocks: { cmd: string; out: React.ReactNode }[] = [];
  if (rows.length) {
    blocks.push({
      cmd: "cat contact.txt",
      out: (
        <dl className="mt-2 flex flex-col gap-1">
          {rows.map(([k, v, h]) => (
            <div key={k} className="grid grid-cols-[5.25rem_minmax(0,1fr)] gap-2">
              <dt className="text-[color:var(--muted)]">{k}:</dt>
              <dd className="min-w-0 break-words">{h ? <a href={h} className={link}>{v}</a> : v}</dd>
            </div>
          ))}
        </dl>
      ),
    });
  }
  if (socials.length) {
    blocks.push({
      cmd: "ls socials/",
      out: (
        <ul className="mt-2 flex flex-wrap gap-x-5 gap-y-2">
          {socials.map((x, i) => {
            const label = x.platform ?? x.label ?? "link";
            return (
              <li key={i}>
                <a
                  href={x.url} data-track="social" data-label={label}
                  {...(/^https?:/i.test(x.url) ? { target: "_blank", rel: "noreferrer noopener" } : {})}
                  className={`inline-flex min-h-9 items-center gap-2 ${link}`}
                >
                  <SocialIcon platform={label} url={x.url} className="h-3.5 w-3.5" />
                  {label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}
                </a>
              </li>
            );
          })}
        </ul>
      ),
    });
  }
  if (email || canSave) {
    blocks.push({
      cmd: "./actions",
      out: (
        <div className="mt-2 flex flex-wrap gap-2">
          {email && (
            <button type="button" onClick={copy} data-track="social" data-label="Copy email" className={cmd}>
              <span aria-live="polite">{done ? "✓ copied" : "copy-email"}</span>
            </button>
          )}
          {canSave && <a href="/contact.vcf" download data-track="social" data-label="vCard" className={cmd}>save-contact.vcf</a>}
        </div>
      ),
    });
  }

  // Start hidden only when the browser can animate and the visitor hasn't asked for less motion.
  useEffect(() => {
    if (typeof IntersectionObserver === "undefined" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const el = box.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setMode("run"); io.disconnect(); } else setMode("idle");
    }, { threshold: 0.35 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (mode !== "run" || shown >= blocks.length) return;
    const len = blocks[shown].cmd.length;
    const t = setTimeout(
      () => { if (typed < len) setTyped(typed + 1); else { setShown(shown + 1); setTyped(0); } },
      typed < len ? (typed === 0 ? 350 : 38) : 320,
    );
    return () => clearTimeout(t);
  }, [mode, shown, typed, blocks.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const all = mode === "static";
  const upto = all ? blocks.length : mode === "idle" ? -1 : shown;

  return (
    <div ref={box} className="flex flex-col overflow-hidden rounded-xl border border-[color:var(--line)] bg-[color:var(--surface)] text-[color:var(--fg2)] shadow-sm">
      <WindowBar title={`${user}@portfolio: ~/contact`} />
      <div className="flex-1 px-4 py-5 font-[family-name:var(--font-mono)] text-[0.8125rem] leading-relaxed sm:px-5">
        {blocks.map((b, i) => {
          const complete = i < upto;
          const active = !all && mode === "run" && i === shown;
          const visibleChars = complete ? b.cmd.length : active ? typed : 0;
          return (
            <div key={b.cmd} className="mt-4 first:mt-0">
              <p>
                <span className={`select-none text-[color:var(--accent-ink)] ${complete || active ? "" : "invisible"}`}>❯ </span>
                <span className="text-[color:var(--fg)]">{b.cmd.slice(0, visibleChars)}</span>
                {active && <Caret blink={typed >= b.cmd.length} />}
                <span className="invisible">{b.cmd.slice(visibleChars)}</span>
              </p>
              <div className={complete ? "" : "invisible"}>{b.out}</div>
            </div>
          );
        })}
        <p className={`mt-4 ${all || shown >= blocks.length ? "" : "invisible"}`}>
          <span className="select-none text-[color:var(--accent-ink)]">❯ </span>
          <Caret />
        </p>
      </div>
    </div>
  );
}
