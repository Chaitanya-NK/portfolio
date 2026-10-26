"use client";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { guardUpload } from "@/lib/upload-guard";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { bulkCreateTools } from "@/app/admin/(panel)/[entity]/bulk-actions";
import { uploadFiles } from "@/lib/upload-store";

type Draft = { id: string; file: File; name: string; category: string; preview: string };

const OK_TYPES = ["image/svg+xml", "image/png", "image/webp", "image/jpeg"];
const MAX_FILES = 100;
const MAX_BYTES = 1024 * 1024;

const words = (s: string) =>
  s.replace(/[-_]+/g, " ").replace(/\s+/g, " ").trim()
    .split(" ").map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w)).join(" ");

// "Frontend__React.svg" -> category Frontend, name React.  "next-js.svg" -> Next Js
export function parseName(filename: string, defaultCategory: string) {
  const base = filename.replace(/\.[^.]+$/, "");
  if (base.includes("__")) {
    const [cat, ...rest] = base.split("__");
    return { name: words(rest.join(" ")), category: words(cat) };
  }
  return { name: words(base), category: defaultCategory };
}

export function BulkTools({ existing }: { existing: string[] }) {
  const [open, setOpen] = useState(false);
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [defCat, setDefCat] = useState("");
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [drag, setDrag] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const have = new Set(existing.map((e) => e.toLowerCase()));

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
        id: `${file.name}-${file.size}-${Math.random().toString(36).slice(2, 7)}`,
        file, ...parseName(file.name, defCat), preview: URL.createObjectURL(file),
      });
    }
    setDrafts((d) => [...d, ...incoming].slice(0, MAX_FILES));
    if (problems.length) toast.error(`Skipped ${problems.length}: ${problems.slice(0, 3).join("; ")}${problems.length > 3 ? "…" : ""}`);
  }

  const patch = (id: string, k: "name" | "category", v: string) =>
    setDrafts((d) => d.map((x) => (x.id === id ? { ...x, [k]: v } : x)));

  const applyDefault = (v: string) => {
    setDefCat(v);
    setDrafts((d) => d.map((x) => (x.file.name.includes("__") ? x : { ...x, category: v })));
  };

  const reset = () => { setDrafts([]); setProgress(0); setDefCat(""); };

  async function run() {
    const todo = drafts.filter((d) => d.name.trim() && !have.has(d.name.trim().toLowerCase()));
    if (!todo.length) return toast.error("Nothing new to import");
    setBusy(true); setProgress(0);
    const ups = await uploadFiles(todo.map((d) => d.file), { folder: "tools", accept: ["image/svg+xml", "image/png", "image/webp", "image/jpeg"], maxMB: 1 });
    const rows = ups.map((u) => ({ name: todo[u.index].name, category: todo[u.index].category, icon_url: u.url }));
    const failedUploads = todo.length - rows.length;
    const r = await bulkCreateTools(rows);
    setBusy(false);
    if (!r.ok) return toast.error(r.error ?? "Import failed");
    toast.success(`Imported ${r.created} tool${r.created === 1 ? "" : "s"}${r.skipped ? `, ${r.skipped} duplicate skipped` : ""}${failedUploads ? `, ${failedUploads} upload failed` : ""}`);
    window.location.reload();
  }

  const newCount = drafts.filter((d) => d.name.trim() && !have.has(d.name.trim().toLowerCase())).length;

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>Bulk import</Button>
      <Dialog open={open} onOpenChange={(o) => { if (!busy) { setOpen(o); if (!o) reset(); } }}>
        <DialogContent {...guardUpload} className="max-h-[92dvh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader><DialogTitle>Bulk import tools</DialogTitle></DialogHeader>

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
            <p className="text-xs text-neutral-500">SVG, PNG, WebP or JPG · up to 1 MB each · up to {MAX_FILES} at a time</p>
          </div>

          <div className="rounded-lg bg-neutral-50 p-3 text-xs text-neutral-600">
            <strong>Naming:</strong> <code>React.svg</code> → React · <code>Visual-Studio-Code.svg</code> → Visual Studio Code ·
            <code> Frontend__React.svg</code> → category Frontend, name React. You can edit everything below before importing.
          </div>

          <label className="flex flex-col gap-1 text-sm font-medium">
            Default category (used for files without a category prefix)
            <Input value={defCat} onChange={(e) => applyDefault(e.target.value)} placeholder="e.g. Frontend" />
          </label>

          {drafts.length > 0 && (
            <div className="flex flex-col gap-2">
              {drafts.map((d) => {
                const dup = have.has(d.name.trim().toLowerCase());
                return (
                  <div key={d.id} className={`flex flex-col gap-2 rounded-lg border p-2 sm:flex-row sm:items-center ${dup ? "opacity-60" : ""}`}>
                    <div className="flex items-center gap-2">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={d.preview} alt="" className="h-10 w-10 shrink-0 rounded-md border bg-neutral-100 object-contain p-1" />
                      <span className="min-w-0 flex-1 truncate text-xs text-neutral-500 sm:hidden">{d.file.name}</span>
                    </div>
                    <Input className="sm:flex-1" value={d.name} onChange={(e) => patch(d.id, "name", e.target.value)} aria-label="Tool name" placeholder="Name" />
                    <Input className="sm:w-40" value={d.category} onChange={(e) => patch(d.id, "category", e.target.value)} aria-label="Category" placeholder="Category" />
                    <div className="flex items-center justify-between gap-2 sm:justify-end">
                      {dup && <Badge variant="secondary">Exists, skipped</Badge>}
                      <Button type="button" variant="ghost" size="sm" onClick={() => setDrafts((l) => l.filter((x) => x.id !== d.id))}>Remove</Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <DialogFooter className="gap-2">
            {busy && <span className="mr-auto self-center text-sm text-neutral-500">Uploading {progress} of {newCount}…</span>}
            <Button variant="outline" disabled={busy} onClick={() => { setOpen(false); reset(); }}>Cancel</Button>
            <Button disabled={busy || newCount === 0} onClick={run}>
              {busy ? "Importing…" : `Import ${newCount} tool${newCount === 1 ? "" : "s"}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
