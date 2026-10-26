import type { SiteData } from "@/lib/site/data";

const t = (v: unknown, n = 500) => String(v ?? "").replace(/\s+/g, " ").trim().slice(0, n);
const ym = (s?: string | null) => (s ? String(s).slice(0, 7) : "");

// only content that is already public on the site goes in here (never phone, messages or admin data)
export function buildContext(d: SiteData): string {
  const p = d.profile;
  const out: string[] = [];
  const add = (title: string, lines: (string | false | null | undefined)[]) => {
    const l = lines.filter(Boolean) as string[];
    if (l.length) out.push(`${title}:\n${l.join("\n")}`);
  };

  add("PROFILE", [
    `Name: ${t(p.full_name)}`,
    p.headline && `Headline: ${t(p.headline)}`,
    p.location && `Location: ${t(p.location)}`,
    p.availability && `Availability: ${t(p.availability)}`,
    p.bio && `About: ${t(p.bio, 900)}`,
    p.name_phonetic && `How the name is pronounced: ${t(p.name_phonetic, 120)}${p.name_audio_url ? " (there is an audio recording on the site, under the Hear my name button)" : ""}`,
    p.email && `Email: ${t(p.email, 100)}`,
    ...((p.stats ?? []) as Record<string, string>[]).map((s) => `Stat: ${t(s.value, 30)} ${t(s.label, 60)}`),
  ]);

  add("EXPERIENCE", d.experiences.flatMap((e) =>
    ((e.roles ?? []) as Record<string, any>[]).map((r) =>
      `- ${t(r.title, 100)} at ${t(e.company, 100)} (${ym(r.start_date)} to ${r.is_current ? "present" : ym(r.end_date) || "n/a"})` +
      (r.summary ? `. ${t(r.summary, 300)}` : "") +
      (r.bullets?.length ? `. Highlights: ${r.bullets.map((b: string) => t(b, 200)).join("; ")}` : "") +
      (e.tech?.length ? `. Tech: ${e.tech.join(", ")}` : "")
    )
  ));

  const groups = new Map<string, string[]>();
  d.skills.forEach((s) => groups.set(s.category, [...(groups.get(s.category) ?? []), `${s.name} (${s.level}/5)`]));
  add("SKILLS", [...groups].map(([c, n]) => `- ${c}: ${n.join(", ")}`));
  add("TOOLS", d.tools.length ? [d.tools.map((x) => x.name).join(", ")] : []);

  add("PROJECTS", d.projects.map((x) =>
    `- ${t(x.title, 100)}${x.year ? ` (${x.year})` : ""}${x.role ? `, role: ${t(x.role, 80)}` : ""}${x.summary ? `. ${t(x.summary, 250)}` : ""}` +
    (x.description ? ` ${t(x.description, 400)}` : "") +
    (x.tags?.length ? ` Tech: ${x.tags.join(", ")}.` : "") +
    (x.metrics?.length ? ` Results: ${x.metrics.map((m: Record<string, string>) => `${t(m.value, 30)} ${t(m.label, 60)}`).join(", ")}.` : "") +
    (x.live_url ? ` Live: ${x.live_url}` : "") + (x.repo_url ? ` Code: ${x.repo_url}` : "")
  ));
  add("EDUCATION", d.education.map((e) => `- ${t(e.degree, 100)}, ${t(e.institution, 100)} ${[e.start_year, e.end_year].filter(Boolean).join("-")}${e.grade ? ` (${t(e.grade, 40)})` : ""}`));
  add("ACHIEVEMENTS", d.achievements.map((a) => `- ${t(a.title, 120)}${a.issuer ? `, ${t(a.issuer, 80)}` : ""}${a.year ? ` (${a.year})` : ""}${a.description ? `. ${t(a.description, 200)}` : ""}`));
  add("SERVICES", d.services.map((s) => `- ${t(s.title, 100)}${s.price_label ? ` (${t(s.price_label, 50)}${s.price_note ? ` ${t(s.price_note, 50)}` : ""})` : ""}${s.description ? `: ${t(s.description, 250)}` : ""}`));
  add("BLOG POSTS", d.posts.map((x) => `- ${t(x.title, 120)}`));
  add("LINKS", ((p.socials ?? []) as Record<string, string>[]).map((s) => `- ${t(s.platform ?? s.label, 30)}: ${t(s.url, 200)}`));

  return out.join("\n\n").slice(0, 14000);
}
