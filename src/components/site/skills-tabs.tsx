"use client";

import { useState } from "react";
import { FolderOpen, X } from "lucide-react";
import type { SkillUse } from "@/lib/site/skills";

type Skill = { id: string; name: string; level: number; icon?: string | null };
const LEVELS = ["", "Beginner", "Basic", "Proficient", "Advanced", "Expert"];
const ln = "border-[color:var(--line)]";
const muted = "text-[color:var(--muted)]";

function Bar({ n }: { n: number }) {
  return (
    <span role="img" aria-label={`${LEVELS[n] ?? "Level"} (${n} of 5)`} className="flex shrink-0 gap-[3px]">
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} className={`h-1 w-4 rounded-full ${i < n ? "bg-[var(--accent)]" : "bg-[color:var(--line2)]"}`} />
      ))}
    </span>
  );
}

function Mark({ s }: { s: Skill }) {
  return (
    <span className="flex h-6 w-6 shrink-0 items-center justify-center overflow-hidden rounded border border-black/5 bg-white">
      {s.icon ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={s.icon} alt="" loading="lazy" className="h-full w-full object-contain p-0.5" />
      ) : (
        <span className="text-[0.6875rem] font-semibold text-neutral-500">{s.name.slice(0, 1)}</span>
      )}
    </span>
  );
}

/** Category tabs; tiles show the icon and level, and a tile that has matching projects or jobs opens them on click. */
export function SkillsTabs({ groups, usage }: { groups: { cat: string; list: Skill[] }[]; usage: Record<string, SkillUse> }) {
  const [i, setI] = useState(0);
  const [open, setOpen] = useState<string | null>(null);
  const cur = groups[i] ?? groups[0];
  const openSkill = cur.list.find((s) => s.id === open) ?? null;
  const use = openSkill ? usage[openSkill.id] : null;

  return (
    <div className="@container">
      <div role="tablist" aria-label="Skill categories" className={`-mx-1 mb-5 flex gap-1 overflow-x-auto border-b ${ln} px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden`}>
        {groups.map((g, k) => (
          <button key={g.cat} role="tab" type="button" aria-selected={k === i} onClick={() => { setI(k); setOpen(null); }}
            className={`-mb-px shrink-0 whitespace-nowrap border-b-2 px-3 py-2.5 text-sm transition-colors ${k === i ? "border-[var(--accent)] font-medium text-[color:var(--fg)]" : "border-transparent text-[color:var(--muted)] hover:text-[color:var(--fg)]"}`}>
            {g.cat}<span className="ml-1.5 text-xs text-[color:var(--faint)]">{g.list.length}</span>
          </button>
        ))}
      </div>

      <ul role="tabpanel" className="grid gap-2.5 @lg:grid-cols-2 @3xl:grid-cols-3">
        {cur.list.map((s) => {
          const u = usage[s.id];
          const n = u ? u.projects.length + u.roles.length : 0;
          const body = (
            <>
              <Mark s={s} />
              <span className="min-w-0 flex-1 break-words text-left">{s.name}</span>
              {n > 0 && (
                <span className={`flex shrink-0 items-center gap-1 text-xs tabular-nums ${muted}`} title={`${n} project${n === 1 ? "" : "s"} or role${n === 1 ? "" : "s"}`}>
                  <FolderOpen className="h-3.5 w-3.5" aria-hidden />{n}
                </span>
              )}
              <Bar n={s.level} />
            </>
          );
          const cls = `flex w-full items-center gap-3 rounded-lg border ${ln} bg-[color:var(--surface)] px-3.5 py-3 text-sm`;
          return (
            <li key={s.id}>
              {n > 0 ? (
                <button type="button" aria-expanded={open === s.id} onClick={() => setOpen(open === s.id ? null : s.id)}
                  className={`${cls} transition-colors hover:border-[color:var(--line2)] ${open === s.id ? "border-[var(--accent)]" : ""}`}>
                  {body}
                </button>
              ) : (
                <div className={cls}>{body}</div>
              )}
            </li>
          );
        })}
      </ul>

      {openSkill && use && (
        <div className={`tl-pop mt-4 rounded-lg border ${ln} bg-[color:var(--surface)] p-5`} aria-live="polite">
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="flex items-center gap-2 text-sm font-medium"><Mark s={openSkill} />{openSkill.name} <span className={`font-normal ${muted}`}>· where I used it</span></p>
            <button type="button" onClick={() => setOpen(null)} aria-label="Close" className={`-m-2 flex h-9 w-9 items-center justify-center rounded-full ${muted} hover:text-[color:var(--fg)]`}>
              <X className="h-4 w-4" aria-hidden />
            </button>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            {use.projects.length > 0 && (
              <div>
                <p className="mb-2 font-[family-name:var(--font-mono)] text-[0.6875rem] uppercase tracking-[0.1em] text-[color:var(--faint)]">Projects</p>
                <ul className="flex flex-col gap-1.5 text-sm">
                  {use.projects.map((p) => (
                    <li key={p.href}><a href={p.href} className="underline decoration-[color:var(--line2)] underline-offset-4 hover:text-[color:var(--accent-ink)]">{p.title}</a>{p.year ? <span className={muted}> · {p.year}</span> : null}</li>
                  ))}
                </ul>
              </div>
            )}
            {use.roles.length > 0 && (
              <div>
                <p className="mb-2 font-[family-name:var(--font-mono)] text-[0.6875rem] uppercase tracking-[0.1em] text-[color:var(--faint)]">Work</p>
                <ul className="flex flex-col gap-1.5 text-sm">
                  {use.roles.map((r, k) => <li key={k}>{r.title}<span className={muted}> · {r.org}</span></li>)}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
