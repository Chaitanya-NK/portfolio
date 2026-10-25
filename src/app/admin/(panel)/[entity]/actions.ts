"use server";
import { revalidatePath, updateTag } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { CONTENT, type Field } from "@/lib/content-config";
import { normalizeRoles, deriveFromRoles, type Role } from "@/lib/roles";
import { normalizeGallery } from "@/lib/case-study";

type R = { ok: boolean; error?: string; row?: Record<string, any> };

function cfgOf(entity: string) {
  const c = CONTENT[entity];
  if (!c) throw new Error("Unknown content type");
  return c;
}

const list = (v: unknown, sep: string) =>
  (Array.isArray(v) ? v : String(v ?? "").split(sep)).map((x) => String(x).trim()).filter(Boolean);

function coerce(f: Field, v: unknown): unknown {
  switch (f.type) {
    case "number": {
      if (v === "" || v == null) return null;
      const n = Number(v);
      return Number.isFinite(n) ? n : null;
    }
    case "select": {
      if (f.numeric) { const n = Number(v); return Number.isFinite(n) ? n : null; }
      return String(v ?? "").trim() || null;
    }
    case "switch": return Boolean(v);
    case "roles": return normalizeRoles(v);
    case "gallery": return normalizeGallery(v);
    case "tags": return list(v, ",");
    case "lines": return list(v, "\n");
    case "metrics":
      return Array.isArray(v)
        ? v.map((m) => ({ value: String(m?.value ?? "").trim(), label: String(m?.label ?? "").trim() }))
            .filter((m) => m.value || m.label)
        : [];
    default: return String(v ?? "").trim() || null;
  }
}

const slugify = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "item";

function refresh(entity: string) {
  revalidatePath("/"); updateTag("site");
  revalidatePath(`/admin/${entity}`);
}

export async function saveItem(entity: string, id: string | null, values: Record<string, unknown>): Promise<R> {
  const cfg = cfgOf(entity);
  const supabase = await requireAdmin();

  const row: Record<string, unknown> = {};
  for (const f of cfg.fields) {
    const val = coerce(f, values[f.key]);
    if (f.required && (val === null || val === "")) return { ok: false, error: `${f.label} is required` };
    row[f.key] = val;
  }
  if (entity === "experience") {
    const roles = (row.roles as Role[]) ?? [];
    if (!roles.length) return { ok: false, error: "Add at least one role with a title" };
    Object.assign(row, deriveFromRoles(roles));
  }

  if (id) {
    const { data, error } = await supabase.from(cfg.table).update(row).eq("id", id).select().single();
    if (error) return { ok: false, error: error.message };
    refresh(entity);
    return { ok: true, row: data };
  }

  const { data: last } = await supabase
    .from(cfg.table).select("sort_order").order("sort_order", { ascending: false }).limit(1);
  row.sort_order = (last?.[0]?.sort_order ?? 0) + 1;
  if (entity === "projects") {
    row.slug = `${slugify(String(row.title))}-${Math.random().toString(36).slice(2, 6)}`;
  }
  const { data, error } = await supabase.from(cfg.table).insert(row).select().single();
  if (error) return { ok: false, error: error.message };
  refresh(entity);
  return { ok: true, row: data };
}

export async function deleteItem(entity: string, id: string): Promise<R> {
  const cfg = cfgOf(entity);
  const supabase = await requireAdmin();
  const { error } = await supabase.from(cfg.table).delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  refresh(entity);
  return { ok: true };
}

export async function togglePublished(entity: string, id: string, published: boolean): Promise<R> {
  const cfg = cfgOf(entity);
  const supabase = await requireAdmin();
  const { error } = await supabase.from(cfg.table).update({ published }).eq("id", id);
  if (error) return { ok: false, error: error.message };
  refresh(entity);
  return { ok: true };
}

export async function reorderItems(entity: string, ids: string[]): Promise<R> {
  const cfg = cfgOf(entity);
  const supabase = await requireAdmin();
  const { error } = await supabase.rpc("reorder", { tbl: cfg.table, ids });
  if (error) return { ok: false, error: error.message };
  refresh(entity);
  return { ok: true };
}
