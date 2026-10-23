import { format } from "date-fns";
import type { Row, SiteData } from "@/lib/site/data";
import { ContactForm } from "./contact-form";
import { Reveal } from "./reveal";
import { SocialLinks } from "./social-icon";
import { ContactActions } from "./contact-actions";

const D = "font-[family-name:var(--font-display)]";
const M = "font-[family-name:var(--font-mono)]";
const card = "rounded-2xl border border-[color:var(--line)] bg-[color:var(--surface)] p-5 sm:p-6";
const muted = "text-[color:var(--muted)]";
const chip = "rounded-full border border-[color:var(--line)] px-2.5 py-1 text-xs text-[color:var(--muted)]";
const fmt = (s?: string | null) => (s ? format(new Date(s + "T00:00:00"), "MMM yyyy") : "");
const grid = (c: string) => `grid gap-4 ${c}`;

export function Shell({ s, n, children }: { s: Row; n: string; children: React.ReactNode }) {
  return (
    <section id={s.key} className="mx-auto w-[min(92%,70rem)] pt-20 sm:pt-28">
      <header className="mb-8 flex flex-col gap-3 sm:mb-10">
        <span className={`${M} text-xs uppercase tracking-widest text-[color:var(--accent-ink)]`}>
          {n}{s.subtitle ? ` / ${s.title}` : ""}
        </span>
        <h2 className={`${D} text-3xl font-bold leading-tight tracking-tight sm:text-5xl`}>{s.subtitle || s.title}</h2>
      </header>
      <Reveal>{children}</Reveal>
    </section>
  );
}

export function Hero({ p, hasProjects }: { p: Row; hasProjects: boolean }) {
  const stats: Row[] = p.stats ?? [];
  const socials: Row[] = p.socials ?? [];
  return (
    <section id="hero" className="mx-auto grid w-[min(92%,70rem)] items-center gap-10 pt-14 sm:pt-20 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] lg:gap-16">
      <div className="fade-up flex flex-col gap-6">
        {p.availability && (
          <span className="flex w-fit items-center gap-2.5 rounded-full border border-[color:var(--line)] bg-[color:var(--surface)] px-4 py-2 text-sm">
            <span className="h-2 w-2 rounded-full bg-[var(--accent)]" />{p.availability}
          </span>
        )}
        <h1 className={`${D} text-balance text-[clamp(2.25rem,4.4vw,3.75rem)] font-bold leading-[1.04] tracking-tight`}>
          {p.headline || p.full_name || "Add your headline in the admin"}
        </h1>
        {p.bio && <p className={`max-w-xl text-base leading-relaxed sm:text-lg ${muted}`}>{p.bio}</p>}
        <div className="flex flex-wrap gap-3">
          {hasProjects && <a href="#projects" className="rounded-full bg-[color:var(--fg)] px-6 py-3.5 font-semibold text-[color:var(--bg)]">View projects →</a>}
          {(p.resume_url || p.theme?.resume_mode === "generated") && <a href={p.theme?.resume_mode === "generated" ? "/resume" : p.resume_url} {...(p.theme?.resume_mode === "generated" ? {} : { target: "_blank", rel: "noreferrer" })} data-track="resume" data-label="hero" className="rounded-full border border-[color:var(--line)] px-6 py-3.5">Download resume</a>}
        </div>
      </div>
      <div className={`${card} fade-up d2 flex w-full max-w-md flex-col gap-5 justify-self-center lg:justify-self-end`}>
        {p.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={p.avatar_url} alt={p.full_name ?? "Profile photo"} className="aspect-[4/5] w-full rounded-xl object-cover object-top ring-1 ring-[color:var(--line)]" />
        ) : (
          <div className={`flex aspect-[4/5] items-center justify-center rounded-xl bg-[color:var(--surface2)] text-5xl font-bold ${muted}`}>{(p.full_name ?? "?").slice(0, 1)}</div>
        )}
        {stats.length > 0 && (
          <div className="grid grid-cols-3 gap-3">
            {stats.slice(0, 3).map((x, i) => (
              <div key={i}>
                <strong className={`${D} text-2xl text-[color:var(--accent-ink)] sm:text-3xl`}>{x.value}</strong>
                <div className={`text-xs ${muted}`}>{x.label}</div>
              </div>
            ))}
          </div>
        )}
        {socials.length > 0 && <SocialLinks socials={socials} />}
      </div>
    </section>
  );
}

export function Tools({ items }: { items: Row[] }) {
  return (
    <div className={grid("grid-cols-2 sm:grid-cols-3 lg:grid-cols-4")}>
      {items.map((t) => (
        <div key={t.id} className={`${card} flex items-center gap-3 !p-4`}>
          <span className={`${D} flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[color:var(--line)] bg-[color:var(--surface2)] font-bold text-[color:var(--accent-ink)]`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {t.icon_url ? <img src={t.icon_url} alt="" className="h-full w-full object-contain p-1.5" /> : t.name.slice(0, 1)}
          </span>
          <div className="min-w-0">
            <div className="truncate font-medium">{t.name}</div>
            {t.category && <div className={`truncate text-xs ${muted}`}>{t.category}</div>}
          </div>
        </div>
      ))}
    </div>
  );
}

export function Skills({ items }: { items: Row[] }) {
  const groups = new Map<string, Row[]>();
  items.forEach((s) => groups.set(s.category, [...(groups.get(s.category) ?? []), s]));
  return (
    <div className={grid("md:grid-cols-2 lg:grid-cols-3")}>
      {[...groups].map(([cat, list]) => (
        <div key={cat} className={`${card} flex flex-col gap-4`}>
          <span className={`${M} text-xs uppercase tracking-widest ${muted}`}>{cat}</span>
          {list.map((s) => (
            <div key={s.id} className="flex items-center justify-between gap-3">
              <span>{s.name}</span>
              <span className="flex gap-1" aria-label={`Level ${s.level} of 5`}>
                {Array.from({ length: 5 }, (_, i) => (
                  <span key={i} className={`h-1.5 w-5 rounded-full ${i < s.level ? "bg-[var(--accent)]" : "bg-[color:var(--line)]"}`} />
                ))}
              </span>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

export function Experience({ items }: { items: Row[] }) {
  const range = (r: Row) =>
    `${fmt(r.start_date)}${r.start_date || r.end_date || r.is_current ? " – " : ""}${r.is_current ? "Present" : fmt(r.end_date)}`;
  return (
    <div className="flex flex-col gap-4">
      {items.map((e) => {
        const roles: Row[] = e.roles ?? [];
        const multi = roles.length > 1;
        const first: Row = roles[0] ?? {};
        const logo = (
          <span className="mt-1 flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[color:var(--line)] bg-[color:var(--surface2)]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {e.logo_url ? <img src={e.logo_url} alt="" className="h-full w-full object-contain p-1.5" /> : <span className={`${D} font-bold ${muted}`}>{e.company.slice(0, 1)}</span>}
          </span>
        );
        const tech = e.tech?.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">{e.tech.map((t: string) => <span key={t} className={chip}>{t}</span>)}</div>
        );

        if (!multi) {
          return (
            <div key={e.id} className={`${card} flex gap-4 sm:gap-5`}>
              {logo}
              <div className="min-w-0 flex-1">
                <div className="flex flex-col justify-between gap-1 sm:flex-row sm:gap-4">
                  <h3 className={`${D} text-xl font-bold sm:text-2xl`}>{first.title ?? e.role} · {e.company}</h3>
                  <span className={`${M} whitespace-nowrap text-xs uppercase ${muted}`}>{range(first)}</span>
                </div>
                {first.summary && <p className={`mt-2 ${muted}`}>{first.summary}</p>}
                {first.bullets?.length > 0 && (
                  <ul className={`mt-2 list-disc space-y-1 pl-5 text-sm ${muted}`}>{first.bullets.map((b: string, i: number) => <li key={i}>{b}</li>)}</ul>
                )}
                {tech}
              </div>
            </div>
          );
        }

        return (
          <div key={e.id} className={`${card} flex gap-4 sm:gap-5`}>
            {logo}
            <div className="min-w-0 flex-1">
              <div className="flex flex-col justify-between gap-1 sm:flex-row sm:items-baseline sm:gap-4">
                <h3 className={`${D} text-xl font-bold sm:text-2xl`}>{e.company}</h3>
                {e.tenure && <span className={`${M} whitespace-nowrap text-xs uppercase ${muted}`}>{e.tenure} total</span>}
              </div>
              <ol className="relative ml-1 mt-5 flex flex-col gap-6 border-l border-[color:var(--line)] pl-6">
                {roles.map((r, i) => (
                  <li key={i} className="relative">
                    <span aria-hidden className={`absolute -left-[1.9rem] top-1.5 h-3 w-3 rounded-full border-2 border-[color:var(--surface)] ${r.is_current ? "bg-[var(--accent)]" : "bg-[color:var(--line2)]"}`} />
                    <div className="flex flex-col justify-between gap-1 sm:flex-row sm:gap-4">
                      <h4 className={`${D} text-lg font-semibold`}>{r.title}</h4>
                      <span className={`${M} whitespace-nowrap text-xs uppercase ${muted}`}>{range(r)}</span>
                    </div>
                    {r.summary && <p className={`mt-1.5 ${muted}`}>{r.summary}</p>}
                    {r.bullets?.length > 0 && (
                      <ul className={`mt-2 list-disc space-y-1 pl-5 text-sm ${muted}`}>{r.bullets.map((b: string, j: number) => <li key={j}>{b}</li>)}</ul>
                    )}
                  </li>
                ))}
              </ol>
              {tech}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function Education({ items }: { items: Row[] }) {
  return (
    <div className={grid("sm:grid-cols-2")}>
      {items.map((e) => (
        <div key={e.id} className={card}>
          <span className={`${M} text-xs uppercase tracking-widest text-[color:var(--accent-ink)]`}>{[e.start_year, e.end_year].filter(Boolean).join(" – ")}</span>
          <h3 className={`${D} mt-2 text-xl font-bold`}>{e.degree}</h3>
          <p className={`mt-1 text-sm ${muted}`}>{[e.institution, e.grade].filter(Boolean).join(" · ")}</p>
        </div>
      ))}
    </div>
  );
}

export function Achievements({ items }: { items: Row[] }) {
  return (
    <div className={grid("sm:grid-cols-2 lg:grid-cols-3")}>
      {items.map((a) => (
        <div key={a.id} className={`${card} flex flex-col gap-2`}>
          <span className="flex h-10 w-10 items-center justify-center rounded-full border border-[color:var(--line)] bg-[color:var(--surface2)] text-[color:var(--accent-ink)]">★</span>
          <h3 className={`${D} mt-1 text-lg font-bold`}>{a.title}</h3>
          <p className={`text-sm ${muted}`}>{[a.issuer, a.year].filter(Boolean).join(" · ")}</p>
          {a.description && <p className={`text-sm ${muted}`}>{a.description}</p>}
        </div>
      ))}
    </div>
  );
}

export function Projects({ items }: { items: Row[] }) {
  return (
    <div className={grid("md:grid-cols-2 lg:grid-cols-3")}>
      {items.map((p) => (
        <article key={p.id} className={`${card} relative flex flex-col overflow-hidden !p-0 ${p.featured ? "lg:col-span-2" : ""}`}>
          <div className={`flex items-center justify-center overflow-hidden border-b border-[color:var(--line)] bg-[color:var(--surface2)] ${p.featured ? "h-56 sm:h-72" : "h-44"}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {p.cover_url ? <img src={p.cover_url} alt={p.title} className="h-full w-full object-cover" loading="lazy" /> : <span className={`text-sm ${muted}`}>No cover</span>}
          </div>
          <div className="flex flex-1 flex-col gap-2.5 p-5 sm:p-6">
            <span className={`${M} text-xs uppercase tracking-widest ${muted}`}>{[p.role, p.year].filter(Boolean).join(" · ")}</span>
            <h3 className={`${D} text-xl font-bold sm:text-2xl`}><a href={`/projects/${p.slug}`} className="after:absolute after:inset-0">{p.title}</a></h3>
            {p.summary && <p className={muted}>{p.summary}</p>}
            {p.metrics?.length > 0 && (
              <div className="mt-1 flex flex-wrap gap-x-6 gap-y-2">
                {p.metrics.slice(0, 3).map((m: Row, i: number) => (
                  <div key={i}><strong className={`${D} text-xl text-[color:var(--accent-ink)]`}>{m.value}</strong><div className={`text-xs ${muted}`}>{m.label}</div></div>
                ))}
              </div>
            )}
            <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-3">
              <div className="flex flex-wrap gap-2">{p.tags?.slice(0, 4).map((t: string) => <span key={t} className={chip}>{t}</span>)}</div>
              <div className="flex gap-4 text-sm font-medium">
                {p.live_url && <a href={p.live_url} target="_blank" rel="noreferrer" data-track="project_live" data-label={p.title} className="relative z-10 hover:text-[color:var(--accent-ink)]">Live ↗</a>}
                {p.repo_url && <a href={p.repo_url} target="_blank" rel="noreferrer" data-track="project_repo" data-label={p.title} className="relative z-10 hover:text-[color:var(--accent-ink)]">Code ↗</a>}
              </div>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}

export function Testimonials({ items }: { items: Row[] }) {
  return (
    <div className={grid("md:grid-cols-2 lg:grid-cols-3")}>
      {items.map((t) => (
        <figure key={t.id} className={`${card} flex flex-col justify-between gap-5`}>
          <blockquote className="leading-relaxed">“{t.quote}”</blockquote>
          <figcaption className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {t.avatar_url ? <img src={t.avatar_url} alt="" className="h-10 w-10 rounded-full object-cover" /> : <span className="h-10 w-10 rounded-full bg-[color:var(--surface2)]" />}
            <div><div className="text-sm font-semibold">{t.name}</div><div className={`text-xs ${muted}`}>{[t.title, t.company].filter(Boolean).join(", ")}</div></div>
          </figcaption>
        </figure>
      ))}
    </div>
  );
}

export function Blog({ posts }: { posts: Row[] }) {
  if (!posts.length) return <p className={muted}>No posts published yet.</p>;
  return (
    <div className={grid("md:grid-cols-2 lg:grid-cols-3")}>
      {posts.map((p) => (
        <a key={p.id} href={`/blog/${p.slug}`} className={`${card} group flex flex-col gap-3 overflow-hidden !p-0 transition-colors hover:border-[color:var(--accent-ink)]`}>
          {p.cover_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={p.cover_url} alt="" loading="lazy" className="h-40 w-full object-cover" />
          )}
          <div className="flex flex-1 flex-col gap-2 p-5">
            <span className={`${M} text-xs uppercase tracking-widest text-[color:var(--accent-ink)]`}>
              {p.published_at ? format(new Date(p.published_at), "dd MMM yyyy") : ""} · {p.reading_minutes} min
            </span>
            <h3 className={`${D} text-xl font-bold`}>{p.title}</h3>
            {p.excerpt && <p className={`line-clamp-3 text-sm ${muted}`}>{p.excerpt}</p>}
          </div>
        </a>
      ))}
    </div>
  );
}

export function Custom({ items }: { items: Row[] }) {
  if (!items.length) return null;
  return (
    <div className={grid("md:grid-cols-2 lg:grid-cols-3")}>
      {items.map((it) => {
        const d = it.data ?? {};
        return (
          <div key={it.id} className={`${card} flex flex-col gap-2 overflow-hidden`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {d.image_url && <img src={d.image_url} alt="" loading="lazy" className="-mx-1 mb-2 h-40 w-[calc(100%+0.5rem)] rounded-lg object-cover" />}
            {d.date_label && <span className={`${M} text-xs uppercase tracking-widest text-[color:var(--accent-ink)]`}>{d.date_label}</span>}
            <h3 className={`${D} text-lg font-bold`}>{d.title}</h3>
            {d.subtitle && <p className={`text-sm ${muted}`}>{d.subtitle}</p>}
            {d.description && <p className={`text-sm ${muted}`}>{d.description}</p>}
            {d.tags?.length > 0 && <div className="flex flex-wrap gap-2">{d.tags.map((t: string) => <span key={t} className={chip}>{t}</span>)}</div>}
            {d.link_url && <a href={d.link_url} target="_blank" rel="noreferrer" className="mt-auto pt-2 text-sm font-medium hover:text-[color:var(--accent-ink)]">{d.link_label || "Learn more"} ↗</a>}
          </div>
        );
      })}
    </div>
  );
}

export function Services({ items, d }: { items: Row[]; d: SiteData }) {
  const hasContact = d.sections.some((x) => x.type === "contact");
  return (
    <div className={grid("md:grid-cols-2 lg:grid-cols-3")}>
      {items.map((s) => {
        const href = s.cta_url || (hasContact ? "#contact" : d.profile.email ? `mailto:${d.profile.email}` : "#");
        const external = /^https?:/i.test(href);
        return (
          <div key={s.id} className={`${card} relative flex flex-col gap-4 ${s.featured ? "border-[color:var(--accent-ink)]" : ""}`}>
            {s.featured && (
              <span className="absolute right-4 top-4 rounded-full bg-[var(--accent)] px-2.5 py-1 text-xs font-semibold text-[color:var(--on-accent)]">Most popular</span>
            )}
            <h3 className={`${D} text-xl font-bold ${s.featured ? "pr-28" : ""}`}>{s.title}</h3>
            {s.description && <p className={`text-sm leading-relaxed ${muted}`}>{s.description}</p>}
            {s.price_label && (
              <div>
                <div className={`${D} text-2xl font-bold text-[color:var(--accent-ink)]`}>{s.price_label}</div>
                {s.price_note && <div className={`text-xs ${muted}`}>{s.price_note}</div>}
              </div>
            )}
            {s.features?.length > 0 && (
              <ul className="flex flex-col gap-2 text-sm">
                {s.features.map((f: string, i: number) => (
                  <li key={i} className="flex gap-2"><span aria-hidden className="text-[color:var(--accent-ink)]">✓</span><span>{f}</span></li>
                ))}
              </ul>
            )}
            <a
              href={href} data-track="service" data-label={s.title}
              {...(external ? { target: "_blank", rel: "noreferrer" } : {})}
              className={`mt-auto inline-flex min-h-11 items-center justify-center rounded-full px-5 text-sm font-semibold transition-colors ${
                s.featured ? "bg-[var(--accent)] text-[color:var(--on-accent)]" : "border border-[color:var(--line)] hover:border-[color:var(--accent-ink)]"
              }`}
            >
              {s.cta_label || "Get in touch"}
            </a>
          </div>
        );
      })}
    </div>
  );
}

export function Contact({ p }: { p: Row }) {
  const socials: Row[] = p.socials ?? [];
  return (
    <div className="grid gap-8 rounded-3xl border border-[color:var(--line)] bg-[color:var(--surface)] p-6 sm:p-10 lg:grid-cols-[1.1fr_1fr] lg:gap-12 lg:p-14">
      <div className="flex flex-col gap-4">
        <h3 className={`${D} text-4xl font-bold leading-[1.02] tracking-tight sm:text-6xl`}>Let’s build<br /><span className="text-[color:var(--accent-ink)]">something.</span></h3>
        <div className={`flex flex-col gap-1 ${muted}`}>
          {p.email && <a href={`mailto:${p.email}`} className="hover:text-[color:var(--fg)]">{p.email}</a>}
          {p.phone && <a href={`tel:${p.phone}`} className="hover:text-[color:var(--fg)]">{p.phone}</a>}
          {p.location && <span>{p.location}</span>}
        </div>
        <ContactActions email={p.email} canSave={!!(p.email || p.phone)} />
        {socials.length > 0 && <SocialLinks socials={socials} />}
      </div>
      <ContactForm />
    </div>
  );
}

export function Footer({ p, year }: { p: Row; year: number }) {
  return (
    <footer className={`mx-auto mt-24 w-[min(92%,70rem)] border-t border-[color:var(--line)] py-8 text-center text-sm ${muted}`}>
      {p.theme?.footer_text || `© ${year} ${p.full_name ?? ""}`}
    </footer>
  );
}

export function renderSection(s: Row, d: SiteData, n: string) {
  const body = (() => {
    switch (s.type) {
      case "tools": return d.tools.length ? <Tools items={d.tools} /> : null;
      case "skills": return d.skills.length ? <Skills items={d.skills} /> : null;
      case "experience": return d.experiences.length ? <Experience items={d.experiences} /> : null;
      case "education": return d.education.length ? <Education items={d.education} /> : null;
      case "achievements": return d.achievements.length ? <Achievements items={d.achievements} /> : null;
      case "projects": return d.projects.length ? <Projects items={d.projects} /> : null;
      case "testimonials": return d.testimonials.length ? <Testimonials items={d.testimonials} /> : null;
      case "services": return d.services.length ? <Services items={d.services} d={d} /> : null;
      case "blog": return <><Blog posts={d.posts} /><a href="/blog" className="mt-6 inline-flex min-h-11 items-center text-sm font-medium text-[color:var(--accent-ink)]">View all posts →</a></>;
      case "contact": return <Contact p={d.profile} />;
      case "custom": return d.itemsBySection[s.id]?.length ? <Custom items={d.itemsBySection[s.id]} /> : null;
      default: return null;
    }
  })();
  if (!body) return null;
  return <Shell key={s.id} s={s} n={n}>{body}</Shell>;
}
