"use client";
import Link from "next/link";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-[#0A0A0F] px-6 text-center text-[#F2F2F5]">
      <p className="font-mono text-sm uppercase tracking-widest text-[#C6F432]">Something went wrong</p>
      <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">Unexpected error</h1>
      <p className="max-w-md text-[#9A9AAE]">Please try again. If it keeps happening, come back in a few minutes.</p>
      <div className="flex flex-wrap justify-center gap-3">
        <button onClick={reset} className="inline-flex min-h-11 items-center rounded-full bg-[#C6F432] px-6 font-semibold text-[#0A0A0F]">Try again</button>
        <Link href="/" className="inline-flex min-h-11 items-center rounded-full border border-[#23232F] px-6">Back to home</Link>
      </div>
    </main>
  );
}
