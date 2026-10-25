import type { Row, SiteData } from "@/lib/site/data";
import { roleKey } from "@/lib/roles";

export type ResumeData = {
  profile: Row; experiences: Row[]; projects: Row[]; skills: Row[]; education: Row[]; achievements: Row[];
};

const byFeatured = (a: Row, b: Row) => Number(b.featured) - Number(a.featured);

export function defaultResume(d: SiteData): ResumeData {
  return {
    profile: d.profile, experiences: d.experiences, skills: d.skills, education: d.education,
    achievements: d.achievements, projects: [...d.projects].sort(byFeatured).slice(0, 4),
  };
}

// an empty list means "everything" for skills and experience, and "the default top four" for projects
export function applyVersion(d: SiteData, v: Row): ResumeData {
  const hi = (v.highlights ?? {}) as Record<string, string[]>;
  const exp = new Set<string>(v.experience_ids ?? []);
  const skl = new Set<string>(v.skill_ids ?? []);
  const projIds: string[] = v.project_ids ?? [];

  const experiences = d.experiences
    .filter((e) => !exp.size || exp.has(e.id))
    .map((e) => ({
      ...e,
      roles: ((e.roles ?? []) as Row[]).map((r) => {
        const custom = hi[roleKey(e.id, r.title)];
        return Array.isArray(custom) && custom.length ? { ...r, bullets: custom } : r;
      }),
    }));

  const projects = projIds.length
    ? (projIds.map((id) => d.projects.find((p) => p.id === id)).filter(Boolean) as Row[])
    : [...d.projects].sort(byFeatured).slice(0, 4);

  return {
    profile: { ...d.profile, headline: v.headline || d.profile.headline, bio: v.summary || d.profile.bio },
    experiences,
    skills: d.skills.filter((s) => !skl.size || skl.has(s.id)),
    projects,
    education: d.education,
    achievements: v.show_achievements === false ? [] : d.achievements,
  };
}
