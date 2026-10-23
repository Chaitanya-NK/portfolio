export type Role = {
  title: string;
  start_date: string | null;
  end_date: string | null;
  is_current: boolean;
  summary: string | null;
  bullets: string[];
};

const iso = (v: unknown) => {
  const s = String(v ?? "").slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : null;
};

export function normalizeRoles(v: unknown): Role[] {
  if (!Array.isArray(v)) return [];
  return v
    .map((r: any) => {
      const current = Boolean(r?.is_current);
      const bullets = Array.isArray(r?.bullets) ? r.bullets : String(r?.bullets ?? "").split("\n");
      return {
        title: String(r?.title ?? "").trim().slice(0, 120),
        start_date: iso(r?.start_date),
        end_date: current ? null : iso(r?.end_date),
        is_current: current,
        summary: String(r?.summary ?? "").trim().slice(0, 600) || null,
        bullets: bullets.map((b: unknown) => String(b).trim()).filter(Boolean).slice(0, 15),
      } as Role;
    })
    .filter((r) => r.title)
    .slice(0, 12);
}

// current role first, then newest start date, otherwise keep the entered order
export function sortRoles(roles: Role[]): Role[] {
  return roles
    .map((r, i) => ({ r, i }))
    .sort((a, b) => {
      if (a.r.is_current !== b.r.is_current) return a.r.is_current ? -1 : 1;
      const sa = a.r.start_date ?? "";
      const sb = b.r.start_date ?? "";
      if (sa !== sb) return sa < sb ? 1 : -1;
      return a.i - b.i;
    })
    .map((x) => x.r);
}

// keeps the old single-role columns in sync so lists and older code keep working
export function deriveFromRoles(roles: Role[]) {
  const latest = sortRoles(roles)[0];
  const starts = roles.map((r) => r.start_date).filter(Boolean) as string[];
  return {
    role: latest.title,
    start_date: starts.length ? [...starts].sort()[0] : null,
    end_date: latest.is_current ? null : latest.end_date,
    is_current: latest.is_current,
    summary: latest.summary,
    bullets: latest.bullets,
  };
}

const monthIndex = (s: string) => {
  const [y, m] = s.split("-").map(Number);
  return y * 12 + (m - 1);
};

export function tenureLabel(roles: Role[], now = new Date()): string {
  const nowIdx = now.getFullYear() * 12 + now.getMonth();
  const spans = roles
    .filter((r) => r.start_date)
    .map((r) => {
      const s = monthIndex(r.start_date!);
      const e = r.is_current ? nowIdx : r.end_date ? monthIndex(r.end_date) : s;
      return [s, Math.max(s, e) + 1] as [number, number];
    })
    .sort((a, b) => a[0] - b[0]);

  let total = 0;
  let cur: [number, number] | null = null;
  for (const sp of spans) {
    if (!cur) cur = [sp[0], sp[1]];
    else if (sp[0] <= cur[1]) cur[1] = Math.max(cur[1], sp[1]);
    else { total += cur[1] - cur[0]; cur = [sp[0], sp[1]]; }
  }
  if (cur) total += cur[1] - cur[0];
  if (total <= 0) return "";
  const y = Math.floor(total / 12);
  const m = total % 12;
  return [y ? `${y} yr${y > 1 ? "s" : ""}` : "", m ? `${m} mo${m > 1 ? "s" : ""}` : ""].filter(Boolean).join(" ");
}

// used by the public site: old entries (no roles yet) become a single role
export function toPublicExperience(e: Record<string, any>): Record<string, any> {
  let roles = normalizeRoles(e.roles);
  if (!roles.length) {
    roles = normalizeRoles([{
      title: e.role, start_date: e.start_date, end_date: e.end_date,
      is_current: e.is_current, summary: e.summary, bullets: e.bullets,
    }]);
  }
  return { ...e, roles: sortRoles(roles), tenure: tenureLabel(roles) };
}
