"use client";
import { useState } from "react";
import { useFormStatus } from "react-dom";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { login } from "../actions";

const field =
  "h-11 w-full rounded-lg border border-neutral-300 bg-white px-3.5 text-[0.95rem] outline-none transition placeholder:text-neutral-400 focus:border-neutral-900 focus:ring-4 focus:ring-neutral-900/10";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit" disabled={pending}
      className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-neutral-900 font-medium text-white transition hover:bg-neutral-800 disabled:opacity-70"
    >
      {pending && <Loader2 className="h-4 w-4 animate-spin" />}
      {pending ? "Signing in…" : "Sign in"}
    </button>
  );
}

export function LoginForm({ children }: { children?: React.ReactNode }) {
  const [show, setShow] = useState(false);
  return (
    <form action={login} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1.5 text-sm font-medium">
        Email
        <input name="email" type="email" required autoComplete="username" autoFocus placeholder="you@example.com" className={field} />
      </label>
      <label className="flex flex-col gap-1.5 text-sm font-medium">
        Password
        <span className="relative">
          <input
            name="password" type={show ? "text" : "password"} required autoComplete="current-password"
            placeholder="Your password" className={`${field} pr-11`}
          />
          <button
            type="button" onClick={() => setShow((s) => !s)}
            aria-label={show ? "Hide password" : "Show password"} aria-pressed={show}
            className="absolute right-0 top-0 flex h-11 w-11 items-center justify-center text-neutral-500 hover:text-neutral-900"
          >
            {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </span>
      </label>
      {children}
      <Submit />
    </form>
  );
}
