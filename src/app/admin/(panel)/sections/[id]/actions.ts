"use server";
import { revalidatePath, updateTag } from "next/cache";
import { requireAdmin } from "@/lib/auth";

type R = { ok: boolean; error?: string; row?: Record<string, any> };
const refresh = (sid: string) => { revalidatePath("/"); updateTag("site"); revalidatePath(`/admin/sections/${sid}`); };

export async function saveSectionItem(sid: string, id: string | null, v: Record<string, any>): Promise<R> {
  const supabase = await requireAdmin();
  const str = (k: string) => String(v[k] ?? "").trim() || null;
  const data = {
    title: str("title"), subtitle: str("subtitle"), description: str("description"),
    image_url: str("image_url"), link_url: str("link_url"), link_label: str("link_label"),
    date_label: str("date_label"),
    tags: String(v.tags ?? "").split(",").map((t) => t.trim()).filter(Boolean),
  };
  if (!data.title) return { ok: false, error: "Title is required" };
  const published = Boolean(v.published);
  if (id) {
    const { data: row, error } = await supabase.from("section_items").update({ data, published }).eq("id", id).select().single();
    if (error) return { ok: false, error: error.message };
    refresh(sid); return { ok: true, row };
  }
  const { data: last } = await supabase.from("section_items").select("sort_order")
    .eq("section_id", sid).order("sort_order", { ascending: false }).limit(1);
  const { data: row, error } = await supabase.from("section_items")
    .insert({ section_id: sid, data, published, sort_order: (last?.[0]?.sort_order ?? 0) + 1 }).select().single();
  if (error) return { ok: false, error: error.message };
  refresh(sid); return { ok: true, row };
}

export async function deleteSectionItem(sid: string, id: string): Promise<R> {
  const supabase = await requireAdmin();
  const { error } = await supabase.from("section_items").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  refresh(sid); return { ok: true };
}

export async function toggleSectionItem(sid: string, id: string, published: boolean): Promise<R> {
  const supabase = await requireAdmin();
  const { error } = await supabase.from("section_items").update({ published }).eq("id", id);
  if (error) return { ok: false, error: error.message };
  refresh(sid); return { ok: true };
}

export async function reorderSectionItems(sid: string, ids: string[]): Promise<R> {
  const supabase = await requireAdmin();
  const { error } = await supabase.rpc("reorder", { tbl: "section_items", ids });
  if (error) return { ok: false, error: error.message };
  refresh(sid); return { ok: true };
}
