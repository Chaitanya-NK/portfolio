"use client";
import { useState, useTransition } from "react";
import {
  DndContext, closestCenter, PointerSensor, KeyboardSensor,
  useSensor, useSensors, type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext, verticalListSortingStrategy, useSortable, arrayMove,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import Link from "next/link";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { reorderSections, setVisible, renameSection, addSection, deleteSection } from "./actions";

type Section = { id: string; key: string; type: string; title: string; subtitle: string | null; visible: boolean };
const report = (r: { ok: boolean; error?: string }, msg = "Saved") =>
  r.ok ? toast.success(msg) : toast.error(r.error ?? "Failed");

function Row({ s, onChange, onRemove }: {
  s: Section; onChange: (s: Section) => void; onRemove: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: s.id });
  const [title, setTitle] = useState(s.title);
  const [sub, setSub] = useState(s.subtitle ?? "");
  const save = async () => {
    if (title === s.title && sub === (s.subtitle ?? "")) return;
    onChange({ ...s, title, subtitle: sub || null });
    report(await renameSection(s.id, title, sub));
  };
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`flex items-center gap-3 rounded-xl border bg-white p-3 ${isDragging ? "z-10 shadow-lg" : ""} ${s.visible ? "" : "opacity-60"}`}
    >
      <button aria-label="Drag to reorder" className="cursor-grab px-2 text-lg text-neutral-400" {...attributes} {...listeners}>⋮⋮</button>
      <Input className="max-w-48 font-medium" value={title} onChange={(e) => setTitle(e.target.value)} onBlur={save} aria-label="Section title" />
      <Input className="flex-1" placeholder="Subtitle / heading text" value={sub} onChange={(e) => setSub(e.target.value)} onBlur={save} aria-label="Section subtitle" />
      <Badge variant={s.type === "custom" ? "default" : "secondary"}>{s.type}</Badge>
      <Switch
        checked={s.visible}
        aria-label="Visible"
        onCheckedChange={async (v: boolean) => {
          onChange({ ...s, visible: v });
          report(await setVisible(s.id, v), v ? "Section shown" : "Section hidden");
        }}
      />
      {s.type === "custom" && (
        <Link href={`/admin/sections/${s.id}`} className="rounded-md border px-3 py-1.5 text-sm hover:bg-neutral-50">Items</Link>
      )}
      {s.type === "custom" && (
        <Button variant="ghost" size="sm" onClick={async () => { onRemove(s.id); report(await deleteSection(s.id), "Deleted"); }}>Delete</Button>
      )}
    </div>
  );
}

export function SectionBuilder({ initial }: { initial: Section[] }) {
  const [items, setItems] = useState(initial);
  const [name, setName] = useState("");
  const [pending, start] = useTransition();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const next = arrayMove(items, items.findIndex((i) => i.id === active.id), items.findIndex((i) => i.id === over.id));
    setItems(next);
    start(async () => report(await reorderSections(next.map((i) => i.id)), "Order saved"));
  };

  return (
    <div className="flex max-w-4xl flex-col gap-3">
      <DndContext id="sections-dnd" sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
          {items.map((s) => (
            <Row key={s.id} s={s}
              onChange={(n) => setItems((l) => l.map((x) => (x.id === n.id ? n : x)))}
              onRemove={(id) => setItems((l) => l.filter((x) => x.id !== id))} />
          ))}
        </SortableContext>
      </DndContext>
      <form
        className="mt-4 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (!name.trim()) return;
          start(async () => {
            const r = await addSection(name);
            report(r, "Section added");
            if (r.ok) { setName(""); window.location.reload(); }
          });
        }}
      >
        <Input placeholder="New custom section name (e.g. Blog, Services)" value={name} onChange={(e) => setName(e.target.value)} />
        <Button type="submit" disabled={pending}>+ Add custom section</Button>
      </form>
    </div>
  );
}
