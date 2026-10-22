"use server";
import { requireAdmin } from "@/lib/auth";

export type Hit = { kind: string; id: string; title: string; sub?: string; href: string };

export async function searchAdmin(q: string): Promise<Hit[]> {
  const sb = await requireAdmin();
  const t = q.trim().slice(0, 60).replace(/[^\p{L}\p{N} @._+-]/gu, "");
  if (t.length < 2) return [];
  const p = `%${t}%`;
  const L = 5;
  const [projects, posts, tools, skills, exp, edu, ach, tests, msgs] = await Promise.all([
    sb.from("projects").select("id,title,year").ilike("title", p).limit(L),
    sb.from("posts").select("id,title,status").ilike("title", p).limit(L),
    sb.from("tools").select("id,name,category").ilike("name", p).limit(L),
    sb.from("skills").select("id,name,category").ilike("name", p).limit(L),
    sb.from("experiences").select("id,company,role").ilike("company", p).limit(L),
    sb.from("education").select("id,degree,institution").ilike("degree", p).limit(L),
    sb.from("achievements").select("id,title,issuer").ilike("title", p).limit(L),
    sb.from("testimonials").select("id,name,company").ilike("name", p).limit(L),
    sb.from("messages").select("id,name,email").or(`name.ilike.${p},email.ilike.${p},body.ilike.${p}`).limit(L),
  ]);
  const out: Hit[] = [];
  const add = (kind: string, rows: any[] | null, title: (r: any) => string, sub: (r: any) => string | undefined, href: (r: any) => string) =>
    (rows ?? []).forEach((r) => out.push({ kind, id: r.id, title: title(r) || "(untitled)", sub: sub(r), href: href(r) }));
  add("Projects", projects.data, (r) => r.title, (r) => r.year, (r) => `/admin/projects?edit=${r.id}`);
  add("Blog posts", posts.data, (r) => r.title, (r) => r.status, (r) => `/admin/blog/${r.id}`);
  add("Tools", tools.data, (r) => r.name, (r) => r.category, (r) => `/admin/tools?edit=${r.id}`);
  add("Skills", skills.data, (r) => r.name, (r) => r.category, (r) => `/admin/skills?edit=${r.id}`);
  add("Experience", exp.data, (r) => r.company, (r) => r.role, (r) => `/admin/experience?edit=${r.id}`);
  add("Education", edu.data, (r) => r.degree, (r) => r.institution, (r) => `/admin/education?edit=${r.id}`);
  add("Achievements", ach.data, (r) => r.title, (r) => r.issuer, () => `/admin/achievements`);
  add("Testimonials", tests.data, (r) => r.name, (r) => r.company, (r) => `/admin/testimonials?edit=${r.id}`);
  add("Messages", msgs.data, (r) => r.name || r.email, (r) => r.email, () => `/admin/inbox`);
  return out;
}
