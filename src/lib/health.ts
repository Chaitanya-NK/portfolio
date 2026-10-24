import type { SupabaseClient } from "@supabase/supabase-js";

export type Level = "error" | "warn" | "info";
export type Item = { label: string; href: string };
export type Issue = { id: string; level: Level; area: string; message: string; items: Item[] };

const rows = (r: { data: unknown }) => (r.data ?? []) as any[];
const published = (r: { data: unknown }) => rows(r).filter((x) => x.published).length;
const words = (h: string) => h.replace(/<[^>]+>/g, " ").split(/\s+/).filter(Boolean).length;
const s = (n: number, a: string, b: string) => (n === 1 ? a : b);

const HREF: Record<string, string> = {
  tools: "/admin/tools", skills: "/admin/skills", experience: "/admin/experience",
  education: "/admin/education", achievements: "/admin/achievements", projects: "/admin/projects",
  testimonials: "/admin/testimonials", services: "/admin/services", blog: "/admin/blog",
};

export async function contentIssues(sb: SupabaseClient): Promise<Issue[]> {
  const [profile, sections, projects, posts, tools, skills, exps, edu, ach, tests, services, msgs, reqs] = await Promise.all([
    sb.from("profile").select("*").eq("id", 1).maybeSingle(),
    sb.from("sections").select("type,title,visible"),
    sb.from("projects").select("id,title,summary,cover_url,live_url,repo_url,tags,published"),
    sb.from("posts").select("id,title,excerpt,cover_url,tags,seo_title,content_html,status"),
    sb.from("tools").select("id,name,icon_url,published"),
    sb.from("skills").select("id,published"),
    sb.from("experiences").select("id,company,logo_url,roles,published"),
    sb.from("education").select("id,published"),
    sb.from("achievements").select("id,published"),
    sb.from("testimonials").select("id,published"),
    sb.from("services").select("id,published"),
    sb.from("messages").select("id").eq("is_read", false),
    sb.from("testimonial_requests").select("id").eq("status", "submitted"),
  ]);

  const P: any = profile.data ?? {};
  const out: Issue[] = [];
  const add = (id: string, level: Level, area: string, items: Item[], text: (n: number) => string) => {
    if (items.length) out.push({ id, level, area, message: text(items.length), items });
  };
  const one = (id: string, level: Level, area: string, ok: boolean, message: string, href: string) => {
    if (!ok) out.push({ id, level, area, message, items: [{ label: "Fix", href }] });
  };

  // site status
  one("maint", "error", "Site", !P.theme?.maintenance, "Maintenance mode is ON. Visitors see a “back soon” page.", "/admin/settings");
  one("avail-expired", "info", "Site", !(P.theme?.availability_until && new Date(P.theme.availability_until) <= new Date()),
    "Your availability badge has expired and is now hidden. Set a new date in Settings if you’re still open to work.", "/admin/settings");

  // profile
  one("p-name", "error", "Profile", !!P.full_name, "Your name is empty.", "/admin/profile");
  one("p-headline", "warn", "Profile", !!P.headline, "No headline. It is the biggest text on your page.", "/admin/profile");
  one("p-bio", "warn", "Profile", !!P.bio, "No bio.", "/admin/profile");
  one("p-photo", "info", "Profile", !!P.avatar_url, "No profile photo.", "/admin/profile");
  one("p-email", "warn", "Profile", !!P.email, "No email address. People can only reach you through the form.", "/admin/profile");
  one("p-resume", "info", "Profile", !!P.resume_url || P.theme?.resume_mode === "generated",
    "No resume available. Upload a PDF or switch to the generated resume in Settings.", "/admin/settings");
  const st = String(P.seo?.title ?? "").trim();
  const sd = String(P.seo?.description ?? "").trim();
  one("p-seot", "warn", "SEO", !!st, "No SEO page title. Google will build one from your name and headline.", "/admin/profile");
  one("p-seot-long", "warn", "SEO", st.length <= 60, `Your SEO title is ${st.length} characters. Google cuts it off after about 60.`, "/admin/profile");
  one("p-seod", "warn", "SEO", !!sd, "No meta description. It is the text shown under your link in search results.", "/admin/profile");
  one("p-seod-long", "warn", "SEO", sd.length <= 160, `Your meta description is ${sd.length} characters. Keep it under 160.`, "/admin/profile");
  one("p-favicon", "info", "SEO", !!P.theme?.favicon_url, "No favicon uploaded.", "/admin/settings");
  one("p-share", "info", "SEO", !!P.theme?.share_image_url, "No share image. Shared links use an auto-generated card.", "/admin/settings");

  // empty visible sections
  const counts: Record<string, number> = {
    tools: published(tools), skills: published(skills), experience: published(exps), education: published(edu),
    achievements: published(ach), projects: published(projects), testimonials: published(tests),
    services: published(services), blog: rows(posts).filter((p) => p.status === "published").length,
  };
  for (const sec of rows(sections)) {
    if (!sec.visible || !(sec.type in counts) || counts[sec.type] > 0) continue;
    out.push({
      id: `empty-${sec.type}`, level: "info", area: "Sections",
      message: `No ${String(sec.title).toLowerCase()} yet. The “${sec.title}” section stays hidden on your site until you add some.`,
      items: [{ label: "Add one", href: HREF[sec.type] }],
    });
  }

  // projects
  const pubProj = rows(projects).filter((p) => p.published);
  const proj = (f: (p: any) => boolean): Item[] => pubProj.filter(f).map((p) => ({ label: p.title, href: `/admin/projects?edit=${p.id}` }));
  add("proj-cover", "warn", "Projects", proj((p) => !p.cover_url), (n) => `${n} ${s(n, "project has", "projects have")} no cover image.`);
  add("proj-summary", "warn", "Projects", proj((p) => !p.summary?.trim()), (n) => `${n} ${s(n, "project has", "projects have")} no one-line summary.`);
  add("proj-live", "info", "Projects", proj((p) => !p.live_url), (n) => `${n} ${s(n, "project has", "projects have")} no Live link.`);
  add("proj-tags", "info", "Projects", proj((p) => !(p.tags?.length)), (n) => `${n} ${s(n, "project has", "projects have")} no tech tags.`);
  add("proj-long", "info", "Projects", proj((p) => String(p.title).length > 60), (n) => `${n} project ${s(n, "title is", "titles are")} longer than 60 characters.`);
  const drafts = rows(projects).filter((p) => !p.published).map((p) => ({ label: p.title, href: `/admin/projects?edit=${p.id}` }));
  add("proj-drafts", "info", "Projects", drafts, (n) => `${n} draft ${s(n, "project is", "projects are")} not published yet.`);

  // blog
  const pubPosts = rows(posts).filter((p) => p.status === "published");
  const post = (f: (p: any) => boolean): Item[] => pubPosts.filter(f).map((p) => ({ label: p.title, href: `/admin/blog/${p.id}` }));
  add("post-excerpt", "warn", "Blog posts", post((p) => !p.excerpt?.trim()), (n) => `${n} published ${s(n, "post has", "posts have")} no excerpt.`);
  add("post-title", "warn", "Blog posts", post((p) => String(p.title).length > 60 && !p.seo_title?.trim()),
    (n) => `${n} ${s(n, "post title is", "post titles are")} over 60 characters with no shorter SEO title.`);
  add("post-cover", "info", "Blog posts", post((p) => !p.cover_url), (n) => `${n} published ${s(n, "post has", "posts have")} no cover image.`);
  add("post-tags", "info", "Blog posts", post((p) => !(p.tags?.length)), (n) => `${n} published ${s(n, "post has", "posts have")} no tags.`);
  add("post-short", "info", "Blog posts", post((p) => words(String(p.content_html ?? "")) < 150), (n) => `${n} ${s(n, "post is", "posts are")} very short (under 150 words).`);
  add("post-h2", "info", "Blog posts", post((p) => { const h = String(p.content_html ?? ""); return words(h) > 600 && !/<h2/i.test(h); }),
    (n) => `${n} long ${s(n, "post has", "posts have")} no subheadings.`);
  const altItems: Item[] = [];
  for (const p of pubPosts) {
    const imgs = String(p.content_html ?? "").match(/<img\b[^>]*>/gi) ?? [];
    const bad = imgs.filter((t) => !/\balt="[^"]+"/i.test(t)).length;
    if (bad) altItems.push({ label: `${p.title} (${bad} ${s(bad, "image", "images")})`, href: `/admin/blog/${p.id}` });
  }
  add("post-alt", "warn", "Blog posts", altItems, (n) => `${n} ${s(n, "post has", "posts have")} images with no alt text.`);
  const draftPosts = rows(posts).filter((p) => p.status !== "published").map((p) => ({ label: p.title, href: `/admin/blog/${p.id}` }));
  add("post-drafts", "info", "Blog posts", draftPosts, (n) => `${n} blog ${s(n, "draft is", "drafts are")} unpublished.`);

  // experience and tools
  const exp = rows(exps).filter((e) => e.published);
  add("exp-logo", "info", "Experience", exp.filter((e) => !e.logo_url).map((e) => ({ label: e.company, href: `/admin/experience?edit=${e.id}` })),
    (n) => `${n} ${s(n, "company has", "companies have")} no logo.`);
  add("exp-dates", "info", "Experience",
    exp.filter((e) => (e.roles ?? []).some((r: any) => !r.start_date)).map((e) => ({ label: e.company, href: `/admin/experience?edit=${e.id}` })),
    (n) => `${n} ${s(n, "company has", "companies have")} roles with no start date.`);
  add("tool-icon", "info", "Tools", rows(tools).filter((t) => t.published && !t.icon_url).map((t) => ({ label: t.name, href: `/admin/tools?edit=${t.id}` })),
    (n) => `${n} ${s(n, "tool has", "tools have")} no icon (a letter is shown instead).`);

  // inbox
  add("msg-unread", "info", "Inbox", rows(msgs).slice(0, 1).map(() => ({ label: "Open inbox", href: "/admin/inbox" })), () =>
    `${rows(msgs).length} unread ${s(rows(msgs).length, "message", "messages")}.`);
  add("req-pending", "warn", "Inbox", rows(reqs).slice(0, 1).map(() => ({ label: "Review", href: "/admin/requests" })), () =>
    `${rows(reqs).length} testimonial ${s(rows(reqs).length, "submission needs", "submissions need")} your review.`);

  const rank = { error: 0, warn: 1, info: 2 };
  return out.sort((a, b) => rank[a.level] - rank[b.level]);
}
