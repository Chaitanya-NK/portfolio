"use server";
import { revalidatePath, updateTag } from "next/cache";
import { requireAdmin } from "@/lib/auth";

type R = { ok: boolean; error?: string; row?: Record<string, any> };
type In = { body: string; link_url: string; tags: string };

const refresh = () => {
  revalidatePath("/"); revalidatePath("/notes"); revalidatePath("/admin/notes"); updateTag("site");
};

function clean(v: In): { error: string | null; row: { body: string; link_url: string | null; tags: string[] } | null } {
  const body = String(v.body ?? "").trim();
  if (body.length < 2) return { error: "Write something first.", row: null };
  if (body.length > 600) return { error: "Keep notes under 600 characters. Use a blog post for longer writing.", row: null };
  const link = String(v.link_url ?? "").trim();
  if (link && !/^https?:\/\//i.test(link)) return { error: "The link must start with https://", row: null };
  const tags = String(v.tags ?? "").split(",").map((t) => t.trim().toLowerCase().replace(/^#/, "")).filter(Boolean).slice(0, 5);
  return { error: null, row: { body, link_url: link || null, tags } };
}

export async function createNote(v: In): Promise<R> {
  const supabase = await requireAdmin();
  const c = clean(v);
  if (c.error || !c.row) return { ok: false, error: c.error ?? "Invalid note" };
  const { data, error } = await supabase.from("notes").insert(c.row).select().single();
  if (error) return { ok: false, error: error.message };
  refresh();
  return { ok: true, row: data };
}

export async function updateNote(id: string, v: In): Promise<R> {
  const supabase = await requireAdmin();
  const c = clean(v);
  if (c.error || !c.row) return { ok: false, error: c.error ?? "Invalid note" };
  const { data, error } = await supabase.from("notes").update(c.row).eq("id", id).select().single();
  if (error) return { ok: false, error: error.message };
  refresh();
  return { ok: true, row: data };
}

export async function setNoteFlag(id: string, field: "pinned" | "published", value: boolean): Promise<R> {
  if (field !== "pinned" && field !== "published") return { ok: false, error: "Invalid field" };
  const supabase = await requireAdmin();
  const { error } = await supabase.from("notes").update({ [field]: value }).eq("id", id);
  if (error) return { ok: false, error: error.message };
  refresh();
  return { ok: true };
}

export async function deleteNote(id: string): Promise<R> {
  const supabase = await requireAdmin();
  const { error } = await supabase.from("notes").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  refresh();
  return { ok: true };
}
