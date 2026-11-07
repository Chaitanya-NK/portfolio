type Item = { id: string; name: string; icon_url?: string | null };

/** Decorative: the skills and tools from the admin panel drift down the whole page, lightly faded. */
export function FallingStack({ items }: { items: Item[] }) {
  const seen = new Set<string>();
  const pool = items
    .filter((x) => x.name && !seen.has(x.name.toLowerCase()) && seen.add(x.name.toLowerCase()))
    .sort((a, b) => Number(Boolean(b.icon_url)) - Number(Boolean(a.icon_url)))
    .slice(0, 22);
  if (pool.length < 3) return null;
  const n = pool.length;

  return (
    <div aria-hidden className="fall-layer pointer-events-none fixed inset-0 z-0 overflow-hidden print:hidden">
      {pool.map((x, i) => {
        // deterministic spread (same on server and client)
        const left = ((i * 100) / n + ((i * 37) % 7)) % 96;
        const dur = 24 + ((i * 13) % 17);
        const delay = -((i * 7919) % (dur * 100)) / 100;
        const size = 34 + ((i * 11) % 3) * 6;
        return (
          <span
            key={x.id}
            className={`fall-item ${i >= 9 ? "max-md:hidden" : ""}`}
            style={{ left: `${left}%`, width: size, height: size, animationDuration: `${dur}s`, animationDelay: `${delay}s` }}
          >
            {x.icon_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={x.icon_url} alt="" className="h-full w-full object-contain p-1.5" />
            ) : (
              <span className="text-xs font-semibold text-neutral-500">{x.name.slice(0, 1)}</span>
            )}
          </span>
        );
      })}
    </div>
  );
}
