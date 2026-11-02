"use client";

import { useState } from "react";
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

const link = "underline decoration-white/20 underline-offset-4 transition-colors hover:text-[var(--accent)] hover:decoration-[var(--accent)]";
const cmd = "inline-flex min-h-9 items-center rounded border border-white/15 px-2.5 text-[0.8125rem] text-[#d6dae1] transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]";

function Prompt({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-4 first:mt-0">
      <span className="select-none text-[var(--accent)]">❯ </span>
      <span className="text-white">{children}</span>
    </p>
  );
}

export function WindowBar({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-2 border-b border-white/10 bg-white/[0.04] px-4 py-2.5" aria-hidden>
      <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
      <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
      <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
      <span className="ml-3 truncate font-[family-name:var(--font-mono)] text-xs text-[#8b93a1]">{title}</span>
    </div>
  );
}

export function ContactTerminal({ name, email, phone, location, socials, canSave }: Props) {
  const [done, setDone] = useState(false);
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

  return (
    <div className="overflow-hidden rounded-xl border border-white/10 bg-[#0B0D10] text-[#d6dae1] shadow-xl shadow-black/20">
      <WindowBar title={`${user}@portfolio: ~/contact`} />
      <div className="px-4 py-5 font-[family-name:var(--font-mono)] text-[0.8125rem] leading-relaxed sm:px-5">
        <Prompt>cat contact.txt</Prompt>
        {rows.length > 0 && (
          <dl className="mt-2 flex flex-col gap-1">
            {rows.map(([k, v, h]) => (
              <div key={k} className="grid grid-cols-[5.25rem_minmax(0,1fr)] gap-2">
                <dt className="text-[#8b93a1]">{k}:</dt>
                <dd className="min-w-0 break-words">{h ? <a href={h} className={link}>{v}</a> : v}</dd>
              </div>
            ))}
          </dl>
        )}

        {socials.length > 0 && (
          <>
            <Prompt>ls socials/</Prompt>
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
                      {label.toLowerCase().replace(/\s+/g, "-")}
                    </a>
                  </li>
                );
              })}
            </ul>
          </>
        )}

        {(email || canSave) && (
          <>
            <Prompt>./actions</Prompt>
            <div className="mt-2 flex flex-wrap gap-2">
              {email && (
                <button type="button" onClick={copy} data-track="social" data-label="Copy email" className={cmd}>
                  <span aria-live="polite">{done ? "✓ copied" : "copy-email"}</span>
                </button>
              )}
              {canSave && (
                <a href="/contact.vcf" download data-track="social" data-label="vCard" className={cmd}>save-contact.vcf</a>
              )}
            </div>
          </>
        )}

        <p className="mt-4">
          <span className="select-none text-[var(--accent)]">❯ </span>
          <span aria-hidden className="term-cursor ml-0.5 inline-block h-[1.05em] w-2 translate-y-[0.2em] bg-[var(--accent)]" />
        </p>
      </div>
    </div>
  );
}
