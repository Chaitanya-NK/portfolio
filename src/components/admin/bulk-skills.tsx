"use client";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { bulkCreateSkills } from "@/app/admin/(panel)/[entity]/bulk-actions";

type Row = { id: number; category: string; name: string; level: number };

const EXAMPLE = `Frontend: React 5, Next.js 4, TypeScript 4, Tailwind CSS 5
Backend: Node.js 4, PostgreSQL 3
DevOps | Docker | 3
DevOps | GitHub Actions | 4`;

function item(raw: string, defLevel: number) {
  const m = raw.trim().match(/^(.*?)(?:\s+([1-5]))?$/);
  const name = (m?.[1] ?? "").trim();
  return { name, level: m?.[2] ? Number(m[2]) : defLevel };
}

export function parseSkills(text: string, defCat: string, defLevel: number) {
  const out: Omit<Row, "id">[] = [];
  let current = defCat.trim();
  for (const line of text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean)) {
    if (line.includes("|")) {
      const [c, n, l] = line.split("|").map((x) => x.trim());
      const lv = Number(l);
      if (n) out.push({ category: c || current, name: n, level: lv >= 1 && lv <= 5 ? lv : defLevel });
      continue;
    }
    const colon = line.indexOf(":");
    if (colon > -1) {
      const cat = line.slice(0, colon).trim();
      const rest = line.slice(colon + 1).trim();
      if (cat) current = cat;
      if (!rest) continue;
      rest.split(",").forEach((r) => { const it = item(r, defLevel); if (it.name) out.push({ category: current, ...it }); });
      continue;
    }
    line.split(",").forEach((r) => { const it = item(r, defLevel); if (it.name) out.push({ category: current, ...it }); });
  }
  return out;
}

export function BulkSkills({ existing }: { existing: string[] }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [defCat, setDefCat] = useState("");
  const [defLevel, setDefLevel] = useState("3");
  const [rows, setRows] = useState<Row[]>([]);
  const [busy, setBusy] = useState(false);
  const key = (c: string, n: string) => `${c.trim().toLowerCase()}|${n.trim().toLowerCase()}`;
  const have = new Set(existing.map((e) => e.toLowerCase()));

  const preview = () => {
    const parsed = parseSkills(text, defCat, Number(defLevel));
    const missing = parsed.filter((p) => !p.category).length;
    setRows(parsed.map((p, i) => ({ id: i, ...p })));
    if (!parsed.length) toast.error("No skills found. Check the format below the box.");
    else if (missing) toast.error(`${missing} skill(s) have no category. Fill them in below or set a default category.`);
  };

  const patch = (id: number, p: Partial<Row>) => setRows((l) => l.map((r) => (r.id === id ? { ...r, ...p } : r)));
  const valid = (r: Row) => r.category.trim() && r.name.trim() && !have.has(key(r.category, r.name));
  const count = rows.filter(valid).length;

  const reset = () => { setText(""); setRows([]); setDefCat(""); setDefLevel("3"); };

  async function run() {
    setBusy(true);
    const r = await bulkCreateSkills(rows.filter(valid).map(({ category, name, level }) => ({ category, name, level })));
    setBusy(false);
    if (!r.ok) return toast.error(r.error ?? "Import failed");
    toast.success(`Imported ${r.created} skill${r.created === 1 ? "" : "s"}${r.skipped ? `, ${r.skipped} duplicate skipped` : ""}`);
    window.location.reload();
  }

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>Bulk import</Button>
      <Dialog open={open} onOpenChange={(o) => { if (!busy) { setOpen(o); if (!o) reset(); } }}>
        <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader><DialogTitle>Bulk import skills</DialogTitle></DialogHeader>

          <label className="flex flex-col gap-1 text-sm font-medium">
            Paste your skills
            <Textarea rows={6} value={text} onChange={(e) => setText(e.target.value)} placeholder={EXAMPLE} className="font-mono text-xs" />
          </label>

          <div className="rounded-lg bg-neutral-50 p-3 text-xs leading-relaxed text-neutral-600">
            <strong>Formats (mix them freely):</strong>
            <ul className="mt-1 list-disc space-y-0.5 pl-4">
              <li><code>Frontend: React 5, Next.js 4, TypeScript</code> category, then comma-separated skills with an optional level (1 to 5) after each name</li>
              <li><code>Frontend |  React | 5</code> one skill per line: category, name, level</li>
              <li>A line like <code>Backend:</code> on its own sets the category for the lines below it</li>
              <li>A skill with no level gets the default level. If a name ends in a number, like Python 3, add the level too: <code>Python 3 4</code></li>
            </ul>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-sm font-medium">
              Default category (optional)
              <Input value={defCat} onChange={(e) => setDefCat(e.target.value)} placeholder="Used when a line has no category" />
            </label>
            <div className="flex flex-col gap-1 text-sm font-medium">
              Default level
              <Select value={defLevel} onValueChange={(v) => v != null && setDefLevel(String(v))}>
                <SelectTrigger aria-label="Default level"><SelectValue /></SelectTrigger>
                <SelectContent>{["1", "2", "3", "4", "5"].map((l) => <SelectItem key={l} value={l}>{l} of 5</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>

          <div><Button type="button" variant="outline" onClick={preview} disabled={!text.trim()}>Preview skills</Button></div>

          {rows.length > 0 && (
            <div className="flex flex-col gap-2">
              {rows.map((r) => {
                const dup = r.category.trim() && r.name.trim() && have.has(key(r.category, r.name));
                return (
                  <div key={r.id} className={`flex flex-col gap-2 rounded-lg border p-2 sm:flex-row sm:items-center ${dup ? "opacity-60" : ""}`}>
                    <Input className="sm:w-40" value={r.category} onChange={(e) => patch(r.id, { category: e.target.value })} aria-label="Category" placeholder="Category" />
                    <Input className="sm:flex-1" value={r.name} onChange={(e) => patch(r.id, { name: e.target.value })} aria-label="Skill" placeholder="Skill" />
                    <Select value={String(r.level)} onValueChange={(v) => v != null && patch(r.id, { level: Number(v) })}>
                      <SelectTrigger className="sm:w-24" aria-label="Level"><SelectValue /></SelectTrigger>
                      <SelectContent>{[1, 2, 3, 4, 5].map((l) => <SelectItem key={l} value={String(l)}>{l} / 5</SelectItem>)}</SelectContent>
                    </Select>
                    <div className="flex items-center justify-between gap-2 sm:justify-end">
                      {dup && <Badge variant="secondary">Exists, skipped</Badge>}
                      <Button type="button" variant="ghost" size="sm" onClick={() => setRows((l) => l.filter((x) => x.id !== r.id))}>Remove</Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" disabled={busy} onClick={() => { setOpen(false); reset(); }}>Cancel</Button>
            <Button disabled={busy || count === 0} onClick={run}>{busy ? "Importing…" : `Import ${count} skill${count === 1 ? "" : "s"}`}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
