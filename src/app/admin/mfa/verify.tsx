"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { logout } from "../actions";

const EMPTY = Array(6).fill("") as string[];

export function MfaVerify() {
  const router = useRouter();
  const [digits, setDigits] = useState<string[]>(EMPTY);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => { refs.current[0]?.focus(); }, []);

  async function verify(code: string) {
    setBusy(true);
    setError("");
    const sb = createClient();
    const { data } = await sb.auth.mfa.listFactors();
    const factor = data?.totp?.[0];
    if (!factor) {
      setBusy(false);
      return setError("No authenticator is set up for this account.");
    }
    const { error: err } = await sb.auth.mfa.challengeAndVerify({ factorId: factor.id, code });
    if (err) {
      setBusy(false);
      setDigits(EMPTY);
      setError("That code didn’t work. Check your app and try again.");
      setTimeout(() => refs.current[0]?.focus(), 0);
      return;
    }
    router.replace("/admin");
    router.refresh();
  }

  function fill(start: number, text: string) {
    const clean = text.replace(/\D/g, "");
    if (!clean) return;
    const next = [...digits];
    for (let i = 0; i < clean.length && start + i < 6; i++) next[start + i] = clean[i];
    setDigits(next);
    setError("");
    const last = Math.min(start + clean.length, 5);
    refs.current[last]?.focus();
    if (next.every(Boolean)) verify(next.join(""));
  }

  function onKey(i: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace") {
      if (digits[i]) { const n = [...digits]; n[i] = ""; setDigits(n); }
      else if (i > 0) { const n = [...digits]; n[i - 1] = ""; setDigits(n); refs.current[i - 1]?.focus(); }
      e.preventDefault();
    } else if (e.key === "ArrowLeft" && i > 0) refs.current[i - 1]?.focus();
    else if (e.key === "ArrowRight" && i < 5) refs.current[i + 1]?.focus();
  }

  const code = digits.join("");
  return (
    <div className="flex flex-col gap-5">
      <form
        onSubmit={(e) => { e.preventDefault(); if (code.length === 6) verify(code); }}
        className="flex flex-col gap-5"
      >
        <fieldset className="flex flex-col gap-2" disabled={busy}>
          <legend className="mb-2 text-sm font-medium">6-digit code</legend>
          <div className="flex justify-between gap-2" onPaste={(e) => { e.preventDefault(); fill(0, e.clipboardData.getData("text")); }}>
            {digits.map((d, i) => (
              <input
                key={i}
                ref={(el) => { refs.current[i] = el; }}
                value={d}
                inputMode="numeric"
                autoComplete={i === 0 ? "one-time-code" : "off"}
                maxLength={6}
                aria-label={`Digit ${i + 1}`}
                onChange={(e) => fill(i, e.target.value)}
                onKeyDown={(e) => onKey(i, e)}
                onFocus={(e) => e.target.select()}
                className={`h-14 w-full min-w-0 rounded-lg border bg-white text-center text-xl font-semibold outline-none transition focus:ring-4 disabled:opacity-60 ${
                  error ? "border-red-400 focus:border-red-500 focus:ring-red-500/10" : "border-neutral-300 focus:border-neutral-900 focus:ring-neutral-900/10"
                }`}
              />
            ))}
          </div>
        </fieldset>
        {error && (
          <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">{error}</p>
        )}
        <button
          type="submit" disabled={busy || code.length !== 6}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-neutral-900 font-medium text-white transition hover:bg-neutral-800 disabled:opacity-50"
        >
          {busy && <Loader2 className="h-4 w-4 animate-spin" />}
          {busy ? "Verifying…" : "Verify and continue"}
        </button>
      </form>
      <p className="text-center text-xs text-neutral-500">
        Open your authenticator app and enter the current code. Codes refresh every 30 seconds.
      </p>
      <form action={logout}>
        <button type="submit" className="mx-auto block min-h-11 text-sm text-neutral-500 underline-offset-4 hover:text-neutral-900 hover:underline">
          Use a different account
        </button>
      </form>
    </div>
  );
}
