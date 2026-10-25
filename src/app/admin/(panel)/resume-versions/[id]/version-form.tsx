"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowDown, ArrowUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { roleKey } from "@/lib/roles";
import { saveVersion } from "../actions";

type Skill = { id: string; category: string; name: string };
type Exp = { id: string; company: string; roles: { title: string; bullets: string[] }[] };
type Proj = { id: string; title: string; featured: boolean };
type V = Record<string, any>;

const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40);
const pill = (on: boolean) =>
  `rounded-full border px-3 py-1.5 text-sm transition-colors ${on ? "border-neutral-900 bg-neutral-900 text-white" : "bg-white text-neutral-500 line-through hover:bg-neutral-50"}`;

export function VersionForm({ version, skills, experiences, projects }: {
  version: V | null; skills: Skill[]; experiences: Exp[]; projects: Proj[];
}) {
  const router = useRouter();
  const [id, setId] = useState<string | null>(version?.id ?? null);
  const [title, setTitle] = useState<string>(version?.title ?? "");
  const [slug, setSlug] = useState<string>(version?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(version));
  const [headline, setHeadline] = useState<string>(version?.headline ?? "");
  const [summary, setSummary] = useState<string>(version?.summary ?? "");
  const [published, setPublished] = useState<boolean>(version?.published ?? true);
  const [showAch, setShowAch] = useState<boolean>(version?.show_achievements ?? true);
  const [busy, setBusy] = useState(false);

  const allSkills = skills.map((s) => s.id);
  const allExps = experiences.map((e) => e.id);
  const [skillSel, setSkillSel] = useState<string[]>(version?.skill_ids?.length ? version.skill_ids : allSkills);
  const [expSel, setExpSel] = useState<string[]>(version?.experience_ids?.length ? version.experience_ids : allExps);
  const [projSel, setProjSel] = useState<string[]>(() => {
    if (version?.project_ids?.length) return version.project_ids.filter((x: string) => projects.some((p) => p.id === x));
    return [...projects].sort((a, b) => Number(b.featured) - Number(a.featured)).slice(0, 4).map((p) => p.id);
  });
  const [hi, setHi] = useState<Record<string, string>>(() =>
    Object.fromEntries(Object.entries((version?.highlights ?? {}) as Record<string, string[]>).map(([k, v]) => [k, v.join("\n")]))
  );

  const groups = useMemo(() => {
    const m = new Map<string, Skill[]>();
    skills.forEach((s) => m.set(s.category, [...(m.get(s.category) ?? []), s]));
    return [...m];
  }, [skills]);

  const toggle = (list: string[], set: (v: string[]) => void, x: string) => set(list.includes(x) ? list.filter((y) => y !== x) : [...list, x]);
  const moveProj = (i: number, d: number) => {
    const k = i + d;
    if (k < 0 || k >= projSel.length) return;
    const n = [...projSel];
    [n[i], n[k]] = [n[k], n[i]];
    setProjSel(n);
  };
  const projById = new Map(projects.map((p) => [p.id, p]));
  const unselected = projects.filter((p) => !projSel.includes(p.id));

  async function save() {
    if (!title.trim()) { toast.error("Give this version a name."); return; }
    setBusy(true);
    const highlights: Record<string, string[]> = {};
    for (const e of experiences) {
      if (!expSel.includes(e.id)) continue;
      for (const r of e.roles) {
        const lines = (hi[roleKey(e.id, r.title)] ?? "").split("\n").map((l) => l.trim()).filter(Boolean);
        if (lines.length) highlights[roleKey(e.id, r.title)] = lines;
      }
    }
    const r = await saveVersion(id, {
      title, slug: slug || slugify(title), headline, summary,
      skill_ids: skillSel.length === allSkills.length ? [] : skillSel,
      experience_ids: expSel.length === allExps.length ? [] : expSel,
      project_ids: projSel, highlights, show_achievements: showAch, published,
    });
    setBusy(false);
    if (!r.ok || !r.row) { toast.error(r.error ?? "Failed to save"); return; }
    toast.success("Saved");
    setSlug(r.row.slug);
    if (!id) { setId(r.row.id); router.replace(`/admin/resume-versions/${r.row.id}`); }
  }

  const url = slug ? `/resume/${slug}` : "";

  return (
    <div className="max-w-4xl">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <Link href="/admin/resume-versions" className="text-sm text-indigo-600 underline">← All versions</Link>
        <div className="flex items-center gap-2">
          {id && url && <a href={url} target="_blank" rel="noreferrer" className="inline-flex h-9 items-center rounded-md border px-3 text-sm hover:bg-neutral-50">Preview</a>}
          <Button onClick={save} disabled={busy}>{busy ? "Saving…" : "Save version"}</Button>
        </div>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader><CardTitle>Basics</CardTitle></CardHeader>
          <CardContent className="grid gap-4">
            <label className="flex flex-col gap-1 text-sm font-medium">Name (only you see this)
              <Input value={title} onChange={(e) => { setTitle(e.target.value); if (!slugTouched) setSlug(slugify(e.target.value)); }} placeholder="e.g. DevOps" />
            </label>
            <label className="flex flex-col gap-1 text-sm font-medium">Link
              <div className="flex items-center gap-2">
                <span className="text-sm font-normal text-neutral-500">/resume/</span>
                <Input value={slug} onChange={(e) => { setSlug(slugify(e.target.value)); setSlugTouched(true); }} placeholder="devops" />
              </div>
            </label>
            <div className="flex items-center justify-between rounded-lg border p-3 text-sm font-medium">
              Published (link works)
              <Switch checked={published} onCheckedChange={(c: boolean) => setPublished(c)} aria-label="Published" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Headline and summary</CardTitle></CardHeader>
          <CardContent className="grid gap-4">
            <label className="flex flex-col gap-1 text-sm font-medium">Headline (leave empty to use your profile’s)
              <Input value={headline} onChange={(e) => setHeadline(e.target.value)} placeholder="Release Engineer focused on CI/CD and cloud automation" />
            </label>
            <label className="flex flex-col gap-1 text-sm font-medium">Summary (leave empty to use your profile’s bio)
              <Textarea rows={4} value={summary} onChange={(e) => setSummary(e.target.value)} />
            </label>
            <div className="flex items-center justify-between rounded-lg border p-3 text-sm font-medium">
              Include achievements
              <Switch checked={showAch} onCheckedChange={(c: boolean) => setShowAch(c)} aria-label="Include achievements" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Skills</CardTitle></CardHeader>
          <CardContent className="grid gap-4">
            <p className="text-sm text-neutral-500">Everything starts selected. Click a skill to remove it from this version. {skillSel.length} of {allSkills.length} shown.</p>
            {groups.map(([cat, list]) => (
              <div key={cat} className="grid gap-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  {cat}
                  <button type="button" className="text-xs font-normal text-indigo-600 underline" onClick={() => setSkillSel((s) => [...new Set([...s, ...list.map((x) => x.id)])])}>all</button>
                  <button type="button" className="text-xs font-normal text-indigo-600 underline" onClick={() => setSkillSel((s) => s.filter((x) => !list.some((y) => y.id === x)))}>none</button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {list.map((s) => {
                    const on = skillSel.includes(s.id);
                    return <button key={s.id} type="button" aria-pressed={on} className={pill(on)} onClick={() => toggle(skillSel, setSkillSel, s.id)}>{s.name}</button>;
                  })}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Experience and highlights</CardTitle></CardHeader>
          <CardContent className="grid gap-4">
            <p className="text-sm text-neutral-500">Choose the companies to include, then rewrite the highlights for a role if you want different bullets in this version.</p>
            {experiences.map((e) => {
              const on = expSel.includes(e.id);
              return (
                <div key={e.id} className="rounded-lg border">
                  <label className="flex cursor-pointer items-center gap-3 p-3 text-sm font-medium">
                    <input type="checkbox" className="h-4 w-4" checked={on} onChange={() => toggle(expSel, setExpSel, e.id)} />
                    {e.company}
                  </label>
                  {on && (
                    <div className="grid gap-3 border-t bg-neutral-50 p-3">
                      {e.roles.map((r) => {
                        const k = roleKey(e.id, r.title);
                        return (
                          <label key={k} className="flex flex-col gap-1 text-sm font-medium">
                            {r.title}: highlights for this version
                            <Textarea rows={3} value={hi[k] ?? ""} onChange={(ev) => setHi((h) => ({ ...h, [k]: ev.target.value }))}
                              placeholder={r.bullets.length ? `Empty = default:\n${r.bullets.join("\n")}` : "One highlight per line"} />
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Projects</CardTitle></CardHeader>
          <CardContent className="grid gap-3">
            <p className="text-sm text-neutral-500">Up to 8, shown in this order. {projSel.length === 0 && "With none selected, your top four are used."}</p>
            {projSel.map((pid, i) => (
              <div key={pid} className="flex items-center gap-2 rounded-lg border p-2 text-sm">
                <input type="checkbox" className="h-4 w-4" checked onChange={() => setProjSel(projSel.filter((x) => x !== pid))} aria-label="Remove from this version" />
                <span className="min-w-0 flex-1 truncate font-medium">{projById.get(pid)?.title}</span>
                <Button type="button" variant="ghost" size="icon" disabled={i === 0} onClick={() => moveProj(i, -1)} aria-label="Move up"><ArrowUp className="h-4 w-4" /></Button>
                <Button type="button" variant="ghost" size="icon" disabled={i === projSel.length - 1} onClick={() => moveProj(i, 1)} aria-label="Move down"><ArrowDown className="h-4 w-4" /></Button>
              </div>
            ))}
            {unselected.map((p) => (
              <label key={p.id} className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed p-2 text-sm text-neutral-500">
                <input type="checkbox" className="h-4 w-4" checked={false} disabled={projSel.length >= 8} onChange={() => setProjSel([...projSel, p.id])} />
                {p.title}
              </label>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
