"use client";
import { useState } from "react";
import { DndContext, closestCenter, PointerSensor, KeyboardSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { FileUpload } from "@/components/admin/file-upload";
import { saveSectionItem, deleteSectionItem, toggleSectionItem, reorderSectionItems } from "./actions";

type Item = { id: string; data: Record<string, any>; published: boolean };

function Editor({ sid, item, onClose, onSaved }: { sid: string; item: Item | null; onClose: () => void; onSaved: (r: Item) => void }) {
  const d = item?.data ?? {};
  const [v, setV] = useState<Record<string, any>>({
    title: d.title ?? "", subtitle: d.subtitle ?? "", description: d.description ?? "",
    image_url: d.image_url ?? "", link_url: d.link_url ?? "", link_label: d.link_label ?? "",
    date_label: d.date_label ?? "", tags: (d.tags ?? []).join(", "), published: item ? item.published : true,
  });
  const [busy, setBusy] = useState(false);
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setV((s) => ({ ...s, [k]: e.target.value }));
  const L = ({ t, children }: { t: string; children: React.ReactNode }) => <label className="flex flex-col gap-1 text-sm font-medium">{t}{children}</label>;
  return (
    <Sheet open onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader><SheetTitle>{item ? "Edit item" : "New item"}</SheetTitle></SheetHeader>
        <form className="flex flex-col gap-4 p-4" onSubmit={async (e) => {
          e.preventDefault(); setBusy(true);
          const r = await saveSectionItem(sid, item?.id ?? null, v);
          setBusy(false);
          if (!r.ok || !r.row) return toast.error(r.error ?? "Failed");
          toast.success("Saved"); onSaved(r.row as Item);
        }}>
          <L t="Title *"><Input value={v.title} onChange={set("title")} /></L>
          <L t="Subtitle"><Input value={v.subtitle} onChange={set("subtitle")} /></L>
          <L t="Date or label (e.g. 2025, Speaker)"><Input value={v.date_label} onChange={set("date_label")} /></L>
          <L t="Description"><Textarea rows={4} value={v.description} onChange={set("description")} /></L>
          <FileUpload label="Image (optional)" folder="custom" accept="image/*" defaultValue={v.image_url} onChange={(u) => setV((s) => ({ ...s, image_url: u }))} />
          <L t="Link URL"><Input placeholder="https://..." value={v.link_url} onChange={set("link_url")} /></L>
          <L t="Link label"><Input placeholder="Read more" value={v.link_label} onChange={set("link_label")} /></L>
          <L t="Tags (comma separated)"><Input value={v.tags} onChange={set("tags")} /></L>
          <div className="flex items-center justify-between rounded-lg border p-3 text-sm font-medium">
            Published (visible on site)
            <Switch checked={v.published} onCheckedChange={(c: boolean) => setV((s) => ({ ...s, published: c }))} aria-label="Published" />
          </div>
          <div className="flex gap-2"><Button type="submit" disabled={busy}>{busy ? "Saving…" : "Save"}</Button><Button type="button" variant="outline" onClick={onClose}>Cancel</Button></div>
        </form>
      </SheetContent>
    </Sheet>
  );
}

function Row({ item, onEdit, onDelete, onToggle }: { item: Item; onEdit: () => void; onDelete: () => void; onToggle: (c: boolean) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });
  return (
    <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`flex items-center gap-3 rounded-xl border bg-white p-3 ${isDragging ? "z-10 shadow-lg" : ""} ${item.published ? "" : "opacity-60"}`}>
      <button aria-label="Drag to reorder" className="cursor-grab px-2 text-lg text-neutral-400" {...attributes} {...listeners}>⋮⋮</button>
      <div className="min-w-0 flex-1">
        <div className="truncate font-medium">{item.data.title}</div>
        <div className="truncate text-sm text-neutral-500">{[item.data.subtitle, item.data.date_label].filter(Boolean).join(" · ")}</div>
      </div>
      {!item.published && <Badge variant="secondary">Draft</Badge>}
      <Switch checked={item.published} onCheckedChange={onToggle} aria-label="Published" />
      <Button variant="outline" size="sm" onClick={onEdit}>Edit</Button>
      <Button variant="ghost" size="sm" onClick={onDelete}>Delete</Button>
    </div>
  );
}

export function ItemsManager({ sid, initial }: { sid: string; initial: Item[] }) {
  const [items, setItems] = useState(initial);
  const [editing, setEditing] = useState<{ item: Item | null } | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));
  const onDragEnd = async ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    const next = arrayMove(items, items.findIndex((i) => i.id === active.id), items.findIndex((i) => i.id === over.id));
    setItems(next);
    const r = await reorderSectionItems(sid, next.map((i) => i.id));
    r.ok ? toast.success("Order saved") : toast.error(r.error ?? "Failed");
  };
  return (
    <div className="flex max-w-4xl flex-col gap-3">
      <div className="flex justify-end"><Button onClick={() => setEditing({ item: null })}>+ Add item</Button></div>
      {items.length === 0 && <p className="rounded-xl border border-dashed p-8 text-center text-sm text-neutral-500">No items yet. Add the first one.</p>}
      <DndContext id="items-dnd" sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
          {items.map((item) => (
            <Row key={item.id} item={item} onEdit={() => setEditing({ item })}
              onDelete={async () => { const r = await deleteSectionItem(sid, item.id); if (!r.ok) return toast.error(r.error ?? "Failed"); setItems((l) => l.filter((x) => x.id !== item.id)); toast.success("Deleted"); }}
              onToggle={async (c) => { setItems((l) => l.map((x) => (x.id === item.id ? { ...x, published: c } : x))); const r = await toggleSectionItem(sid, item.id, c); r.ok ? toast.success(c ? "Published" : "Moved to draft") : toast.error(r.error ?? "Failed"); }} />
          ))}
        </SortableContext>
      </DndContext>
      {editing && <Editor key={editing.item?.id ?? "new"} sid={sid} item={editing.item} onClose={() => setEditing(null)}
        onSaved={(row) => { setItems((l) => (l.some((x) => x.id === row.id) ? l.map((x) => (x.id === row.id ? row : x)) : [...l, row])); setEditing(null); }} />}
    </div>
  );
}
