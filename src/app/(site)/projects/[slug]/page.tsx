import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProject, getSiteData } from "@/lib/site/data";
import { normalizeGallery } from "@/lib/case-study";
import { Gallery } from "@/components/site/gallery";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const p = await getProject(slug);
  if (!p) return { title: "Project not found" };
  const img = p.cover_url || normalizeGallery(p.gallery)[0]?.url;
  return {
    title: p.title,
    description: p.summary || String(p.problem ?? "").slice(0, 160) || undefined,
    openGraph: { title: p.title, images: img ? [img] : undefined },
  };
}

function Prose({ text }: { text: string }) {
  const blocks = text.split(/\n{2,}/).map((b) => b.trim()).filter(Boolean);
  return (
    <div className="flex flex-col gap-4 leading-relaxed text-[color:var(--fg2)]">
      {blocks.map((b, i) => {
        const lines = b.split("\n");
        if (lines.every((l) => l.trim().startsWith("- ")))
          return <ul key={i} className="flex list-disc flex-col gap-1.5 pl-5">{lines.map((l, j) => <li key={j}>{l.trim().slice(2)}</li>)}</ul>;
        return <p key={i} className="whitespace-pre-line">{b}</p>;
      })}
    </div>
  );
}

function Block({ n, title, text }: { n: string; title: string; text?: string | null }) {
  if (!text?.trim()) return null;
  return (
    <section className="grid gap-3 border-t border-[color:var(--line)] py-8 md:grid-cols-[11rem_minmax(0,1fr)] md:gap-8">
      <div>
        <div className="font-[family-name:var(--font-mono)] text-xs uppercase tracking-widest text-[color:var(--accent-ink)]">{n}</div>
        <h2 className="mt-1 font-[family-name:var(--font-display)] text-2xl font-bold">{title}</h2>
      </div>
      <Prose text={text} />
    </section>
  );
}

async function Article({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [p, site] = await Promise.all([getProject(slug), getSiteData()]);
  if (!p) notFound();
  const D = "font-[family-name:var(--font-display)]";
  const gallery = normalizeGallery(p.gallery);
  const list = site.projects;
  const idx = list.findIndex((x) => x.id === p.id);
  const prev = idx > 0 ? list[idx - 1] : null;
  const next = idx >= 0 && idx < list.length - 1 ? list[idx + 1] : null;
  const hasContact = site.sections.some((s) => s.type === "contact");
  const contactHref = hasContact ? "/#contact" : site.profile.email ? `mailto:${site.profile.email}` : "/";
  const pill = "inline-flex min-h-11 items-center rounded-md px-5 text-sm font-semibold";
  let n = 0;
  const num = () => String(++n).padStart(2, "0");

  return (
    <article className="mx-auto w-[min(92%,54rem)] py-10 sm:py-16">
      <Link href="/#projects" className="inline-flex min-h-11 items-center text-sm text-[color:var(--muted)] hover:text-[color:var(--fg)]">← All projects</Link>
      <p className="mt-4 font-[family-name:var(--font-mono)] text-xs uppercase tracking-widest text-[color:var(--accent-ink)]">
        {[p.role, p.year].filter(Boolean).join(" · ")}
      </p>
      <h1 className={`${D} mt-2 text-2xl font-bold leading-tight tracking-tight sm:text-3xl`}>{p.title}</h1>
      {p.summary && <p className="mt-4 text-lg text-[color:var(--muted)]">{p.summary}</p>}

      <div className="mt-6 flex flex-wrap gap-3">
        {p.live_url && <a href={p.live_url} target="_blank" rel="noreferrer" data-track="project_live" data-label={p.title} className={`${pill} bg-[var(--accent)] text-[color:var(--on-accent)]`}>Live site ↗</a>}
        {p.repo_url && <a href={p.repo_url} target="_blank" rel="noreferrer" data-track="project_repo" data-label={p.title} className={`${pill} border border-[color:var(--line)]`}>Source code ↗</a>}
      </div>

      {p.cover_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={p.cover_url} alt={p.title} className="mt-8 w-full rounded-lg border border-[color:var(--line)] object-cover" />
      )}

      {p.metrics?.length > 0 && (
        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {p.metrics.map((m: Record<string, string>, i: number) => (
            <div key={i} className="rounded-lg border border-[color:var(--line)] bg-[color:var(--surface)] p-5">
              <strong className={`${D} text-3xl text-[color:var(--accent-ink)]`}>{m.value}</strong>
              <div className="mt-1 text-sm text-[color:var(--muted)]">{m.label}</div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-10">
        <Block n={num()} title="Overview" text={p.description} />
        <Block n={num()} title="The problem" text={p.problem} />
        <Block n={num()} title="The approach" text={p.approach} />
        <Block n={num()} title="The result" text={p.result} />
        {gallery.length > 0 && (
          <section className="border-t border-[color:var(--line)] py-8">
            <div className="mb-5">
              <div className="font-[family-name:var(--font-mono)] text-xs uppercase tracking-widest text-[color:var(--accent-ink)]">{num()}</div>
              <h2 className={`${D} mt-1 text-2xl font-bold`}>Screenshots</h2>
            </div>
            <Gallery items={gallery} />
          </section>
        )}
      </div>

      {p.tags?.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2 border-t border-[color:var(--line)] pt-6">
          {p.tags.map((t: string) => <span key={t} className="rounded-md border border-[color:var(--line)] px-3 py-1.5 text-sm text-[color:var(--muted)]">{t}</span>)}
        </div>
      )}

      {(prev || next) && (
        <nav aria-label="More projects" className="mt-10 grid gap-3 sm:grid-cols-2">
          {prev ? (
            <Link href={`/projects/${prev.slug}`} className="rounded-lg border border-[color:var(--line)] p-4 hover:border-[color:var(--accent-ink)]">
              <div className="text-xs text-[color:var(--muted)]">← Previous</div>
              <div className={`${D} mt-1 font-bold`}>{prev.title}</div>
            </Link>
          ) : <span />}
          {next && (
            <Link href={`/projects/${next.slug}`} className="rounded-lg border border-[color:var(--line)] p-4 text-right hover:border-[color:var(--accent-ink)]">
              <div className="text-xs text-[color:var(--muted)]">Next →</div>
              <div className={`${D} mt-1 font-bold`}>{next.title}</div>
            </Link>
          )}
        </nav>
      )}

      <div className="mt-10 flex flex-col items-start gap-3 rounded-lg border border-[color:var(--line)] bg-[color:var(--surface)] p-6 sm:flex-row sm:items-center sm:justify-between">
        <p className={`${D} text-xl font-bold`}>Have a similar problem?</p>
        <a href={contactHref} className={`${pill} bg-[var(--accent)] text-[color:var(--on-accent)]`}>Get in touch</a>
      </div>
    </article>
  );
}

export default function Page({ params }: { params: Promise<{ slug: string }> }) {
  return <Suspense fallback={<p className="p-10 text-[color:var(--muted)]">Loading…</p>}><Article params={params} /></Suspense>;
}
