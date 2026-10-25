"use client";
import { useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { toast } from "sonner";
import { Copy, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { deleteVersion, setVersionPublished } from "./actions";

type V = { id: string; slug: string; title: string; published: boolean; headline: string | null; updated_at: string };

export function VersionsList({ initial }: { initial: V[] }) {
  const [list, setList] = useState(initial);
  const [del, setDel] = useState<V | null>(null);

  return (
    <div className="flex max-w-4xl flex-col gap-3">
      <div className="flex justify-end">
        <Link href="/admin/resume-versions/new" className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white">+ New version</Link>
      </div>
      {list.length === 0 && <p className="rounded-xl border border-dashed bg-white p-8 text-center text-sm text-neutral-500">No versions yet. Create one for a type of role, like “DevOps” or “Full-stack”.</p>}
      {list.map((v) => (
        <div key={v.id} className={`flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border bg-white p-4 ${v.published ? "" : "opacity-60"}`}>
          <div className="min-w-0 flex-1 basis-56">
            <Link href={`/admin/resume-versions/${v.id}`} className="block truncate font-medium hover:underline">{v.title}</Link>
            <div className="truncate text-sm text-neutral-500">/resume/{v.slug}</div>
            <div suppressHydrationWarning className="text-xs text-neutral-400">Updated {format(new Date(v.updated_at), "d MMM yyyy")}</div>
          </div>
          {!v.published && <Badge variant="secondary">Hidden</Badge>}
          <Switch checked={v.published} aria-label="Published" onCheckedChange={async (c: boolean) => {
            setList((l) => l.map((x) => (x.id === v.id ? { ...x, published: c } : x)));
            const r = await setVersionPublished(v.id, c);
            if (!r.ok) toast.error(r.error ?? "Failed");
          }} />
          <Button variant="outline" size="sm" onClick={() => { navigator.clipboard.writeText(`${location.origin}/resume/${v.slug}`); toast.success("Link copied"); }}>
            <Copy className="mr-1 h-3.5 w-3.5" />Copy link
          </Button>
          <a href={`/resume/${v.slug}`} target="_blank" rel="noreferrer" className="inline-flex h-8 items-center gap-1 rounded-md border px-3 text-sm hover:bg-neutral-50"><ExternalLink className="h-3.5 w-3.5" />View</a>
          <Link href={`/admin/resume-versions/${v.id}`} className="inline-flex h-8 items-center rounded-md border px-3 text-sm hover:bg-neutral-50">Edit</Link>
          <Button variant="ghost" size="sm" onClick={() => setDel(v)}>Delete</Button>
        </div>
      ))}
      <Dialog open={!!del} onOpenChange={(o) => !o && setDel(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Delete “{del?.title}”?</DialogTitle></DialogHeader>
          <p className="text-sm text-neutral-600">Anyone with the link <code>/resume/{del?.slug}</code> will see a “not found” page.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDel(null)}>Cancel</Button>
            <Button variant="destructive" onClick={async () => {
              const d = del!; setDel(null);
              const r = await deleteVersion(d.id);
              if (!r.ok) { toast.error(r.error ?? "Failed"); return; }
              setList((l) => l.filter((x) => x.id !== d.id));
              toast.success("Deleted");
            }}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
