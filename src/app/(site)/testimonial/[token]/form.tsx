"use client";
import { useActionState } from "react";
import { submitTestimonial, type SubmitState } from "../actions";

const input = "w-full rounded-xl border border-[color:var(--line)] bg-[color:var(--bg)] px-4 py-3 text-[color:var(--fg)] outline-none placeholder:text-[color:var(--faint)] focus:border-[color:var(--accent-ink)]";

export function TestimonialForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState<SubmitState, FormData>(submitTestimonial.bind(null, token), null);
  if (state?.ok)
    return (
      <div role="status" className="rounded-2xl border border-[color:var(--line)] bg-[color:var(--surface)] p-8 text-center">
        <p className="text-xl font-semibold">{state.message}</p>
        <p className="mt-2 text-[color:var(--muted)]">You can close this page.</p>
      </div>
    );
  return (
    <form action={action} className="flex flex-col gap-3">
      <input name="website" tabIndex={-1} autoComplete="off" aria-hidden className="absolute left-[-9999px] h-0 w-0 opacity-0" />
      <input name="name" placeholder="Your name" aria-label="Your name" required maxLength={100} className={input} />
      <div className="grid gap-3 sm:grid-cols-2">
        <input name="title" placeholder="Job title (optional)" aria-label="Job title" maxLength={100} className={input} />
        <input name="company" placeholder="Company (optional)" aria-label="Company" maxLength={100} className={input} />
      </div>
      <textarea name="quote" placeholder="Your testimonial…" aria-label="Your testimonial" required minLength={20} maxLength={800} rows={6} className={input} />
      <label className="flex flex-col gap-1 text-sm text-[color:var(--muted)]">
        Photo (optional, PNG, JPG or WebP, up to 2 MB)
        <input type="file" name="photo" accept="image/png,image/jpeg,image/webp" className="text-[color:var(--fg)] file:mr-3 file:rounded-lg file:border-0 file:bg-[color:var(--surface2)] file:px-3 file:py-2 file:text-[color:var(--fg)]" />
      </label>
      <label className="flex items-start gap-2 text-sm text-[color:var(--muted)]">
        <input type="checkbox" name="consent" required className="mt-1 h-4 w-4" />
        I’m happy for this to be shown publicly on the portfolio, with my name and the details above.
      </label>
      <button disabled={pending} className="min-h-12 rounded-xl bg-[var(--accent)] px-6 py-3 font-semibold text-[color:var(--on-accent)] disabled:opacity-60">
        {pending ? "Sending…" : "Submit testimonial"}
      </button>
      {state && !state.ok && <p role="alert" className="text-sm text-red-400">{state.message}</p>}
    </form>
  );
}
