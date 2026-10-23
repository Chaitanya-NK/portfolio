"use client";
import { useState, useTransition } from "react";
import Link from "next/link";
import {
  DndContext, closestCenter, PointerSensor, KeyboardSensor,
  useSensor, useSensors, type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext, rectSortingStrategy, useSortable, arrayMove,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { reorderSections, setVisible, renameSection, addSection, deleteSection } from "./actions";

type Section = { id: string; key: string; type: string; title: string; subtitle: string | null; visible: boolean };
const report = (r: { ok: boolean; error?: string }, msg = "Saved") => {
  if (r.ok) toast.success(msg);
  else toast.error(r.error ?? "Failed");
};

function Row({ s, onChange, onRemove }: {
  s: Section; onChange: (s: Section) => void; onRemove: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: s.id });
  const [title, setTitle] = useState(s.title);
  const [sub, setSub] = useState(s.subtitle ?? "");
  const editable = s.type === "custom" || s.type === "blog";
  const save = async () => {
    if (title === s.title && sub === (s.subtitle ?? "")) return;
    onChange({ ...s, title, subtitle: sub || null });
    report(await renameSection(s.id, title, sub));
  };
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`flex flex-wrap items-center gap-2 rounded-xl border bg-white p-3 sm:flex-nowrap sm:gap-3 ${isDragging ? "z-10 shadow-lg" : ""} ${s.visible ? "" : "opacity-60"}`}
    >
      <button aria-label="Drag to reorder" className="cursor-grab touch-none px-3 py-2 text-lg text-neutral-400" {...attributes} {...listeners}>⋮⋮</button>
      <Input className="min-w-0 flex-1 basis-32 font-medium sm:max-w-48 sm:flex-none" value={title} onChange={(e) => setTitle(e.target.value)} onBlur={save} aria-label="Section title" />
      <div className="ml-auto flex flex-wrap items-center justify-end gap-2 sm:order-last sm:ml-0">
        <Badge variant={editable ? "default" : "secondary"}>{s.type}</Badge>
        <Switch
          checked={s.visible}
          aria-label="Visible"
          onCheckedChange={async (v: boolean) => {
            onChange({ ...s, visible: v });
            report(await setVisible(s.id, v), v ? "Section shown" : "Section hidden");
          }}
        />
        {editable && (
          <Link
            href={s.type === "blog" ? "/admin/blog" : `/admin/sections/${s.id}`}
            className="rounded-md border px-3 py-1.5 text-sm hover:bg-neutral-50"
          >
            {s.type === "blog" ? "Posts" : "Items"}
          </Link>
        )}
        {editable && (
          <Button variant="ghost" size="sm" onClick={async () => { onRemove(s.id); report(await deleteSection(s.id), "Deleted"); }}>Delete</Button>
        )}
      </div>
      <Input className="order-last w-full sm:order-none sm:w-auto sm:flex-1" placeholder="Subtitle / heading text" value={sub} onChange={(e) => setSub(e.target.value)} onBlur={save} aria-label="Section subtitle" />
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

  const add = (type: "custom" | "blog") =>
    start(async () => {
      const n = name.trim() || (type === "blog" ? "Blog" : "");
      if (!n) return;
      const r = await addSection(n, type);
      report(r, "Section added");
      if (r.ok) { setName(""); window.location.reload(); }
    });

  return (
    <div className="flex max-w-none flex-col gap-3">
      <div className="grid gap-3 min-[1700px]:grid-cols-2"><DndContext id="sections-dnd" sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={items.map((i) => i.id)} strategy={rectSortingStrategy}>
          {items.map((s) => (
            <Row key={s.id} s={s}
              onChange={(n) => setItems((l) => l.map((x) => (x.id === n.id ? n : x)))}
              onRemove={(id) => setItems((l) => l.filter((x) => x.id !== id))} />
          ))}
        </SortableContext>
      </DndContext></div>
      <form
        className="mt-4 flex flex-col gap-2 sm:flex-row"
        onSubmit={(e) => { e.preventDefault(); add("custom"); }}
      >
        <Input placeholder="New section name (e.g. Services, Blog)" value={name} onChange={(e) => setName(e.target.value)} />
        <div className="flex gap-2">
          <Button type="submit" disabled={pending} className="flex-1 sm:flex-none">+ Custom section</Button>
          <Button type="button" variant="outline" disabled={pending} className="flex-1 sm:flex-none" onClick={() => add("blog")}>+ Blog section</Button>
        </div>
      </form>
    </div>
  );
}
