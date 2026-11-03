import type { Row } from "./data";

// "Next.js", "NextJS" and "nextjs" are the same skill; "C#" is "csharp"
export const skillKey = (s: string) => {
  const k = String(s).toLowerCase().replace(/#/g, "sharp").replace(/\+/g, "plus").replace(/[^a-z0-9]/g, "");
  return k.length > 4 ? k.replace(/js$/, "") : k;
};

export type SkillUse = {
  projects: { title: string; href: string; year?: number | null }[];
  roles: { title: string; org: string }[];
};

/** Which projects (by tech tag) and jobs (by tech used) mention each skill. Keyed by skill id. */
export function skillUsage(skills: Row[], projects: Row[], experiences: Row[]): Record<string, SkillUse> {
  const out: Record<string, SkillUse> = {};
  for (const s of skills) {
    const k = skillKey(s.name);
    if (!k) continue;
    const ps = projects
      .filter((p) => (p.tags ?? []).some((t: string) => skillKey(t) === k))
      .map((p) => ({ title: p.title as string, href: `/projects/${p.slug}`, year: p.year as number | null }));
    const rs = experiences
      .filter((e) => (e.tech ?? []).some((t: string) => skillKey(t) === k))
      .map((e) => {
        const roles: Row[] = e.roles ?? [];
        return { title: String(roles[0]?.title ?? e.role ?? "Role"), org: String(e.company) };
      });
    if (ps.length || rs.length) out[s.id] = { projects: ps, roles: rs };
  }
  return out;
}
