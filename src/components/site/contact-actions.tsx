"use client";
import { useState } from "react";
import { Check, Copy, Download } from "lucide-react";

const btn = "inline-flex min-h-11 items-center gap-2 rounded-md border border-[color:var(--line)] px-4 text-sm transition-colors hover:border-[color:var(--accent-ink)] hover:text-[color:var(--accent-ink)]";

export function ContactActions({ email, canSave }: { email?: string | null; canSave: boolean }) {
  const [done, setDone] = useState(false);

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

  return (
    <div className="flex flex-wrap gap-2">
      {email && (
        <button type="button" onClick={copy} data-track="social" data-label="Copy email" className={btn}>
          {done ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          <span aria-live="polite">{done ? "Copied!" : "Copy email"}</span>
        </button>
      )}
      {canSave && (
        <a href="/contact.vcf" download data-track="social" data-label="vCard" className={btn}>
          <Download className="h-4 w-4" />Save contact
        </a>
      )}
    </div>
  );
}
