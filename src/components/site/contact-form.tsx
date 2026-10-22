"use client";
import { useActionState } from "react";
import { sendMessage, type ContactState } from "@/app/(site)/actions";

const input = "w-full rounded-xl border border-[color:var(--line)] bg-[color:var(--bg)] px-4 py-3 text-[color:var(--fg)] outline-none placeholder:text-[color:var(--faint)] focus:border-[color:var(--accent-ink)]";

export function ContactForm() {
  const [state, action, pending] = useActionState<ContactState, FormData>(sendMessage, null);
  return (
    <form action={action} className="flex flex-col gap-3">
      <input name="website" tabIndex={-1} autoComplete="off" aria-hidden className="absolute left-[-9999px] h-0 w-0 opacity-0" />
      <input name="name" placeholder="Your name" aria-label="Your name" required maxLength={100} className={input} />
      <input name="email" type="email" placeholder="Your email" aria-label="Your email" required maxLength={200} className={input} />
      <textarea name="message" placeholder="How can I help?" aria-label="Message" required minLength={10} maxLength={4000} rows={5} className={input} />
      <button disabled={pending} className="min-h-12 rounded-xl bg-[var(--accent)] px-6 py-3 font-semibold text-[color:var(--on-accent)] disabled:opacity-60">
        {pending ? "Sending…" : "Send message"}
      </button>
      {state && <p role="status" className={`text-sm ${state.ok ? "text-[color:var(--accent-ink)]" : "text-red-400"}`}>{state.message}</p>}
    </form>
  );
}
