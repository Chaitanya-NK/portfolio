type Item = { id: string; name: string; icon_url?: string | null };

/** Decorative: names of your skills and tools (from the admin panel) drift down the whole page, very faint. */
export function FallingStack({ items }: { items: Item[] }) {
  const seen = new Set<string>();
  const pool = items
    .filter((x) => x.name && !seen.has(x.name.toLowerCase()) && seen.add(x.name.toLowerCase()))
    .slice(0, 30);
  if (pool.length < 3) return null;
  const n = pool.length;

  return (
    <div aria-hidden className="fall-layer pointer-events-none fixed inset-0 z-0 overflow-hidden select-none print:hidden">
      {pool.map((x, i) => {
        // deterministic spread (same on server and client)
        const left = ((i * 100) / n + ((i * 37) % 9)) % 94;
        const dur = 22 + ((i * 13) % 19);
        const delay = -((i * 7919) % (dur * 100)) / 100;
        const size = [0.7, 1.35, 0.9, 1.1, 0.8, 1.5][i % 6]; // rem, mixed sizes
        const o = [0.55, 1, 0.75, 0.9][i % 4]; // mixed strength
        return (
          <span
            key={x.id}
            className={`fall-item ${i >= 12 ? "max-md:hidden" : ""}`}
            style={{ left: `${left}%`, fontSize: `${size}rem`, ["--k" as string]: o, animationDuration: `${dur}s`, animationDelay: `${delay}s` }}
          >
            {x.name}
          </span>
        );
      })}
    </div>
  );
}
