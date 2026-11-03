"use client";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { guardUpload } from "@/lib/upload-guard";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { bulkSetSkillIcons } from "@/app/admin/(panel)/[entity]/bulk-actions";
import { uploadFiles } from "@/lib/upload-store";

type Skill = { id: string; name: string; category: string; icon_url?: string | null };
type Draft = { key: string; file: File; preview: string; skillId: string };

const OK_TYPES = ["image/svg+xml", "image/png", "image/webp", "image/jpeg"];
const MAX_BYTES = 1024 * 1024;
const NONE = "none";

// "C#" -> "csharp", "Next.js" -> "nextjs", "Material UI" -> "materialui"
export const norm = (s: string) =>
  s.toLowerCase().replace(/#/g, "sharp").replace(/\+/g, "plus").replace(/[^a-z0-9]/g, "");

// file names that differ from the skill name
const ALIAS: Record<string, string> = {
  vitejs: "vite", vue: "vuejs", tailwind: "tailwindcss", dotnet: "net", mssql: "mssqlserver",
  appsscript: "googleappsscript", node: "nodejs", gcp: "googlecloud", js: "javascript", ts: "typescript",
};

export function matchSkill(filename: string, skills: Skill[]): string {
  const base = norm(filename.replace(/\.[^.]+$/, ""));
  const want = ALIAS[base] ?? base;
  return skills.find((s) => norm(s.name) === want)?.id ?? NONE;
}

export function BulkSkillIcons({ skills }: { skills: Skill[] }) {
  const [open, setOpen] = useState(false);
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [busy, setBusy] = useState(false);
  const [drag, setDrag] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const byId = new Map(skills.map((s) => [s.id, s]));

  async function addFiles(list: FileList | File[]) {
    const incoming: Draft[] = [];
    const problems: string[] = [];
    for (const file of Array.from(list)) {
      if (!OK_TYPES.includes(file.type)) { problems.push(`${file.name}: unsupported type`); continue; }
      if (file.size > MAX_BYTES) { problems.push(`${file.name}: over 1 MB`); continue; }
      if (file.type === "image/svg+xml") {
        const text = await file.text();
        if (/<script|\son\w+\s*=|javascript:/i.test(text)) { problems.push(`${file.name}: SVG contains scripts`); continue; }
      }
      incoming.push({
        key: `${file.name}-${file.size}-${Math.random().toString(36).slice(2, 7)}`,
        file, preview: URL.createObjectURL(file), skillId: matchSkill(file.name, skills),
      });
    }
    setDrafts((d) => [...d, ...incoming].slice(0, 100));
    if (problems.length) toast.error(`Skipped ${problems.length}: ${problems.slice(0, 3).join("; ")}${problems.length > 3 ? "…" : ""}`);
  }

  const todo = drafts.filter((d) => d.skillId !== NONE);
  const reset = () => setDrafts([]);

  async function run() {
    setBusy(true);
    // if two files point at the same skill, the later one wins
    const last = new Map<string, Draft>();
    todo.forEach((d) => last.set(d.skillId, d));
    const picked = [...last.values()];
    const ups = await uploadFiles(picked.map((d) => d.file), { folder: "skills", accept: OK_TYPES, maxMB: 1 });
    const rows = ups.map((u) => ({ id: picked[u.index].skillId, icon_url: u.url }));
    const failed = picked.length - rows.length;
    const r = rows.length ? await bulkSetSkillIcons(rows) : { ok: false, error: "No uploads succeeded" };
    setBusy(false);
    if (!r.ok) return toast.error(r.error ?? "Update failed");
    toast.success(`Added ${rows.length} icon${rows.length === 1 ? "" : "s"}${failed ? `, ${failed} upload failed` : ""}`);
    window.location.reload();
  }

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>Bulk icons</Button>
      <Dialog open={open} onOpenChange={(o) => { if (!busy) { setOpen(o); if (!o) reset(); } }}>
        <DialogContent {...guardUpload} className="max-h-[92dvh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader><DialogTitle>Bulk add skill icons</DialogTitle></DialogHeader>

          <input ref={inputRef} type="file" multiple accept=".svg,.png,.webp,.jpg,.jpeg,image/svg+xml,image/png,image/webp,image/jpeg"
            className="hidden" onChange={(e) => { if (e.target.files) addFiles(e.target.files); e.target.value = ""; }} />
          <div
            onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
            onDragLeave={() => setDrag(false)}
            onDrop={(e) => { e.preventDefault(); setDrag(false); addFiles(e.dataTransfer.files); }}
            className={`flex flex-col items-center gap-2 rounded-xl border-2 border-dashed p-6 text-center text-sm ${drag ? "border-indigo-500 bg-indigo-50" : ""}`}
          >
            <p className="font-medium">Drop icon files here, or</p>
            <Button type="button" variant="outline" size="sm" onClick={() => inputRef.current?.click()}>Choose files</Button>
            <p className="text-xs text-neutral-500">SVG, PNG, WebP or JPG · up to 1 MB each · up to 100 at a time</p>
          </div>

          <div className="rounded-lg bg-neutral-50 p-3 text-xs text-neutral-600">
            Each file is matched to the skill with the same name, ignoring case and punctuation: <code>react.svg</code> → React,
            <code> nextJS.svg</code> → Next.js, <code>csharp.svg</code> → C#. Check each match below and change it if needed.
            Unmatched files are skipped.
          </div>

          {drafts.length > 0 && (
            <div className="flex flex-col gap-2">
              {drafts.map((d) => {
                const sk = byId.get(d.skillId);
                return (
                  <div key={d.key} className={`flex flex-col gap-2 rounded-lg border p-2 sm:flex-row sm:items-center ${d.skillId === NONE ? "opacity-60" : ""}`}>
                    <div className="flex items-center gap-2 sm:w-48">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={d.preview} alt="" className="h-10 w-10 shrink-0 rounded-md border bg-neutral-100 object-contain p-1" />
                      <span className="min-w-0 flex-1 truncate text-xs text-neutral-500">{d.file.name}</span>
                    </div>
                    <div className="sm:flex-1">
                      <Select value={d.skillId} onValueChange={(v) => v != null && setDrafts((l) => l.map((x) => (x.key === d.key ? { ...x, skillId: String(v) } : x)))}>
                        <SelectTrigger aria-label="Skill for this icon"><SelectValue>{sk ? `${sk.name} · ${sk.category}` : "No match, skip"}</SelectValue></SelectTrigger>
                        <SelectContent>
                          <SelectItem value={NONE}>No match, skip</SelectItem>
                          {skills.map((s) => <SelectItem key={s.id} value={s.id}>{s.name} · {s.category}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center justify-between gap-2 sm:justify-end">
                      {sk?.icon_url && <Badge variant="secondary">Replaces icon</Badge>}
                      <Button type="button" variant="ghost" size="sm" onClick={() => setDrafts((l) => l.filter((x) => x.key !== d.key))}>Remove</Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" disabled={busy} onClick={() => { setOpen(false); reset(); }}>Cancel</Button>
            <Button disabled={busy || todo.length === 0} onClick={run}>
              {busy ? "Uploading…" : `Add ${todo.length} icon${todo.length === 1 ? "" : "s"}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
