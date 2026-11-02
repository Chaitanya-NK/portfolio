import { format } from "date-fns";
import type { Row, SiteData } from "@/lib/site/data";
import { ContactForm } from "./contact-form";
import { Reveal } from "./reveal";
import { SocialLinks } from "./social-icon";
import { ContactActions } from "./contact-actions";
import { IntroVideo } from "./intro-video";
import { PronounceButton } from "./pronounce-button";

const M = "font-[family-name:var(--font-mono)]";
const muted = "text-[color:var(--muted)]";
const body2 = "text-[color:var(--fg2)]";
const ln = "border-[color:var(--line)]";
const accent = "text-[color:var(--accent-ink)]";
const cap = `${M} text-[0.6875rem] uppercase tracking-[0.1em] text-[color:var(--faint)]`;
const chip = `inline-flex items-center rounded border ${ln} px-2 py-0.5 text-xs ${muted}`;
const panel = `rounded-lg border ${ln} bg-[color:var(--surface)]`;
const title = "text-[0.9375rem] font-semibold tracking-tight";
const row = `grid gap-1.5 border-b ${ln} py-5 first:pt-0 last:border-b-0 last:pb-0 sm:grid-cols-[8.5rem_minmax(0,1fr)] sm:gap-6`;
const WRAP = "mx-auto w-[min(92%,64rem)]";

const fmt = (s?: string | null) => (s ? format(new Date(s + "T00:00:00"), "MMM yyyy") : "");
const rangeOf = (r: Row) =>
  `${fmt(r.start_date)}${r.start_date || r.end_date || r.is_current ? " – " : ""}${r.is_current ? "Present" : fmt(r.end_date)}`;

function Bullets({ items }: { items?: string[] }) {
  if (!items?.length) return null;
  return (
    <ul className={`mt-2 flex list-disc flex-col gap-1 pl-4 text-sm ${body2} marker:text-[color:var(--faint)]`}>
      {items.map((b, i) => <li key={i}>{b}</li>)}
    </ul>
  );
}

function Dots({ n }: { n: number }) {
  return (
    <span role="img" aria-label={`Level ${n} of 5`} className="flex gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} className={`h-1 w-1 rounded-full ${i < n ? "bg-[color:var(--accent-ink)]" : "bg-[color:var(--line2)]"}`} />
      ))}
    </span>
  );
}

export function Shell({ s, n, children }: { s: Row; n: string; children: React.ReactNode }) {
  return (
    <section id={s.key} className={WRAP}>
      <div className={`grid gap-5 border-t ${ln} py-10 sm:py-12 lg:grid-cols-[11rem_minmax(0,1fr)] lg:gap-10`}>
        <header className="lg:sticky lg:top-24 lg:self-start">
          <p className={cap}>{n}</p>
          <h2 className="mt-1.5 text-base font-semibold tracking-tight">{s.title}</h2>
          {s.subtitle && <p className={`mt-1 text-sm leading-snug ${muted}`}>{s.subtitle}</p>}
        </header>
        <Reveal>{children}</Reveal>
      </div>
    </section>
  );
}

export function Hero({ p, hasProjects, hasContact }: { p: Row; hasProjects: boolean; hasContact: boolean }) {
  const stats: Row[] = ((p.stats ?? []) as Row[]).slice(0, 4);
  const socials: Row[] = p.socials ?? [];
  const generated = p.theme?.resume_mode === "generated";
  const primary = hasProjects ? { href: "#projects", label: "View projects" } : hasContact ? { href: "#contact", label: "Get in touch" } : null;
  const btn = "inline-flex h-10 items-center rounded-md px-4 text-sm font-medium transition-colors";
  const extras = Boolean(p.name_phonetic || p.name_audio_url || p.theme?.intro_video);

  return (
    <section id="hero" className={`${WRAP} pb-14 pt-12 sm:pt-16 lg:pt-20`}>
      <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_15rem] lg:gap-16">
        <div className="fade-up flex flex-col gap-5">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm">
            {p.full_name && <span className="font-medium">{p.full_name}</span>}
            {p.availability && (
              <span className={`inline-flex items-center gap-2 rounded-full border ${ln} px-2.5 py-1 text-xs ${muted}`}>
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden />{p.availability}
              </span>
            )}
          </div>
          <h1 className="max-w-2xl text-[clamp(1.75rem,3.4vw,2.5rem)] font-semibold leading-[1.15] tracking-[-0.02em]">
            {p.headline || "Add your headline in the admin"}
          </h1>
          {p.bio && <p className={`max-w-xl leading-relaxed ${muted}`}>{p.bio}</p>}

          <div className="flex flex-wrap items-center gap-2.5 pt-1">
            {primary && <a href={primary.href} className={`${btn} bg-[var(--accent)] text-[color:var(--on-accent)] hover:brightness-95`}>{primary.label}</a>}
            {(p.resume_url || generated) && (
              <a
                href={generated ? "/resume" : p.resume_url}
                {...(generated ? {} : { target: "_blank", rel: "noreferrer" })}
                data-track="resume" data-label="hero"
                className={`${btn} border ${ln} hover:bg-[color:var(--surface2)]`}
              >
                Download resume
              </a>
            )}
            {hasContact && hasProjects && <a href="#contact" className={`${btn} ${muted} hover:text-[color:var(--fg)]`}>Contact</a>}
          </div>

          {extras && (
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              {(p.name_phonetic || p.name_audio_url) && <PronounceButton name={p.full_name} phonetic={p.name_phonetic} audioUrl={p.name_audio_url} />}
              {p.theme?.intro_video && <IntroVideo v={p.theme.intro_video} />}
            </div>
          )}
        </div>

        <aside className="fade-up d2 flex w-full max-w-[15rem] flex-col gap-4 lg:justify-self-end">
          {p.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={p.avatar_url} alt={p.full_name ?? "Profile photo"} className={`aspect-[4/5] w-full rounded-lg border ${ln} object-cover object-top`} />
          ) : (
            <div className={`flex aspect-[4/5] w-full items-center justify-center rounded-lg border ${ln} bg-[color:var(--surface2)] text-4xl font-semibold ${muted}`}>
              {(p.full_name ?? "?").slice(0, 1)}
            </div>
          )}
          {p.location && <p className={`text-sm ${muted}`}>{p.location}</p>}
          {socials.length > 0 && <SocialLinks socials={socials} />}
        </aside>
      </div>

      {stats.length > 0 && (
        <div
          style={{ ["--cols" as string]: stats.length }}
          className={`mt-12 grid grid-cols-2 gap-px overflow-hidden rounded-lg border ${ln} bg-[color:var(--line)] sm:[grid-template-columns:repeat(var(--cols),minmax(0,1fr))]`}
        >
          {stats.map((x, i) => (
            <div key={i} className={`bg-[color:var(--bg)] p-4 ${i === stats.length - 1 && stats.length % 2 ? "col-span-2 sm:col-span-1" : ""}`}>
              <p className="text-xl font-semibold tabular-nums tracking-tight">{x.value}</p>
              <p className={`mt-0.5 text-xs ${muted}`}>{x.label}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export function Tools({ items }: { items: Row[] }) {
  return (
    <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
      {items.map((t) => (
        <li key={t.id} title={t.category ?? undefined} className={`flex items-center gap-2.5 rounded-md border ${ln} px-3 py-2`}>
          <span className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded border border-black/5 bg-white">
            {t.icon_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={t.icon_url} alt="" className="h-full w-full object-contain p-1" />
            ) : (
              <span className="text-xs font-semibold text-neutral-500">{String(t.name).slice(0, 1)}</span>
            )}
          </span>
          <span className="min-w-0 truncate text-sm">{t.name}</span>
        </li>
      ))}
    </ul>
  );
}

export function Skills({ items }: { items: Row[] }) {
  const groups = new Map<string, Row[]>();
  items.forEach((s) => groups.set(s.category, [...(groups.get(s.category) ?? []), s]));
  return (
    <div className="flex flex-col">
      {[...groups].map(([cat, list]) => (
        <div key={cat} className={`grid gap-2.5 border-b ${ln} py-4 first:pt-0 last:border-b-0 last:pb-0 sm:grid-cols-[8.5rem_minmax(0,1fr)] sm:gap-6`}>
          <h3 className={`${cap} pt-1.5`}>{cat}</h3>
          <ul className="flex flex-wrap gap-2">
            {list.map((s) => (
              <li key={s.id} className={`inline-flex items-center gap-2 rounded-md border ${ln} px-2.5 py-1 text-sm`}>
                {s.name}<Dots n={s.level} />
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

function Logo({ e }: { e: Row }) {
  return (
    <span className={`flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-md border ${ln} bg-white`}>
      {e.logo_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={e.logo_url} alt="" className="h-full w-full object-contain p-1" />
      ) : (
        <span className="text-xs font-semibold text-neutral-500">{String(e.company).slice(0, 1)}</span>
      )}
    </span>
  );
}

export function Experience({ items }: { items: Row[] }) {
  return (
    <ol className="flex flex-col">
      {items.map((e) => {
        const roles: Row[] = e.roles ?? [];
        const multi = roles.length > 1;
        const first: Row = roles[0] ?? {};
        const starts = roles.map((r) => r.start_date).filter(Boolean).sort() as string[];
        const current = roles.some((r) => r.is_current);
        const span = starts.length ? `${fmt(starts[0])} – ${current ? "Present" : fmt(first.end_date)}` : "";
        return (
          <li key={e.id} className={row}>
            <div className="flex flex-col gap-0.5">
              {span && <span className={cap}>{span}</span>}
              {multi && e.tenure && <span className={`text-xs ${muted}`}>{e.tenure}</span>}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-3">
                <Logo e={e} />
                <div className="min-w-0">
                  <h3 className={title}>{multi ? e.company : first.title ?? e.role}</h3>
                  <p className={`text-sm ${muted}`}>{multi ? `${roles.length} roles` : e.company}</p>
                </div>
              </div>
              {multi ? (
                <ol className={`ml-4 mt-4 flex flex-col gap-5 border-l ${ln} pl-5`}>
                  {roles.map((r, i) => (
                    <li key={i} className="relative">
                      <span aria-hidden className={`absolute -left-[1.56rem] top-1.5 h-2 w-2 rounded-full border-2 border-[color:var(--bg)] ${r.is_current ? "bg-[var(--accent)]" : "bg-[color:var(--line2)]"}`} />
                      <div className="flex flex-wrap items-baseline justify-between gap-x-4">
                        <h4 className="text-sm font-medium">{r.title}</h4>
                        <span className={cap}>{rangeOf(r)}</span>
                      </div>
                      {r.summary && <p className={`mt-1 text-sm ${muted}`}>{r.summary}</p>}
                      <Bullets items={r.bullets} />
                    </li>
                  ))}
                </ol>
              ) : (
                <div className="mt-3">
                  {first.summary && <p className={`text-sm ${muted}`}>{first.summary}</p>}
                  <Bullets items={first.bullets} />
                </div>
              )}
              {e.tech?.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">{e.tech.map((t: string) => <span key={t} className={chip}>{t}</span>)}</div>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

export function Education({ items }: { items: Row[] }) {
  return (
    <ul className="flex flex-col">
      {items.map((e) => (
        <li key={e.id} className={row}>
          <span className={cap}>{[e.start_year, e.end_year].filter(Boolean).join(" – ")}</span>
          <div>
            <h3 className={title}>{e.degree}</h3>
            <p className={`text-sm ${muted}`}>{[e.institution, e.grade].filter(Boolean).join(" · ")}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}

export function Achievements({ items }: { items: Row[] }) {
  return (
    <ul className="flex flex-col">
      {items.map((a) => (
        <li key={a.id} className={row}>
          <span className={cap}>{a.year ?? ""}</span>
          <div>
            <h3 className={title}>{a.title}</h3>
            {a.issuer && <p className={`text-sm ${muted}`}>{a.issuer}</p>}
            {a.description && <p className={`mt-1 text-sm ${body2}`}>{a.description}</p>}
          </div>
        </li>
      ))}
    </ul>
  );
}

export function Projects({ items }: { items: Row[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {items.map((p) => {
        const case_ = Boolean(p.problem || p.approach || p.result || p.gallery?.length);
        return (
          <article key={p.id} className={`group relative flex flex-col overflow-hidden ${panel} transition-colors hover:border-[color:var(--line2)] ${p.featured ? "sm:col-span-2" : ""}`}>
            {p.cover_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={p.cover_url} alt={p.title} loading="lazy" className={`w-full border-b ${ln} object-cover ${p.featured ? "aspect-[16/7]" : "aspect-[16/9]"}`} />
            )}
            <div className="flex flex-1 flex-col gap-2.5 p-4">
              {(p.role || p.year) && <p className={cap}>{[p.role, p.year].filter(Boolean).join(" · ")}</p>}
              <h3 className="text-base font-semibold tracking-tight">
                <a href={`/projects/${p.slug}`} className="after:absolute after:inset-0">{p.title}</a>
              </h3>
              {p.summary && <p className={`line-clamp-2 text-sm ${muted}`}>{p.summary}</p>}
              {p.metrics?.length > 0 && (
                <p className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
                  {p.metrics.slice(0, 3).map((m: Row, i: number) => (
                    <span key={i}><strong className="font-semibold tabular-nums">{m.value}</strong> <span className={muted}>{m.label}</span></span>
                  ))}
                </p>
              )}
              {p.tags?.length > 0 && <div className="flex flex-wrap gap-1.5">{p.tags.slice(0, 4).map((t: string) => <span key={t} className={chip}>{t}</span>)}</div>}
              <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-2 text-sm">
                <span className={`text-xs font-medium ${accent}`}>{case_ ? "Case study →" : ""}</span>
                <span className="flex gap-4">
                  {p.live_url && <a href={p.live_url} target="_blank" rel="noreferrer" data-track="project_live" data-label={p.title} className={`relative z-10 ${muted} hover:text-[color:var(--fg)]`}>Live ↗</a>}
                  {p.repo_url && <a href={p.repo_url} target="_blank" rel="noreferrer" data-track="project_repo" data-label={p.title} className={`relative z-10 ${muted} hover:text-[color:var(--fg)]`}>Code ↗</a>}
                </span>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}

export function Services({ items, d }: { items: Row[]; d: SiteData }) {
  const hasContact = d.sections.some((x) => x.type === "contact");
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {items.map((s) => {
        const href = s.cta_url || (hasContact ? "#contact" : d.profile.email ? `mailto:${d.profile.email}` : "#");
        return (
          <div key={s.id} className={`${panel} flex flex-col gap-3 p-5 ${s.featured ? "border-[color:var(--accent-ink)]" : ""}`}>
            {s.featured && <p className={`${cap} ${accent}`}>Most popular</p>}
            <h3 className={title}>{s.title}</h3>
            {s.description && <p className={`text-sm leading-relaxed ${muted}`}>{s.description}</p>}
            {s.price_label && (
              <p>
                <span className="text-lg font-semibold tracking-tight">{s.price_label}</span>
                {s.price_note && <span className={`ml-2 text-xs ${muted}`}>{s.price_note}</span>}
              </p>
            )}
            {s.features?.length > 0 && (
              <ul className="flex flex-col gap-1.5 text-sm">
                {s.features.map((f: string, i: number) => (
                  <li key={i} className="flex gap-2"><span aria-hidden className={accent}>✓</span><span className={body2}>{f}</span></li>
                ))}
              </ul>
            )}
            <a
              href={href} data-track="service" data-label={s.title}
              {...(/^https?:/i.test(href) ? { target: "_blank", rel: "noreferrer" } : {})}
              className={`mt-auto inline-flex h-10 items-center justify-center rounded-md px-4 text-sm font-medium transition-colors ${s.featured ? "bg-[var(--accent)] text-[color:var(--on-accent)] hover:brightness-95" : `border ${ln} hover:bg-[color:var(--surface2)]`}`}
            >
              {s.cta_label || "Get in touch"}
            </a>
          </div>
        );
      })}
    </div>
  );
}

export function Testimonials({ items }: { items: Row[] }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {items.map((t) => (
        <figure key={t.id} className={`${panel} flex flex-col justify-between gap-4 p-5`}>
          <blockquote className={`text-sm leading-relaxed ${body2}`}>“{t.quote}”</blockquote>
          <figcaption className="flex items-center gap-3">
            {t.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={t.avatar_url} alt="" className="h-8 w-8 rounded-full object-cover" />
            ) : (
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[color:var(--surface2)] text-xs font-semibold">{String(t.name).slice(0, 1)}</span>
            )}
            <div className="min-w-0">
              <p className="text-sm font-medium">{t.name}</p>
              <p className={`truncate text-xs ${muted}`}>{[t.title, t.company].filter(Boolean).join(", ")}</p>
            </div>
          </figcaption>
        </figure>
      ))}
    </div>
  );
}

export function Notes({ items }: { items: Row[] }) {
  return (
    <ul className="flex flex-col">
      {items.map((n) => (
        <li key={n.id} className={row}>
          <time dateTime={n.created_at} className={cap}>{format(new Date(n.created_at), "d MMM yyyy")}</time>
          <div className="min-w-0">
            <p className={`whitespace-pre-line break-words ${body2}`}>{n.body}</p>
            {(n.tags?.length > 0 || n.link_url) && (
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                {n.pinned && <span className={`${cap} ${accent}`}>Pinned</span>}
                {n.tags?.map((t: string) => <span key={t} className={chip}>#{t}</span>)}
                {n.link_url && <a href={n.link_url} target="_blank" rel="noreferrer" className={`text-xs font-medium ${accent}`}>Link ↗</a>}
              </div>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}

export function Blog({ posts }: { posts: Row[] }) {
  if (!posts.length) return <p className={muted}>No posts published yet.</p>;
  return (
    <ul className="flex flex-col">
      {posts.map((p) => (
        <li key={p.id} className={`${row} relative`}>
          <span className={cap}>{p.published_at ? format(new Date(p.published_at), "d MMM yyyy") : ""}</span>
          <div className="min-w-0">
            <h3 className={title}><a href={`/blog/${p.slug}`} className="after:absolute after:inset-0 hover:underline hover:underline-offset-4">{p.title}</a></h3>
            {p.excerpt && <p className={`mt-1 line-clamp-2 text-sm ${muted}`}>{p.excerpt}</p>}
            <p className={`mt-1.5 text-xs ${muted}`}>{p.reading_minutes} min read</p>
          </div>
        </li>
      ))}
    </ul>
  );
}

export function Custom({ items }: { items: Row[] }) {
  if (!items.length) return null;
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {items.map((it) => {
        const d = it.data ?? {};
        return (
          <div key={it.id} className={`${panel} flex flex-col gap-2 overflow-hidden p-4`}>
            {d.image_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={d.image_url} alt="" loading="lazy" className={`-mx-4 -mt-4 mb-1 aspect-[16/9] w-[calc(100%+2rem)] max-w-none border-b ${ln} object-cover`} />
            )}
            {d.date_label && <p className={cap}>{d.date_label}</p>}
            <h3 className={title}>{d.title}</h3>
            {d.subtitle && <p className={`text-sm ${muted}`}>{d.subtitle}</p>}
            {d.description && <p className={`text-sm ${body2}`}>{d.description}</p>}
            {d.tags?.length > 0 && <div className="flex flex-wrap gap-1.5">{d.tags.map((t: string) => <span key={t} className={chip}>{t}</span>)}</div>}
            {d.link_url && <a href={d.link_url} target="_blank" rel="noreferrer" className={`mt-auto pt-1 text-sm font-medium ${accent}`}>{d.link_label || "Learn more"} ↗</a>}
          </div>
        );
      })}
    </div>
  );
}

export function Contact({ p }: { p: Row }) {
  const socials: Row[] = p.socials ?? [];
  const details = ([
    ["Email", p.email, p.email ? `mailto:${p.email}` : null],
    ["Phone", p.phone, p.phone ? `tel:${String(p.phone).replace(/[^\d+]/g, "")}` : null],
    ["Location", p.location, null],
  ] as [string, string | null, string | null][]).filter(([, v]) => v);
  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:gap-12">
      <div className="flex flex-col gap-5">
        {details.length > 0 && (
          <dl className="flex flex-col gap-3">
            {details.map(([k, v, h]) => (
              <div key={k} className="grid grid-cols-[5rem_minmax(0,1fr)] items-baseline gap-3 text-sm">
                <dt className={cap}>{k}</dt>
                <dd className="min-w-0 break-words">
                  {h ? <a href={h} className="underline-offset-4 hover:text-[color:var(--accent-ink)] hover:underline">{v}</a> : v}
                </dd>
              </div>
            ))}
          </dl>
        )}
        {socials.length > 0 && <SocialLinks socials={socials} />}
        <ContactActions email={p.email} canSave={!!(p.email || p.phone)} />
      </div>
      <div className={`${panel} p-5`}><ContactForm /></div>
    </div>
  );
}

export function Footer({ p, year }: { p: Row; year: number }) {
  return (
    <footer className={`${WRAP} border-t ${ln} pb-24 pt-8 text-sm ${muted}`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span>{p.theme?.footer_text || `© ${year} ${p.full_name ?? ""}`}</span>
        <a href="/privacy" className="underline-offset-4 hover:text-[color:var(--fg)] hover:underline">Privacy</a>
      </div>
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
      case "services": return d.services.length ? <Services items={d.services} d={d} /> : null;
      case "testimonials": return d.testimonials.length ? <Testimonials items={d.testimonials} /> : null;
      case "notes":
        return d.notes.length ? (
          <>
            <Notes items={d.notes} />
            <a href="/notes" className={`mt-5 inline-flex min-h-11 items-center text-sm font-medium ${accent}`}>All notes →</a>
          </>
        ) : null;
      case "blog":
        return (
          <>
            <Blog posts={d.posts} />
            {d.posts.length > 0 && <a href="/blog" className={`mt-5 inline-flex min-h-11 items-center text-sm font-medium ${accent}`}>View all posts →</a>}
          </>
        );
      case "contact": return <Contact p={d.profile} />;
      case "custom": return d.itemsBySection[s.id]?.length ? <Custom items={d.itemsBySection[s.id]} /> : null;
      default: return null;
    }
  })();
  if (!body) return null;
  return <Shell key={s.id} s={s} n={n}>{body}</Shell>;
}
