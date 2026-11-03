"use client";

import { useRef, useState } from "react";
import { Award, Briefcase, ChevronDown, ChevronLeft, ChevronRight, GraduationCap, X } from "lucide-react";

export type JourneyRole = { title: string; range: string; summary?: string; bullets?: string[] };
export type JourneyEvent = {
  id: string;
  kind: "work" | "edu" | "award";
  when: string;
  title: string;
  org?: string;
  logo?: string | null;
  note?: string;
  roles?: JourneyRole[];
  summary?: string;
  bullets?: string[];
  tech?: string[];
};

const KIND = {
  work: { Icon: Briefcase, dot: "bg-[var(--accent)] text-[color:var(--on-accent)]", label: "Work" },
  edu: { Icon: GraduationCap, dot: "bg-sky-500 text-white", label: "Education" },
  award: { Icon: Award, dot: "bg-amber-500 text-white", label: "Achievement" },
} as const;

const ln = "border-[color:var(--line)]";
const muted = "text-[color:var(--muted)]";
const cap = "font-[family-name:var(--font-mono)] text-[0.6875rem] uppercase tracking-[0.1em] text-[color:var(--faint)]";

function Detail({ e, head = true }: { e: JourneyEvent; head?: boolean }) {
  const multi = (e.roles?.length ?? 0) > 1;
  return (
    <div className="flex flex-col gap-3">
      {head && (
        <div className="flex items-center gap-3">
          {e.logo && (
            <span className={`flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-md border ${ln} bg-white`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={e.logo} alt="" className="h-full w-full object-contain p-1" />
            </span>
          )}
          <div className="min-w-0">
            <h3 className="text-[0.9375rem] font-semibold tracking-tight">{e.title}</h3>
            {e.org && <p className={`text-sm ${muted}`}>{e.org}</p>}
          </div>
        </div>
      )}
      {e.note && <p className={`text-sm ${muted}`}>{e.note}</p>}
      {e.summary && <p className={`text-sm ${muted}`}>{e.summary}</p>}
      {e.bullets && e.bullets.length > 0 && (
        <ul className="flex list-disc flex-col gap-1 pl-4 text-sm text-[color:var(--fg2)] marker:text-[color:var(--faint)]">
          {e.bullets.map((b, i) => <li key={i}>{b}</li>)}
        </ul>
      )}
      {multi && (
        <ol className={`ml-1 flex flex-col gap-4 border-l ${ln} pl-5`}>
          {e.roles!.map((r, i) => (
            <li key={i} className="relative">
              <span aria-hidden className={`absolute -left-[1.56rem] top-1.5 h-2 w-2 rounded-full border-2 border-[color:var(--bg)] ${i === 0 ? "bg-[var(--accent)]" : "bg-[color:var(--line2)]"}`} />
              <div className="flex flex-wrap items-baseline justify-between gap-x-4">
                <h4 className="text-sm font-medium">{r.title}</h4>
                <span className={cap}>{r.range}</span>
              </div>
              {r.summary && <p className={`mt-1 text-sm ${muted}`}>{r.summary}</p>}
              {r.bullets && r.bullets.length > 0 && (
                <ul className="mt-1.5 flex list-disc flex-col gap-1 pl-4 text-sm text-[color:var(--fg2)] marker:text-[color:var(--faint)]">
                  {r.bullets.map((b, j) => <li key={j}>{b}</li>)}
                </ul>
              )}
            </li>
          ))}
        </ol>
      )}
      {e.tech && e.tech.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {e.tech.map((t) => (
            <span key={t} className={`inline-flex items-center rounded border ${ln} px-2 py-0.5 text-xs ${muted}`}>{t}</span>
          ))}
        </div>
      )}
    </div>
  );
}

export function Journey({ events }: { events: JourneyEvent[] }) {
  const [sel, setSel] = useState<number | null>(null); // nothing open until a visitor clicks
  const rail = useRef<HTMLDivElement>(null);
  const kinds = Array.from(new Set(events.map((e) => e.kind)));
  const cur = sel === null ? null : events[sel];
  const toggle = (i: number) => setSel((c) => (c === i ? null : i));
  const scroll = (dir: number) => rail.current?.scrollBy({ left: dir * 360, behavior: "smooth" });

  return (
    <div>
      <ul className="mb-5 flex flex-wrap gap-x-4 gap-y-1.5" aria-label="Legend">
        {kinds.map((k) => {
          const { Icon, dot, label } = KIND[k];
          return (
            <li key={k} className={`flex items-center gap-1.5 text-xs ${muted}`}>
              <span className={`flex h-4 w-4 items-center justify-center rounded-full ${dot}`}><Icon className="h-2.5 w-2.5" aria-hidden /></span>
              {label}
            </li>
          );
        })}
      </ul>

      {/* Desktop: horizontal rail, labels alternate above and below */}
      <div className="relative hidden md:block">
        <button type="button" onClick={() => scroll(-1)} aria-label="Scroll timeline left"
          className={`absolute -left-3 top-[8.5rem] z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border ${ln} bg-[color:var(--surface)] ${muted} hover:text-[color:var(--fg)]`}>
          <ChevronLeft className="h-4 w-4" aria-hidden />
        </button>
        <button type="button" onClick={() => scroll(1)} aria-label="Scroll timeline right"
          className={`absolute -right-3 top-[8.5rem] z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border ${ln} bg-[color:var(--surface)] ${muted} hover:text-[color:var(--fg)]`}>
          <ChevronRight className="h-4 w-4" aria-hidden />
        </button>
        <div ref={rail} className="overflow-x-auto px-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="relative flex h-[17rem]" style={{ width: `${events.length * 11}rem`, minWidth: "100%" }}>
            <span aria-hidden className={`absolute left-0 right-0 top-[8.5rem] h-px -translate-y-1/2 bg-[color:var(--line2)]`} />
            {events.map((e, i) => {
              const { Icon, dot } = KIND[e.kind];
              const above = i % 2 === 0;
              const on = i === sel;
              return (
                <div key={e.id} className="relative min-w-44 flex-1">
                  <button type="button" onClick={() => toggle(i)} aria-pressed={on}
                    aria-label={`${e.title}${e.org ? `, ${e.org}` : ""}, ${e.when}`}
                    className={`absolute left-1/2 top-[8.5rem] z-10 flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full ring-4 transition ${dot} ${on ? "scale-110 ring-[color:var(--line2)]" : i === 0 ? "scale-110 ring-[color:var(--accent)]/45" : "ring-[color:var(--bg)] hover:scale-105"}`}>
                    <Icon className="h-4 w-4" aria-hidden />
                  </button>
                  <div className={`absolute inset-x-2 text-center ${above ? "bottom-[calc(8.5rem+1.5rem)]" : "top-[calc(8.5rem+1.5rem)]"}`}>
                    <p className={cap}>{e.when}</p>
                    <p className={`mt-1 line-clamp-3 text-sm font-medium leading-snug ${on || i === 0 ? "" : "text-[color:var(--fg2)]"}`}>{e.title}</p>
                    {e.org && <p className={`mt-0.5 line-clamp-2 text-xs ${muted}`}>{e.org}</p>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        {cur && (
          <div className={`mt-6 rounded-lg border ${ln} bg-[color:var(--surface)] p-5`} aria-live="polite">
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className={cap}>{cur.when}</p>
              <button type="button" onClick={() => setSel(null)} aria-label="Close details" className={`-m-2 flex h-9 w-9 items-center justify-center rounded-full ${muted} hover:text-[color:var(--fg)]`}>
                <X className="h-4 w-4" aria-hidden />
              </button>
            </div>
            <Detail e={cur} />
          </div>
        )}
      </div>

      {/* Mobile: vertical timeline, tap an entry to open its details */}
      <ol className="md:hidden">
        {events.map((e, i) => {
          const { Icon, dot } = KIND[e.kind];
          return (
            <li key={e.id} className="relative flex gap-4 pb-7 last:pb-0">
              {i < events.length - 1 && <span aria-hidden className="absolute left-4 top-8 bottom-0 w-px -translate-x-1/2 bg-[color:var(--line2)]" />}
              <span className={`z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ring-4 ${i === 0 ? "ring-[color:var(--accent)]/45" : "ring-[color:var(--bg)]"} ${dot}`}><Icon className="h-4 w-4" aria-hidden /></span>
              <div className="min-w-0 flex-1">
                <button type="button" onClick={() => toggle(i)} aria-expanded={sel === i} className="block w-full min-h-8 text-left">
                  <span className={`${cap} block`}>{e.when}</span>
                  <span className={`mt-1 flex items-start justify-between gap-3 text-sm font-medium leading-snug ${i === 0 || sel === i ? "" : "text-[color:var(--fg2)]"}`}>
                    <span>{e.title}</span>
                    <ChevronDown aria-hidden className={`mt-0.5 h-4 w-4 shrink-0 transition-transform ${muted} ${sel === i ? "rotate-180" : ""}`} />
                  </span>
                  {e.org && <span className={`mt-0.5 block text-xs ${muted}`}>{e.org}</span>}
                </button>
                {sel === i && <div className={`mt-3 border-t ${ln} pt-3`}><Detail e={e} head={false} /></div>}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
