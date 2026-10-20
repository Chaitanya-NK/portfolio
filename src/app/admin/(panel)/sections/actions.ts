"use server";
import { revalidatePath, updateTag } from "next/cache";
import { requireAdmin } from "@/lib/auth";

type R = { ok: boolean; error?: string };
const done = (error?: { message: string } | null): R => {
  if (error) return { ok: false, error: error.message };
  revalidatePath("/"); updateTag("site");
  revalidatePath("/admin/sections");
  return { ok: true };
};

export async function reorderSections(ids: string[]): Promise<R> {
  const supabase = await requireAdmin();
  const { error } = await supabase.rpc("reorder", { tbl: "sections", ids });
  return done(error);
}

export async function setVisible(id: string, visible: boolean): Promise<R> {
  const supabase = await requireAdmin();
  const { error } = await supabase.from("sections").update({ visible }).eq("id", id);
  return done(error);
}

export async function renameSection(id: string, title: string, subtitle: string): Promise<R> {
  const supabase = await requireAdmin();
  const { error } = await supabase
    .from("sections")
    .update({ title: title.trim() || "Untitled", subtitle: subtitle.trim() || null })
    .eq("id", id);
  return done(error);
}

export async function addSection(title: string, type: "custom" | "blog" = "custom"): Promise<R> {
  const supabase = await requireAdmin();
  const { data: last } = await supabase
    .from("sections").select("sort_order").order("sort_order", { ascending: false }).limit(1);
  const next = (last?.[0]?.sort_order ?? 0) + 1;
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "section";
  const { error } = await supabase.from("sections").insert({
    key: `${slug}-${Math.random().toString(36).slice(2, 6)}`,
    type, title: title.trim(), sort_order: next,
  });
  return done(error);
}

export async function deleteSection(id: string): Promise<R> {
  const supabase = await requireAdmin();
  const { error } = await supabase.from("sections").delete().eq("id", id).in("type", ["custom", "blog"]);
  return done(error);
}
