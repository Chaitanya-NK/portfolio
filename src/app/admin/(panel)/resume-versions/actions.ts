"use server";
import { revalidatePath, updateTag } from "next/cache";
import { requireAdmin } from "@/lib/auth";

type R = { ok: boolean; error?: string; row?: Record<string, any> };
type Input = {
  title: string; slug: string; headline: string; summary: string;
  skill_ids: string[]; experience_ids: string[]; project_ids: string[];
  highlights: Record<string, string[]>; show_achievements: boolean; published: boolean;
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ids = (v: unknown) => (Array.isArray(v) ? [...new Set(v.map(String).filter((x) => UUID.test(x)))].slice(0, 200) : []);
const txt = (v: unknown, n: number) => String(v ?? "").trim().slice(0, n) || null;
const refresh = (slug?: string) => {
  revalidatePath("/admin/resume-versions");
  if (slug) revalidatePath(`/resume/${slug}`);
  updateTag("site");
};

export async function saveVersion(id: string | null, v: Input): Promise<R> {
  const supabase = await requireAdmin();
  const title = String(v.title ?? "").trim().slice(0, 80);
  const slug = String(v.slug ?? "").trim().toLowerCase();
  if (!title) return { ok: false, error: "Give this version a name." };
  if (slug.length < 2 || slug.length > 40 || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug))
    return { ok: false, error: "The link name can only use lowercase letters, numbers and dashes (2 to 40 characters)." };

  const highlights: Record<string, string[]> = {};
  if (v.highlights && typeof v.highlights === "object") {
    for (const [k, arr] of Object.entries(v.highlights).slice(0, 80)) {
      const lines = (Array.isArray(arr) ? arr : []).map((x) => String(x).trim().slice(0, 300)).filter(Boolean).slice(0, 8);
      if (lines.length) highlights[String(k).slice(0, 200)] = lines;
    }
  }

  const row = {
    title, slug,
    headline: txt(v.headline, 200), summary: txt(v.summary, 700),
    skill_ids: ids(v.skill_ids), experience_ids: ids(v.experience_ids), project_ids: ids(v.project_ids).slice(0, 8),
    highlights, show_achievements: Boolean(v.show_achievements), published: Boolean(v.published),
  };
  const { data, error } = id
    ? await supabase.from("resume_versions").update(row).eq("id", id).select().single()
    : await supabase.from("resume_versions").insert(row).select().single();
  if (error) return { ok: false, error: error.code === "23505" ? "That link name is already used. Choose another." : error.message };
  refresh(slug);
  return { ok: true, row: data };
}

export async function deleteVersion(id: string): Promise<R> {
  const supabase = await requireAdmin();
  const { error } = await supabase.from("resume_versions").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  refresh();
  return { ok: true };
}

export async function setVersionPublished(id: string, published: boolean): Promise<R> {
  const supabase = await requireAdmin();
  const { error } = await supabase.from("resume_versions").update({ published }).eq("id", id);
  if (error) return { ok: false, error: error.message };
  refresh();
  return { ok: true };
}
