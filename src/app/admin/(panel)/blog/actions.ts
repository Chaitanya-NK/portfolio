"use server";
import { revalidatePath, updateTag } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { cleanHtml } from "@/lib/sanitize";

type Input = {
  title: string; slug: string; excerpt: string; cover_url: string; tags: string;
  content_json: unknown; content_html: string; status: "draft" | "published";
  publish_at: string; seo_title: string; seo_description: string;
};
type R = { ok: boolean; error?: string; row?: Record<string, any> };

const slugify = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "post";

function refresh(slug?: string) {
  revalidatePath("/"); updateTag("site");
  revalidatePath("/blog");
  if (slug) revalidatePath(`/blog/${slug}`);
  revalidatePath("/admin/blog");
}

export async function savePost(id: string | null, v: Input): Promise<R> {
  const supabase = await requireAdmin();
  const title = v.title.trim();
  if (!title) return { ok: false, error: "Title is required" };

  const html = cleanHtml(v.content_html || "");
  const words = html.replace(/<[^>]+>/g, " ").split(/\s+/).filter(Boolean).length;
  const status = v.status === "published" ? "published" : "draft";

  const row: Record<string, unknown> = {
    title,
    slug: slugify(v.slug || title),
    excerpt: v.excerpt.trim() || null,
    cover_url: v.cover_url.trim() || null,
    tags: v.tags.split(",").map((t) => t.trim()).filter(Boolean),
    content_json: v.content_json ?? null,
    content_html: html,
    reading_minutes: Math.max(1, Math.ceil(words / 200)),
    status,
    publish_at: v.publish_at || null,
    seo_title: v.seo_title.trim() || null,
    seo_description: v.seo_description.trim() || null,
  };

  if (status === "published") {
    let existing: string | null = null;
    if (id) {
      const { data } = await supabase.from("posts").select("published_at").eq("id", id).single();
      existing = data?.published_at ?? null;
    }
    row.published_at = existing ?? new Date().toISOString();
  }

  const run = () =>
    id
      ? supabase.from("posts").update(row).eq("id", id).select().single()
      : supabase.from("posts").insert(row).select().single();

  let { data, error } = await run();
  if (error?.code === "23505") {
    row.slug = `${row.slug}-${Math.random().toString(36).slice(2, 6)}`;
    ({ data, error } = await run());
  }
  if (error) return { ok: false, error: error.message };
  refresh(String(row.slug));
  return { ok: true, row: data };
}

export async function deletePost(id: string): Promise<R> {
  const supabase = await requireAdmin();
  const { error } = await supabase.from("posts").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  refresh();
  return { ok: true };
}
