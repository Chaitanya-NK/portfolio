import Link from "next/link";
import { format } from "date-fns";
import type { Row } from "@/lib/site/data";
import type { ResumeData } from "@/lib/resume-version";
import { PrintButton } from "./print-button";

const mon = (s?: string | null) => (s ? format(new Date(s + "T00:00:00"), "MMM yyyy") : "");
const range = (r: Row) =>
  `${mon(r.start_date)}${r.start_date || r.end_date || r.is_current ? " – " : ""}${r.is_current ? "Present" : mon(r.end_date)}`;
const bare = (u: string) => u.replace(/^(https?:\/\/|mailto:)(www\.)?/i, "").replace(/\/$/, "");

function H({ children }: { children: React.ReactNode }) {
  return <h2 className="mb-2 mt-6 border-b border-neutral-300 pb-1 text-[0.78rem] font-bold uppercase tracking-[0.14em] text-neutral-700">{children}</h2>;
}

export function ResumeView({ data, label }: { data: ResumeData; label?: string }) {
  const p = data.profile;
  const groups = new Map<string, string[]>();
  data.skills.forEach((s) => groups.set(s.category, [...(groups.get(s.category) ?? []), s.name]));
  const contact = [p.email, p.phone, p.location].filter(Boolean) as string[];
  const links = ((p.socials ?? []) as Row[]).filter((x) => /^https?:/i.test(x.url));

  return (
    <div className="min-h-dvh bg-neutral-200 px-3 py-6 text-neutral-900 print:bg-white print:p-0">
      <style>{"@page{size:A4;margin:14mm}"}</style>
      <div className="mx-auto mb-4 flex w-[min(100%,210mm)] flex-wrap items-center justify-between gap-2 print:hidden">
        <Link href="/" className="inline-flex min-h-11 items-center text-sm text-neutral-600 hover:text-neutral-900">← Back to site</Link>
        <PrintButton label={label} />
      </div>

      <article className="mx-auto w-[min(100%,210mm)] bg-white p-[min(14mm,6vw)] text-[0.92rem] leading-snug shadow-lg print:w-full print:p-0 print:shadow-none">
        <header>
          <h1 className="text-3xl font-bold tracking-tight">{p.full_name}</h1>
          {p.headline && <p className="mt-1 text-base text-neutral-700">{p.headline}</p>}
          <p className="mt-2 flex flex-wrap gap-x-3 gap-y-0.5 text-neutral-600">
            {contact.map((c) => <span key={c}>{c}</span>)}
            {links.map((l, i) => <span key={i}>{bare(l.url)}</span>)}
          </p>
        </header>

        {p.bio && (<><H>Summary</H><p className="text-neutral-800">{p.bio}</p></>)}

        {data.experiences.length > 0 && (
          <>
            <H>Experience</H>
            {data.experiences.map((e) => (
              <div key={e.id} className="mb-3 break-inside-avoid">
                <div className="flex justify-between gap-3">
                  <strong>{e.company}</strong>
                  {e.roles.length > 1 && e.tenure && <span className="text-neutral-500">{e.tenure}</span>}
                </div>
                {e.roles.map((r: Row, i: number) => (
                  <div key={i} className="mt-1">
                    <div className="flex justify-between gap-3">
                      <span className="font-medium">{r.title}</span>
                      <span className="whitespace-nowrap text-neutral-500">{range(r)}</span>
                    </div>
                    {r.summary && <p className="text-neutral-700">{r.summary}</p>}
                    {r.bullets?.length > 0 && (
                      <ul className="ml-5 list-disc text-neutral-700">{r.bullets.map((b: string, j: number) => <li key={j}>{b}</li>)}</ul>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </>
        )}

        {data.projects.length > 0 && (
          <>
            <H>Projects</H>
            {data.projects.map((x) => (
              <div key={x.id} className="mb-2 break-inside-avoid">
                <div className="flex justify-between gap-3">
                  <strong>{x.title}</strong>
                  <span className="text-neutral-500">{[x.role, x.year].filter(Boolean).join(" · ")}</span>
                </div>
                {x.summary && <p className="text-neutral-700">{x.summary}</p>}
                {x.tags?.length > 0 && <p className="text-neutral-500">{x.tags.join(" · ")}</p>}
              </div>
            ))}
          </>
        )}

        {groups.size > 0 && (
          <>
            <H>Skills</H>
            {[...groups].map(([cat, names]) => (
              <p key={cat} className="mb-0.5"><strong>{cat}: </strong><span className="text-neutral-700">{names.join(", ")}</span></p>
            ))}
          </>
        )}

        {data.education.length > 0 && (
          <>
            <H>Education</H>
            {data.education.map((e) => (
              <div key={e.id} className="mb-1.5 flex justify-between gap-3 break-inside-avoid">
                <span><strong>{e.degree}</strong>{e.institution ? ` · ${e.institution}` : ""}{e.grade ? ` · ${e.grade}` : ""}</span>
                <span className="whitespace-nowrap text-neutral-500">{[e.start_year, e.end_year].filter(Boolean).join(" – ")}</span>
              </div>
            ))}
          </>
        )}

        {data.achievements.length > 0 && (
          <>
            <H>Achievements</H>
            <ul className="ml-5 list-disc text-neutral-800">
              {data.achievements.map((a) => (
                <li key={a.id}>{a.title}{a.issuer ? `, ${a.issuer}` : ""}{a.year ? ` (${a.year})` : ""}</li>
              ))}
            </ul>
          </>
        )}
      </article>
    </div>
  );
}
