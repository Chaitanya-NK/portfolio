"use client";
import { useState } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import { Pin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { createNote, updateNote, setNoteFlag, deleteNote } from "./actions";

type Note = { id: string; body: string; link_url: string | null; tags: string[]; pinned: boolean; published: boolean; created_at: string };
type V = { body: string; link_url: string; tags: string };

const sortNotes = (l: Note[]) =>
  [...l].sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.created_at.localeCompare(a.created_at));
const toV = (n?: Note): V => ({ body: n?.body ?? "", link_url: n?.link_url ?? "", tags: (n?.tags ?? []).join(", ") });

function Fields({ v, set, onSubmit }: { v: V; set: (v: V) => void; onSubmit?: () => void }) {
  return (
    <div className="flex flex-col gap-2">
      <Textarea
        rows={3} maxLength={600} value={v.body} autoFocus={false}
        onChange={(e) => set({ ...v, body: e.target.value })}
        onKeyDown={(e) => { if ((e.metaKey || e.ctrlKey) && e.key === "Enter") onSubmit?.(); }}
        placeholder="What did you learn or ship today?" aria-label="Note"
      />
      <div className="grid gap-2 sm:grid-cols-2">
        <Input value={v.link_url} onChange={(e) => set({ ...v, link_url: e.target.value })} placeholder="Link (optional) https://…" aria-label="Link" />
        <Input value={v.tags} onChange={(e) => set({ ...v, tags: e.target.value })} placeholder="Tags, comma separated (up to 5)" aria-label="Tags" />
      </div>
      <p className="text-right text-xs text-neutral-500">{v.body.length} / 600</p>
    </div>
  );
}

export function NotesManager({ initial }: { initial: Note[] }) {
  const [list, setList] = useState(() => sortNotes(initial));
  const [draft, setDraft] = useState<V>(toV());
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState<Note | null>(null);
  const [edit, setEdit] = useState<V>(toV());
  const [del, setDel] = useState<Note | null>(null);

  async function post() {
    if (busy) return;
    setBusy(true);
    const r = await createNote(draft);
    setBusy(false);
    if (!r.ok || !r.row) { toast.error(r.error ?? "Failed"); return; }
    setList((l) => sortNotes([r.row as Note, ...l]));
    setDraft(toV());
    toast.success("Note posted");
  }
  async function flag(n: Note, field: "pinned" | "published", value: boolean) {
    setList((l) => sortNotes(l.map((x) => (x.id === n.id ? { ...x, [field]: value } : x))));
    const r = await setNoteFlag(n.id, field, value);
    if (!r.ok) toast.error(r.error ?? "Failed");
  }
  async function saveEdit() {
    if (!editing) return;
    setBusy(true);
    const r = await updateNote(editing.id, edit);
    setBusy(false);
    if (!r.ok || !r.row) { toast.error(r.error ?? "Failed"); return; }
    setList((l) => sortNotes(l.map((x) => (x.id === editing.id ? (r.row as Note) : x))));
    setEditing(null);
    toast.success("Saved");
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="rounded-xl border bg-white p-4">
        <Fields v={draft} set={setDraft} onSubmit={post} />
        <div className="mt-2 flex items-center justify-between gap-3">
          <span className="text-xs text-neutral-500">Tip: Ctrl/⌘ + Enter posts it.</span>
          <Button onClick={post} disabled={busy || draft.body.trim().length < 2}>{busy ? "Posting…" : "Post note"}</Button>
        </div>
      </div>

      {list.length === 0 && <p className="rounded-xl border border-dashed bg-white p-8 text-center text-sm text-neutral-500">No notes yet. Post your first one above.</p>}

      <div className="grid gap-3 min-[1700px]:grid-cols-2">
        {list.map((n) => (
          <div key={n.id} className={`flex flex-col gap-3 rounded-xl border bg-white p-4 ${n.published ? "" : "opacity-60"}`}>
            <p className="whitespace-pre-wrap break-words text-sm">{n.body}</p>
            {(n.tags.length > 0 || n.link_url) && (
              <div className="flex flex-wrap items-center gap-2">
                {n.tags.map((t) => <Badge key={t} variant="secondary">#{t}</Badge>)}
                {n.link_url && <a href={n.link_url} target="_blank" rel="noreferrer" className="truncate text-xs text-indigo-600 underline">{n.link_url}</a>}
              </div>
            )}
            <div className="flex flex-wrap items-center gap-2">
              <span suppressHydrationWarning className="text-xs text-neutral-500">{format(new Date(n.created_at), "d MMM yyyy, h:mm a")}</span>
              {!n.published && <Badge variant="secondary">Hidden</Badge>}
              <div className="ml-auto flex items-center gap-1">
                <Button variant="ghost" size="icon" aria-label={n.pinned ? "Unpin note" : "Pin note"} aria-pressed={n.pinned} onClick={() => flag(n, "pinned", !n.pinned)}>
                  <Pin className={`h-4 w-4 ${n.pinned ? "fill-indigo-600 text-indigo-600" : ""}`} />
                </Button>
                <Switch checked={n.published} onCheckedChange={(c: boolean) => flag(n, "published", c)} aria-label="Published" />
                <Button variant="outline" size="sm" onClick={() => { setEditing(n); setEdit(toV(n)); }}>Edit</Button>
                <Button variant="ghost" size="sm" onClick={() => setDel(n)}>Delete</Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={!!editing} onOpenChange={(o) => !o && !busy && setEditing(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit note</DialogTitle></DialogHeader>
          <Fields v={edit} set={setEdit} />
          <DialogFooter>
            <Button variant="outline" disabled={busy} onClick={() => setEditing(null)}>Cancel</Button>
            <Button disabled={busy} onClick={saveEdit}>{busy ? "Saving…" : "Save"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!del} onOpenChange={(o) => !o && setDel(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Delete this note?</DialogTitle></DialogHeader>
          <p className="text-sm text-neutral-600">This can’t be undone.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDel(null)}>Cancel</Button>
            <Button variant="destructive" onClick={async () => {
              const d = del!; setDel(null);
              const r = await deleteNote(d.id);
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
