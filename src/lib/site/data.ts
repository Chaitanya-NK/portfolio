import { cacheLife, cacheTag } from "next/cache";
import { createPublicClient } from "@/lib/supabase/public";

export type Row = Record<string, any>;

export async function getSiteData() {
  "use cache";
  cacheTag("site");
  cacheLife("minutes");

  const sb = createPublicClient();
  const now = new Date().toISOString();
  const pub = (t: string) => sb.from(t).select("*").eq("published", true).order("sort_order");

  const [profile, sections, tools, skills, experiences, education, achievements, projects, testimonials, items, posts] =
    await Promise.all([
      sb.from("profile").select("*").eq("id", 1).single(),
      sb.from("sections").select("*").eq("visible", true).order("sort_order"),
      pub("tools"), pub("skills"), pub("experiences"), pub("education"), pub("achievements"),
      sb.from("projects").select("*").eq("published", true)
        .or(`publish_at.is.null,publish_at.lte.${now}`).order("sort_order"),
      pub("testimonials"),
      pub("section_items"),
      sb.from("posts")
        .select("id,slug,title,excerpt,cover_url,tags,reading_minutes,published_at")
        .eq("status", "published").or(`publish_at.is.null,publish_at.lte.${now}`)
        .order("published_at", { ascending: false }).limit(6),
    ]);

  const itemsBySection: Record<string, Row[]> = {};
  for (const it of (items.data ?? []) as Row[]) (itemsBySection[it.section_id] ??= []).push(it);

  return {
    profile: (profile.data ?? {}) as Row,
    sections: (sections.data ?? []) as Row[],
    tools: (tools.data ?? []) as Row[],
    skills: (skills.data ?? []) as Row[],
    experiences: (experiences.data ?? []) as Row[],
    education: (education.data ?? []) as Row[],
    achievements: (achievements.data ?? []) as Row[],
    projects: (projects.data ?? []) as Row[],
    testimonials: (testimonials.data ?? []) as Row[],
    posts: (posts.data ?? []) as Row[],
    itemsBySection,
    year: new Date().getFullYear(),
  };
}

export type SiteData = Awaited<ReturnType<typeof getSiteData>>;

export async function getPost(slug: string) {
  "use cache";
  cacheTag("site");
  cacheLife("minutes");
  const sb = createPublicClient();
  const now = new Date().toISOString();
  const { data } = await sb.from("posts").select("*").eq("slug", slug).eq("status", "published")
    .or(`publish_at.is.null,publish_at.lte.${now}`).maybeSingle();
  return (data ?? null) as Row | null;
}

export async function getAllPosts() {
  "use cache";
  cacheTag("site");
  cacheLife("minutes");
  const sb = createPublicClient();
  const now = new Date().toISOString();
  const { data } = await sb
    .from("posts")
    .select("id,slug,title,excerpt,cover_url,tags,reading_minutes,published_at,updated_at")
    .eq("status", "published")
    .or(`publish_at.is.null,publish_at.lte.${now}`)
    .order("published_at", { ascending: false });
  return (data ?? []) as Row[];
}

export async function getProject(slug: string) {
  "use cache";
  cacheTag("site");
  cacheLife("minutes");
  const sb = createPublicClient();
  const now = new Date().toISOString();
  const { data } = await sb
    .from("projects").select("*").eq("slug", slug).eq("published", true)
    .or(`publish_at.is.null,publish_at.lte.${now}`).maybeSingle();
  return (data ?? null) as Row | null;
}
