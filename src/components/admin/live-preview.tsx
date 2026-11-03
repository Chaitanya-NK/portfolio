"use client";

import { useState } from "react";
import { Moon, Sun } from "lucide-react";
import type { EntityConfig } from "@/lib/content-config";
import type { SiteData } from "@/lib/site/data";
import { Achievements, Education, Experience, Projects, Services, Skills, Testimonials, Tools } from "@/components/site/sections";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = Record<string, any>;

/** Entities that have a public card or list to preview. */
export const PREVIEWABLE = new Set(["tools", "skills", "experience", "education", "achievements", "projects", "services", "testimonials"]);

const num = (v: unknown) => (v === "" || v == null || Number.isNaN(Number(v)) ? null : Number(v));
const split = (v: unknown, sep: RegExp) => String(v ?? "").split(sep).map((x) => x.trim()).filter(Boolean);

/** Turn the form's draft values into the same shape the public site reads from the database. */
export function draftToRow(cfg: EntityConfig, values: Row, item: Row | null): Row {
  const row: Row = { ...(item ?? {}), id: item?.id ?? "draft", published: true };
  for (const f of cfg.fields) {
    const v = values[f.key];
    if (f.type === "tags") row[f.key] = split(v, /,/);
    else if (f.type === "lines") row[f.key] = split(v, /\r?\n/);
    else if (f.type === "number") row[f.key] = num(v);
    else if (f.type === "select" && f.numeric) row[f.key] = num(v) ?? 3;
    else if (f.type === "roles")
      row[f.key] = (v as Row[]).map((r) => ({
        title: r.title, start_date: r.start_date || null, end_date: r.end_date || null,
        is_current: Boolean(r.is_current), summary: r.summary, bullets: split(r.bullets, /\r?\n/),
      }));
    else if (f.type === "image") row[f.key] = v || null;
    else row[f.key] = v;
  }
  if (!row.slug) row.slug = "preview";
  return row;
}

const EMPTY = { sections: [], profile: {} } as unknown as SiteData;

function Body({ entity, row, siblings }: { entity: string; row: Row; siblings: Row[] }) {
  const swap = (list: Row[]) => (list.some((x) => x.id === row.id) ? list.map((x) => (x.id === row.id ? row : x)) : [...list, row]);
  switch (entity) {
    case "tools": return <Tools items={swap(siblings)} />;
    case "skills": {
      // show the draft among the skills that share its category, so the tabs and tiles look like the real thing
      const same = swap(siblings).filter((x) => x.category === row.category);
      return <Skills items={same.length ? same : [row]} projects={[]} experiences={[]} />;
    }
    case "experience": return <Experience items={[row]} />;
    case "education": return <Education items={[row]} />;
    case "achievements": return <Achievements items={[row]} />;
    case "projects": return <Projects items={[{ ...row, featured: false }]} />;
    case "services": return <Services items={[row]} d={EMPTY} />;
    case "testimonials": return <Testimonials items={[row]} />;
    default: return null;
  }
}

export function EntityPreview({ entity, cfg, values, item, siblings, accent }: {
  entity: string; cfg: EntityConfig; values: Row; item: Row | null; siblings: Row[]; accent: string;
}) {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const row = draftToRow(cfg, values, item);
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">Live preview</p>
        <button
          type="button" onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
          className="flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs text-neutral-600 hover:bg-neutral-50"
          aria-label={`Preview in ${theme === "dark" ? "light" : "dark"} mode`}
        >
          {theme === "dark" ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
          {theme === "dark" ? "Light" : "Dark"}
        </button>
      </div>
      <div
        data-theme={theme}
        className="site flow-root overflow-hidden rounded-xl border bg-[color:var(--bg)] p-5 text-[color:var(--fg)]"
        style={{ ["--accent" as string]: accent }}
      >
        <Body entity={entity} row={row} siblings={siblings} />
      </div>
      <p className="text-xs text-neutral-500">Updates as you type. Nothing is saved until you press Save.</p>
    </div>
  );
}
