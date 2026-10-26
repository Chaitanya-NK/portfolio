"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import { Copy, ExternalLink, FileText, LayoutGrid, List, Search, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { deleteMediaMany } from "./actions";
import { uploadFiles } from "@/lib/upload-store";

type F = { path: string; name: string; folder: string; url: string; size: number; at: string; used: boolean };
type View = "grid" | "list";

const isImg = (n: string) => /\.(png|jpe?g|webp|gif|svg|avif)$/i.test(n);
const clean = (f: F) => f.name.replace(/^\d{10,}-/, "").replace(f.folder === "tools" ? /^[a-z0-9]{5}-/ : /^$/, "");
const bytes = (n: number) => (n < 1024 ? `${n} B` : n < 1048576 ? `${(n / 1024).toFixed(0)} KB` : `${(n / 1048576).toFixed(1)} MB`);
const when = (s: string) => (s ? format(new Date(s), "dd MMM yyyy") : "");

function Thumb({ f, className }: { f: F; className: string }) {
  return isImg(f.name) ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={f.url} alt="" loading="lazy" className={`${className} object-contain`} />
  ) : (
    <span className={`${className} flex items-center justify-center text-neutral-400`}><FileText className="h-1/2 w-1/2" /></span>
  );
}

export function Library({ initial }: { initial: F[] }) {
  const [files, setFiles] = useState(initial);
  const [view, setView] = useState<View>("grid");
  const [q, setQ] = useState("");
  const [folder, setFolder] = useState("all");
  const [sort, setSort] = useState("new");
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [preview, setPreview] = useState<F | null>(null);
  const [confirm, setConfirm] = useState<F[] | null>(null);
  const [busy, setBusy] = useState(false);
  const pickRef = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);

  async function addFiles(list: File[]) {
    if (!list.length) return;
    await uploadFiles(list, {
      folder: "uploads", maxMB: 50, accept: ["image/*", "video/*", "audio/*", "application/pdf"],
      onEach: (u) => setFiles((l) => [{ path: u.path, name: u.path.split("/").pop() ?? u.name, folder: "uploads", url: u.url, size: u.size, at: new Date().toISOString(), used: false }, ...l]),
    });
  }

  useEffect(() => {
    const v = localStorage.getItem("media-view");
    if (v === "grid" || v === "list") setView(v);
  }, []);
  const changeView = (v: View) => { setView(v); localStorage.setItem("media-view", v); };

  const folders = useMemo(() => [...new Set(files.map((f) => f.folder))].sort(), [files]);
  const list = useMemo(() => {
    const x = files.filter((f) =>
      (folder === "all" || f.folder === folder) && (!q || clean(f).toLowerCase().includes(q.toLowerCase())));
    const by: Record<string, (a: F, b: F) => number> = {
      new: (a, b) => b.at.localeCompare(a.at),
      old: (a, b) => a.at.localeCompare(b.at),
      name: (a, b) => clean(a).localeCompare(clean(b)),
      size: (a, b) => b.size - a.size,
    };
    return [...x].sort(by[sort]);
  }, [files, folder, q, sort]);

  const toggle = (p: string) => setSel((s) => { const n = new Set(s); n.has(p) ? n.delete(p) : n.add(p); return n; });
  const allOn = list.length > 0 && list.every((f) => sel.has(f.path));
  const copy = (u: string) => { navigator.clipboard.writeText(u); toast.success("URL copied"); };
  const total = files.reduce((a, f) => a + f.size, 0);

  async function remove(items: F[]) {
    setBusy(true);
    const r = await deleteMediaMany(items.map((i) => i.path));
    setBusy(false);
    setConfirm(null);
    if (!r.ok) return toast.error(r.error ?? "Failed");
    const gone = new Set(items.map((i) => i.path));
    setFiles((l) => l.filter((f) => !gone.has(f.path)));
    setSel(new Set());
    setPreview(null);
    toast.success(`Deleted ${items.length} file${items.length === 1 ? "" : "s"}`);
  }

  const seg = (on: boolean) =>
    `inline-flex h-9 w-9 items-center justify-center rounded-md transition-colors ${on ? "bg-neutral-900 text-white" : "text-neutral-600 hover:bg-neutral-100"}`;
  const selected = files.filter((f) => sel.has(f.path));
  const usedInSel = selected.filter((f) => f.used).length;

  return (
    <div
      className={`flex flex-col gap-4 rounded-xl ${drag ? "ring-2 ring-indigo-400 ring-offset-4" : ""}`}
      onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
      onDragLeave={(e) => { if (e.currentTarget === e.target) setDrag(false); }}
      onDrop={(e) => { e.preventDefault(); setDrag(false); addFiles(Array.from(e.dataTransfer.files)); }}
    >
      <input ref={pickRef} type="file" multiple className="hidden" accept="image/*,video/*,audio/*,application/pdf"
        onChange={(e) => { const f = Array.from(e.target.files ?? []); e.target.value = ""; addFiles(f); }} />
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-dashed bg-white p-3">
        <Button size="sm" onClick={() => pickRef.current?.click()}><Upload className="mr-1.5 h-4 w-4" />Upload files</Button>
        <span className="text-sm text-neutral-500">or drop images, videos, audio and PDFs anywhere on this page (up to 50 MB each).</span>
      </div>
      <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
        <div className="relative lg:max-w-xs lg:flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <Input className="pl-9" placeholder="Search files…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search files" />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={folder} onValueChange={(v) => v != null && setFolder(String(v))}>
            <SelectTrigger className="w-36" aria-label="Folder"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All folders</SelectItem>
              {folders.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={sort} onValueChange={(v) => v != null && setSort(String(v))}>
            <SelectTrigger className="w-36" aria-label="Sort"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="new">Newest first</SelectItem>
              <SelectItem value="old">Oldest first</SelectItem>
              <SelectItem value="name">Name A–Z</SelectItem>
              <SelectItem value="size">Largest first</SelectItem>
            </SelectContent>
          </Select>
          <div className="ml-auto flex gap-1 rounded-lg border bg-white p-1 lg:ml-0">
            <button className={seg(view === "grid")} onClick={() => changeView("grid")} aria-label="Grid view" aria-pressed={view === "grid"}><LayoutGrid className="h-4 w-4" /></button>
            <button className={seg(view === "list")} onClick={() => changeView("list")} aria-label="List view" aria-pressed={view === "list"}><List className="h-4 w-4" /></button>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 text-sm text-neutral-600">
        <label className="flex items-center gap-2">
          <input type="checkbox" className="h-4 w-4" checked={allOn} onChange={() => setSel(allOn ? new Set() : new Set(list.map((f) => f.path)))} aria-label="Select all shown" />
          {sel.size ? `${sel.size} selected` : `${list.length} file${list.length === 1 ? "" : "s"} · ${bytes(list.reduce((a, f) => a + f.size, 0))}`}
        </label>
        {sel.size > 0 && (
          <>
            <Button variant="destructive" size="sm" onClick={() => setConfirm(selected)}><Trash2 className="mr-1 h-4 w-4" />Delete selected</Button>
            <Button variant="ghost" size="sm" onClick={() => setSel(new Set())}>Clear</Button>
          </>
        )}
        {!sel.size && <span className="ml-auto hidden text-xs sm:inline">Total library: {files.length} files · {bytes(total)}</span>}
      </div>

      {list.length === 0 && <p className="rounded-xl border border-dashed p-8 text-center text-sm text-neutral-500">{files.length ? "No files match your filters." : "No files uploaded yet."}</p>}

      {view === "grid" ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 min-[1700px]:grid-cols-8 min-[2200px]:grid-cols-10">
          {list.map((f) => (
            <div key={f.path} className={`group relative flex flex-col overflow-hidden rounded-lg border bg-white ${sel.has(f.path) ? "ring-2 ring-indigo-500" : ""}`}>
              <input type="checkbox" checked={sel.has(f.path)} onChange={() => toggle(f.path)} aria-label={`Select ${clean(f)}`}
                className="absolute left-2 top-2 z-10 h-4 w-4" />
              {f.used && <Badge className="absolute right-1.5 top-1.5 z-10 h-5 px-1.5 text-[10px]">In use</Badge>}
              <button onClick={() => setPreview(f)} className="aspect-square w-full bg-neutral-100" aria-label={`Preview ${clean(f)}`}>
                <Thumb f={f} className="h-full w-full p-3" />
              </button>
              <div className="flex flex-col gap-0.5 p-2">
                <div className="truncate text-xs font-medium" title={clean(f)}>{clean(f)}</div>
                <div className="truncate text-[11px] text-neutral-500">{f.folder} · {bytes(f.size)}</div>
                <div className="mt-1 flex gap-1">
                  <Button variant="outline" size="sm" className="h-7 flex-1 px-2 text-xs" onClick={() => copy(f.url)}>Copy URL</Button>
                  <Button variant="ghost" size="sm" className="h-7 px-2" aria-label="Delete" onClick={() => setConfirm([f])}><Trash2 className="h-3.5 w-3.5" /></Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-1.5">
          {list.map((f) => (
            <div key={f.path} className={`flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border bg-white p-2 ${sel.has(f.path) ? "ring-2 ring-indigo-500" : ""}`}>
              <input type="checkbox" checked={sel.has(f.path)} onChange={() => toggle(f.path)} aria-label={`Select ${clean(f)}`} className="h-4 w-4" />
              <button onClick={() => setPreview(f)} className="h-10 w-10 shrink-0 overflow-hidden rounded-md border bg-neutral-100" aria-label={`Preview ${clean(f)}`}>
                <Thumb f={f} className="h-full w-full p-1" />
              </button>
              <div className="min-w-0 flex-1 basis-40">
                <div className="truncate text-sm font-medium" title={clean(f)}>{clean(f)}</div>
                <div className="truncate text-xs text-neutral-500 sm:hidden">{f.folder} · {bytes(f.size)}</div>
              </div>
              <span className="hidden w-24 truncate text-xs text-neutral-500 sm:block">{f.folder}</span>
              <span className="hidden w-16 text-right text-xs text-neutral-500 sm:block">{bytes(f.size)}</span>
              <span suppressHydrationWarning className="hidden w-24 text-right text-xs text-neutral-500 md:block">{when(f.at)}</span>
              {f.used ? <Badge className="h-5 px-1.5 text-[10px]">In use</Badge> : <span className="hidden w-12 sm:block" />}
              <div className="ml-auto flex gap-1">
                <Button variant="outline" size="sm" className="h-8 px-2" onClick={() => copy(f.url)} aria-label="Copy URL"><Copy className="h-3.5 w-3.5" /></Button>
                <Button variant="ghost" size="sm" className="h-8 px-2" aria-label="Delete" onClick={() => setConfirm([f])}><Trash2 className="h-3.5 w-3.5" /></Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={!!preview} onOpenChange={(o) => !o && setPreview(null)}>
        <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-xl">
          <DialogHeader><DialogTitle className="truncate pr-6">{preview && clean(preview)}</DialogTitle></DialogHeader>
          {preview && (
            <div className="flex flex-col gap-3">
              <div className="flex max-h-[50dvh] min-h-40 items-center justify-center overflow-hidden rounded-lg border bg-neutral-100">
                {isImg(preview.name)
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={preview.url} alt="" className="max-h-[50dvh] max-w-full object-contain" />
                  : <FileText className="h-16 w-16 text-neutral-400" />}
              </div>
              <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
                <dt className="text-neutral-500">Folder</dt><dd>{preview.folder}</dd>
                <dt className="text-neutral-500">Size</dt><dd>{bytes(preview.size)}</dd>
                <dt className="text-neutral-500">Uploaded</dt><dd suppressHydrationWarning>{when(preview.at)}</dd>
                <dt className="text-neutral-500">Status</dt><dd>{preview.used ? "In use on the site" : "Not used anywhere"}</dd>
              </dl>
              <code className="break-all rounded bg-neutral-100 px-2 py-1 text-xs">{preview.url}</code>
            </div>
          )}
          <DialogFooter className="gap-2">
            <a href={preview?.url} target="_blank" rel="noreferrer" className="inline-flex h-9 items-center gap-1 rounded-md border px-3 text-sm hover:bg-neutral-50"><ExternalLink className="h-4 w-4" />Open</a>
            <Button variant="outline" onClick={() => preview && copy(preview.url)}>Copy URL</Button>
            <Button variant="destructive" onClick={() => preview && setConfirm([preview])}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!confirm} onOpenChange={(o) => !o && !busy && setConfirm(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Delete {confirm?.length === 1 ? "this file" : `${confirm?.length} files`}?</DialogTitle></DialogHeader>
          <p className="text-sm text-neutral-600">
            {confirm && confirm.some((f) => f.used)
              ? `${confirm.filter((f) => f.used).length} of these ${confirm.length === 1 ? "is" : "are"} still used on your site. Deleting will leave broken images or links. `
              : ""}
            This can’t be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" disabled={busy} onClick={() => setConfirm(null)}>Cancel</Button>
            <Button variant="destructive" disabled={busy} onClick={() => confirm && remove(confirm)}>{busy ? "Deleting…" : "Delete"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
