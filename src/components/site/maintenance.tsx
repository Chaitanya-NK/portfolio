export function Maintenance({ message, name }: { message?: string | null; name?: string | null }) {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 px-6 text-center">
      <p className="font-[family-name:var(--font-mono)] text-sm uppercase tracking-widest text-[color:var(--accent-ink)]">{name ?? "Back soon"}</p>
      <h1 className="font-[family-name:var(--font-display)] text-4xl font-bold tracking-tight sm:text-6xl">We’ll be right back</h1>
      <p className="max-w-md text-[color:var(--muted)]">{message || "The site is being updated. Please check back in a little while."}</p>
    </main>
  );
}
