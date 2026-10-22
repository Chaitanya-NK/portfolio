import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProject, getSiteData } from "@/lib/site/data";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const p = await getProject(slug);
  if (!p) return { title: "Project not found" };
  return {
    title: p.title,
    description: p.summary || undefined,
    openGraph: { title: p.title, images: p.cover_url ? [p.cover_url] : undefined },
  };
}

async function Article({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [p, { profile }] = await Promise.all([getProject(slug), getSiteData()]);
  if (!p) notFound();
  const D = "font-[family-name:var(--font-display)]";
  return (
    <div style={{ ["--accent" as string]: profile.theme?.accent || "#C6F432" }}>
      <article className="mx-auto w-[min(92%,54rem)] py-10 sm:py-16">
        <Link href="/#projects" className="text-sm text-[color:var(--muted)] hover:text-[color:var(--fg)]">← All projects</Link>
        <p className="mt-6 font-[family-name:var(--font-mono)] text-xs uppercase tracking-widest text-[color:var(--accent-ink)]">
          {[p.role, p.year].filter(Boolean).join(" · ")}
        </p>
        <h1 className={`${D} mt-2 text-4xl font-bold leading-tight tracking-tight sm:text-6xl`}>{p.title}</h1>
        {p.summary && <p className="mt-4 text-lg text-[color:var(--muted)]">{p.summary}</p>}
        <div className="mt-6 flex flex-wrap gap-3">
          {p.live_url && <a href={p.live_url} target="_blank" rel="noreferrer" data-track="project_live" data-label={p.title} className="inline-flex min-h-11 items-center rounded-full bg-[var(--accent)] px-5 font-semibold text-[color:var(--on-accent)]">Live site ↗</a>}
          {p.repo_url && <a href={p.repo_url} target="_blank" rel="noreferrer" data-track="project_repo" data-label={p.title} className="inline-flex min-h-11 items-center rounded-full border border-[color:var(--line)] px-5">Source code ↗</a>}
        </div>
        {p.cover_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={p.cover_url} alt={p.title} className="mt-8 w-full rounded-2xl object-cover" />
        )}
        {p.metrics?.length > 0 && (
          <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3">
            {p.metrics.map((m: Record<string, string>, i: number) => (
              <div key={i} className="rounded-2xl border border-[color:var(--line)] bg-[color:var(--surface)] p-5">
                <strong className={`${D} text-3xl text-[color:var(--accent-ink)]`}>{m.value}</strong>
                <div className="mt-1 text-sm text-[color:var(--muted)]">{m.label}</div>
              </div>
            ))}
          </div>
        )}
        {p.description && <p className="mt-8 whitespace-pre-line text-base leading-relaxed text-[color:var(--fg2)] sm:text-lg">{p.description}</p>}
        {p.tags?.length > 0 && (
          <div className="mt-8 flex flex-wrap gap-2">
            {p.tags.map((t: string) => <span key={t} className="rounded-full border border-[color:var(--line)] px-3 py-1.5 text-sm text-[color:var(--muted)]">{t}</span>)}
          </div>
        )}
      </article>
    </div>
  );
}

export default function Page({ params }: { params: Promise<{ slug: string }> }) {
  return <Suspense fallback={<p className="p-10 text-[color:var(--muted)]">Loading…</p>}><Article params={params} /></Suspense>;
}
