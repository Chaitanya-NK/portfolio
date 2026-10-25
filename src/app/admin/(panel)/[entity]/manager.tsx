"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
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
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { FileUpload } from "@/components/admin/file-upload";
import { BulkTools } from "@/components/admin/bulk-tools";
import { BulkSkills } from "@/components/admin/bulk-skills";
import { AiTextAssist } from "@/components/admin/ai-assist";
import { aiBullets } from "@/app/admin/ai-actions";
import { DatePicker, DateTimePicker } from "@/components/admin/date-picker";
import type { EntityConfig, Field } from "@/lib/content-config";
import { saveItem, deleteItem, togglePublished, reorderItems } from "./actions";

type Row = Record<string, any>;
type Values = Record<string, any>;

function initValues(cfg: EntityConfig, item: Row | null): Values {
  const v: Values = {};
  for (const f of cfg.fields) {
    const raw = item?.[f.key];
    if (f.type === "tags") v[f.key] = Array.isArray(raw) ? raw.join(", ") : "";
    else if (f.type === "lines") v[f.key] = Array.isArray(raw) ? raw.join("\n") : "";
    else if (f.type === "metrics") v[f.key] = Array.isArray(raw) ? raw : [];
    else if (f.type === "roles") v[f.key] = rolesInit(item);
    else if (f.type === "switch") v[f.key] = item ? Boolean(raw) : f.key === "published";
    else if (f.type === "datetime") v[f.key] = raw ? format(new Date(raw), "yyyy-MM-dd'T'HH:mm") : "";
    else if (f.type === "select") v[f.key] = raw != null ? String(raw) : f.default ?? "";
    else v[f.key] = raw ?? "";
  }
  return v;
}

function MetricsEditor({ value, onChange }: { value: { value: string; label: string }[]; onChange: (v: any[]) => void }) {
  const set = (i: number, k: "value" | "label", x: string) =>
    onChange(value.map((m, j) => (j === i ? { ...m, [k]: x } : m)));
  return (
    <div className="flex flex-col gap-2">
      {value.map((m, i) => (
        <div key={i} className="flex gap-2">
          <Input className="w-28" placeholder="+40%" value={m.value} onChange={(e) => set(i, "value", e.target.value)} aria-label="Metric value" />
          <Input className="flex-1" placeholder="Conversion lift" value={m.label} onChange={(e) => set(i, "label", e.target.value)} aria-label="Metric label" />
          <Button type="button" variant="ghost" size="sm" onClick={() => onChange(value.filter((_, j) => j !== i))}>Remove</Button>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" className="w-fit" onClick={() => onChange([...value, { value: "", label: "" }])}>+ Add metric</Button>
    </div>
  );
}


type RoleDraft = { title: string; start_date: string; end_date: string; is_current: boolean; summary: string; bullets: string };
const blankRole = (): RoleDraft => ({ title: "", start_date: "", end_date: "", is_current: false, summary: "", bullets: "" });

function rolesInit(item: Row | null): RoleDraft[] {
  const toDraft = (r: Row): RoleDraft => ({
    title: r.title ?? "", start_date: r.start_date ?? "", end_date: r.end_date ?? "",
    is_current: Boolean(r.is_current), summary: r.summary ?? "",
    bullets: Array.isArray(r.bullets) ? r.bullets.join("\n") : "",
  });
  if (Array.isArray(item?.roles) && item!.roles.length) return item!.roles.map(toDraft);
  if (item?.role) return [toDraft({ title: item.role, start_date: item.start_date, end_date: item.end_date, is_current: item.is_current, summary: item.summary, bullets: item.bullets })];
  return [blankRole()];
}

function RolesEditor({ value, onChange }: { value: RoleDraft[]; onChange: (v: RoleDraft[]) => void }) {
  const set = (i: number, p: Partial<RoleDraft>) =>
    onChange(value.map((r, j) => (j === i ? { ...r, ...p } : p.is_current ? { ...r, is_current: false } : r)));
  const move = (i: number, d: number) => {
    const k = i + d;
    if (k < 0 || k >= value.length) return;
    const n = [...value];
    [n[i], n[k]] = [n[k], n[i]];
    onChange(n);
  };
  return (
    <div className="flex flex-col gap-3">
      {value.map((r, i) => (
        <div key={i} className="flex flex-col gap-3 rounded-xl border bg-neutral-50 p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-sm font-semibold">Role {i + 1}{i === 0 ? " (newest)" : ""}</span>
            <div className="flex gap-1">
              <Button type="button" variant="ghost" size="sm" disabled={i === 0} onClick={() => move(i, -1)} aria-label="Move up">↑</Button>
              <Button type="button" variant="ghost" size="sm" disabled={i === value.length - 1} onClick={() => move(i, 1)} aria-label="Move down">↓</Button>
              <Button type="button" variant="ghost" size="sm" disabled={value.length === 1} onClick={() => onChange(value.filter((_, j) => j !== i))}>Remove</Button>
            </div>
          </div>
          <label className="flex flex-col gap-1 text-sm font-medium">Job title
            <Input value={r.title} onChange={(e) => set(i, { title: e.target.value })} placeholder="e.g. Senior Software Engineer" />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1 text-sm font-medium">Start date
              <DatePicker value={r.start_date} onChange={(v) => set(i, { start_date: v })} />
            </div>
            <div className="flex flex-col gap-1 text-sm font-medium">End date
              {r.is_current
                ? <div className="flex h-9 items-center rounded-md border bg-white px-3 text-sm font-normal text-neutral-500">Present</div>
                : <DatePicker value={r.end_date} onChange={(v) => set(i, { end_date: v })} />}
            </div>
          </div>
          <div className="flex items-center justify-between rounded-lg border bg-white p-3 text-sm font-medium">
            I currently work in this role
            <Switch checked={r.is_current} onCheckedChange={(c: boolean) => set(i, { is_current: c, end_date: c ? "" : r.end_date })} aria-label="Current role" />
          </div>
          <label className="flex flex-col gap-1 text-sm font-medium">Summary (optional)
            <Textarea rows={2} value={r.summary} onChange={(e) => set(i, { summary: e.target.value })} />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium">Highlights (one per line)
            <Textarea rows={3} value={r.bullets} onChange={(e) => set(i, { bullets: e.target.value })} />
          </label>
          <AiTextAssist label="Polish with AI" getValue={() => r.bullets} setValue={(v) => set(i, { bullets: v })} run={(cur) => aiBullets({ title: r.title, notes: cur })} />
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" className="w-fit" onClick={() => onChange([blankRole(), ...value])}>
        + Add promotion or new role
      </Button>
    </div>
  );
}

function FieldInput({ f, v, set }: { f: Field; v: any; set: (x: any) => void }) {
  if (f.type === "date" || f.type === "datetime")
    return (
      <div className="flex flex-col gap-1 text-sm font-medium">
        {f.label}
        {f.type === "date" ? <DatePicker value={v} onChange={set} /> : <DateTimePicker value={v} onChange={set} />}
        {f.help && <span className="text-xs font-normal text-neutral-500">{f.help}</span>}
      </div>
    );
  if (f.type === "roles")
    return (
      <div className="flex flex-col gap-2 text-sm font-medium">
        {f.label}
        <RolesEditor value={v} onChange={set} />
      </div>
    );
  if (f.type === "image")
    return <FileUpload label={f.label} folder={f.folder ?? "misc"} accept="image/*" defaultValue={v} onChange={set} />;
  if (f.type === "switch")
    return (
      <div className="flex items-center justify-between rounded-lg border p-3 text-sm font-medium">
        {f.label}
        <Switch checked={Boolean(v)} onCheckedChange={(c: boolean) => set(c)} aria-label={f.label} />
      </div>
    );
  return (
    <label className="flex flex-col gap-1 text-sm font-medium">
      {f.label}
      {f.type === "textarea" || f.type === "lines" ? (
        <Textarea rows={f.type === "lines" ? 4 : 3} value={v} onChange={(e) => set(e.target.value)} />
      ) : f.type === "select" ? (
        <Select value={String(v)} onValueChange={(x) => x != null && set(String(x))}>
          <SelectTrigger aria-label={f.label}><SelectValue placeholder="Select" /></SelectTrigger>
          <SelectContent>
            {f.options?.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
          </SelectContent>
        </Select>
      ) : f.type === "metrics" ? (
        <MetricsEditor value={v} onChange={set} />
      ) : (
        <Input
          type={f.type === "number" ? "number" : "text"}
          placeholder={f.placeholder}
          value={v}
          onChange={(e) => set(e.target.value)}
        />
      )}
      {f.help && <span className="text-xs font-normal text-neutral-500">{f.help}</span>}
    </label>
  );
}

function ItemSheet({ entity, cfg, item, onClose, onSaved }: {
  entity: string; cfg: EntityConfig; item: Row | null; onClose: () => void; onSaved: (r: Row) => void;
}) {
  const [values, setValues] = useState<Values>(() => initValues(cfg, item));
  const [busy, setBusy] = useState(false);
  return (
    <Sheet open onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader><SheetTitle>{item ? `Edit ${cfg.singular}` : `New ${cfg.singular}`}</SheetTitle></SheetHeader>
        <form
          className="flex flex-col gap-4 p-4"
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            const payload: Values = { ...values };
            for (const f of cfg.fields) if (f.type === "datetime") payload[f.key] = values[f.key] ? new Date(values[f.key]).toISOString() : "";
            const r = await saveItem(entity, item?.id ?? null, payload);
            setBusy(false);
            if (!r.ok || !r.row) return toast.error(r.error ?? "Failed to save");
            toast.success("Saved");
            onSaved(r.row);
          }}
        >
          {cfg.fields.map((f) => (
            <FieldInput key={f.key} f={f} v={values[f.key]} set={(x) => setValues((s) => ({ ...s, [f.key]: x }))} />
          ))}
          <div className="flex gap-2 pt-2">
            <Button type="submit" disabled={busy}>{busy ? "Saving…" : "Save"}</Button>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}

function SortableRow({ entity, cfg, item, onEdit, onDelete, onToggle }: {
  entity: string; cfg: EntityConfig; item: Row; onEdit: () => void; onDelete: () => void; onToggle: (v: boolean) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });
  const sub = (cfg.secondary ?? []).map((k) => item[k]).filter(Boolean).join(" · ");
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`flex flex-wrap items-center gap-2 rounded-xl border bg-white p-3 sm:gap-3 ${isDragging ? "z-10 shadow-lg" : ""} ${item.published ? "" : "opacity-60"}`}
    >
      <button aria-label="Drag to reorder" className="cursor-grab touch-none px-3 py-2 text-lg text-neutral-400" {...attributes} {...listeners}>⋮⋮</button>
      <div className="min-w-0 flex-1 basis-40">
        <div className="truncate font-medium">{item[cfg.primary] ?? "(untitled)"}</div>
        {sub && <div className="truncate text-sm text-neutral-500">{sub}</div>}
      </div>
      <div className="ml-auto flex items-center gap-2">
        {!item.published && <Badge variant="secondary">Draft</Badge>}
        <Switch checked={Boolean(item.published)} onCheckedChange={(c: boolean) => onToggle(c)} aria-label="Published" />
        <Button variant="outline" size="sm" onClick={onEdit}>Edit</Button>
        <Button variant="ghost" size="sm" onClick={onDelete}>Delete</Button>
      </div>
    </div>
  );
}

export function ContentManager({ entity, cfg, initial }: { entity: string; cfg: EntityConfig; initial: Row[] }) {
  const [items, setItems] = useState<Row[]>(initial);
  const [editing, setEditing] = useState<{ item: Row | null } | null>(null);
  const [deleting, setDeleting] = useState<Row | null>(null);
  const editId = useSearchParams().get("edit");
  useEffect(() => {
    const it = editId ? items.find((i) => i.id === editId) : null;
    if (it) setEditing({ item: it });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editId]);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const onDragEnd = async (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const next = arrayMove(items, items.findIndex((i) => i.id === active.id), items.findIndex((i) => i.id === over.id));
    setItems(next);
    const r = await reorderItems(entity, next.map((i) => i.id));
    r.ok ? toast.success("Order saved") : toast.error(r.error ?? "Failed");
  };

  return (
    <div className="flex max-w-none flex-col gap-3">
      <div className="flex flex-wrap justify-end gap-2">
        {entity === "tools" && <BulkTools existing={items.map((i) => i.name)} />}
        {entity === "skills" && <BulkSkills existing={items.map((i) => `${i.category}|${i.name}`)} />}
        <Button onClick={() => setEditing({ item: null })}>+ Add {cfg.singular}</Button>
      </div>
      {items.length === 0 && (
        <p className="rounded-xl border border-dashed p-8 text-center text-sm text-neutral-500">
          Nothing here yet. Click “Add {cfg.singular}” to create the first one.
        </p>
      )}
      <div className="grid gap-3 min-[1700px]:grid-cols-2"><DndContext id={`${entity}-dnd`} sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={items.map((i) => i.id)} strategy={rectSortingStrategy}>
          {items.map((item) => (
            <SortableRow
              key={item.id} entity={entity} cfg={cfg} item={item}
              onEdit={() => setEditing({ item })}
              onDelete={() => setDeleting(item)}
              onToggle={async (c) => {
                setItems((l) => l.map((x) => (x.id === item.id ? { ...x, published: c } : x)));
                const r = await togglePublished(entity, item.id, c);
                r.ok ? toast.success(c ? "Published" : "Moved to draft") : toast.error(r.error ?? "Failed");
              }}
            />
          ))}
        </SortableContext>
      </DndContext></div>

      {editing && (
        <ItemSheet
          key={editing.item?.id ?? "new"}
          entity={entity} cfg={cfg} item={editing.item}
          onClose={() => setEditing(null)}
          onSaved={(row) => {
            setItems((l) => (l.some((x) => x.id === row.id) ? l.map((x) => (x.id === row.id ? row : x)) : [...l, row]));
            setEditing(null);
          }}
        />
      )}

      <Dialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Delete this {cfg.singular}?</DialogTitle></DialogHeader>
          <p className="text-sm text-neutral-600">“{deleting?.[cfg.primary]}” will be removed permanently.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleting(null)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={async () => {
                const d = deleting!;
                setDeleting(null);
                const r = await deleteItem(entity, d.id);
                if (!r.ok) return toast.error(r.error ?? "Failed");
                setItems((l) => l.filter((x) => x.id !== d.id));
                toast.success("Deleted");
              }}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
