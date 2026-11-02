"use client";

import { useState } from "react";

type Skill = { id: string; name: string; level: number };
const LEVELS = ["", "Beginner", "Basic", "Proficient", "Advanced", "Expert"];
const ln = "border-[color:var(--line)]";

function Bar({ n }: { n: number }) {
  return (
    <span role="img" aria-label={`${LEVELS[n] ?? "Level"} (${n} of 5)`} className="flex shrink-0 gap-[3px]">
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} className={`h-1 w-4 rounded-full ${i < n ? "bg-[var(--accent)]" : "bg-[color:var(--line2)]"}`} />
      ))}
    </span>
  );
}

/** Category tabs, tiles with level bars for the selected category. */
export function SkillsTabs({ groups }: { groups: { cat: string; list: Skill[] }[] }) {
  const [i, setI] = useState(0);
  const cur = groups[i] ?? groups[0];
  return (
    <div>
      <div role="tablist" aria-label="Skill categories" className={`-mx-1 mb-5 flex gap-1 overflow-x-auto border-b ${ln} px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden`}>
        {groups.map((g, k) => (
          <button key={g.cat} role="tab" type="button" aria-selected={k === i} onClick={() => setI(k)}
            className={`-mb-px shrink-0 whitespace-nowrap border-b-2 px-3 py-2.5 text-sm transition-colors ${k === i ? "border-[var(--accent)] font-medium text-[color:var(--fg)]" : "border-transparent text-[color:var(--muted)] hover:text-[color:var(--fg)]"}`}>
            {g.cat}<span className="ml-1.5 text-xs text-[color:var(--faint)]">{g.list.length}</span>
          </button>
        ))}
      </div>
      <ul role="tabpanel" className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
        {cur.list.map((s) => (
          <li key={s.id} className={`flex items-center justify-between gap-3 rounded-lg border ${ln} bg-[color:var(--surface)] px-4 py-3 text-sm`}>
            <span className="min-w-0 break-words">{s.name}</span>
            <Bar n={s.level} />
          </li>
        ))}
      </ul>
    </div>
  );
}
