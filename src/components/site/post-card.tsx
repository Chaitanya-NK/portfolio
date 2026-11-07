import { format } from "date-fns";
import { ArrowUpRight } from "lucide-react";
import type { Row } from "@/lib/site/data";

const M = "font-[family-name:var(--font-mono)]";

/** Cover image, or a themed placeholder (accent glow, grid, first tag) when a post has none. */
function Cover({ p, tall }: { p: Row; tall?: boolean }) {
  const box = `relative w-full overflow-hidden border-b border-[color:var(--line)] ${tall ? "aspect-[16/10] md:aspect-auto md:h-full md:min-h-64 md:border-b-0 md:border-r" : "aspect-[16/9]"}`;
  if (p.cover_url) {
    return (
      <div className={box}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={p.cover_url} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]" />
      </div>
    );
  }
  return (
    <div className={`${box} bg-[color:var(--surface2)]`} aria-hidden>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,color-mix(in_srgb,var(--accent)_28%,transparent),transparent_60%)]" />
      <div className="absolute inset-0 opacity-60 [background-image:linear-gradient(var(--line)_1px,transparent_1px),linear-gradient(90deg,var(--line)_1px,transparent_1px)] [background-size:28px_28px] [mask-image:linear-gradient(180deg,#000,transparent)]" />
      <span className={`${M} absolute bottom-3 left-4 text-xs uppercase tracking-[0.14em] text-[color:var(--accent-ink)]`}>
        {p.tags?.[0] ?? "blog"}
      </span>
    </div>
  );
}

export function PostCard({ p, featured = false }: { p: Row; featured?: boolean }) {
  const date = p.published_at ? format(new Date(p.published_at), "d MMM yyyy") : "";
  const tags: string[] = (p.tags ?? []).slice(0, 3);
  return (
    <article
      className={`group relative flex overflow-hidden rounded-lg border border-[color:var(--line)] bg-[color:var(--surface)] transition duration-200 hover:border-[color:var(--accent-ink)] motion-safe:hover:-translate-y-1 hover:shadow-lg hover:shadow-black/10 ${featured ? "flex-col md:col-span-full md:grid md:grid-cols-[1.05fr_1fr]" : "flex-col"}`}
    >
      <Cover p={p} tall={featured} />
      <div className={`flex flex-1 flex-col gap-3 p-5 ${featured ? "md:p-8" : ""}`}>
        <div className={`${M} flex flex-wrap items-center gap-x-2 text-[0.6875rem] uppercase tracking-[0.1em] text-[color:var(--faint)]`}>
          <span suppressHydrationWarning>{date}</span>
          {date && <span aria-hidden>·</span>}
          <span>{p.reading_minutes} min read</span>
        </div>
        <h3 className={`font-semibold tracking-tight ${featured ? "text-xl sm:text-2xl" : "text-[1.0625rem] leading-snug"}`}>
          <a href={`/blog/${p.slug}`} className="after:absolute after:inset-0">{p.title}</a>
        </h3>
        {p.excerpt && <p className={`text-sm text-[color:var(--muted)] ${featured ? "line-clamp-4" : "line-clamp-3"}`}>{p.excerpt}</p>}
        <div className="mt-auto flex items-center justify-between gap-3 pt-2">
          <div className="flex flex-wrap gap-1.5">
            {tags.map((t) => (
              <span key={t} className="inline-flex items-center rounded border border-[color:var(--line)] px-2 py-0.5 text-xs text-[color:var(--muted)]">{t}</span>
            ))}
          </div>
          <span className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-[color:var(--accent-ink)]">
            Read <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden />
          </span>
        </div>
      </div>
    </article>
  );
}
