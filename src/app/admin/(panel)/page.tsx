import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";

const TABLES: [string, string, string][] = [
  ["tools", "Tools", "/admin/tools"], ["skills", "Skills", "/admin/skills"],
  ["experiences", "Experience", "/admin/experience"], ["education", "Education", "/admin/education"],
  ["achievements", "Achievements", "/admin/achievements"], ["projects", "Projects", "/admin/projects"],
  ["testimonials", "Testimonials", "/admin/testimonials"],
];

async function Stats() {
  await connection();
  const supabase = await createClient();
  const count = async (t: string, f?: (q: any) => any) => {
    let q: any = supabase.from(t).select("*", { count: "exact", head: true });
    if (f) q = f(q);
    return (await q).count ?? 0;
  };
  const [unread, drafts, hidden, ...totals] = await Promise.all([
    count("messages", (q) => q.eq("is_read", false)),
    count("projects", (q) => q.eq("published", false)),
    count("sections", (q) => q.eq("visible", false)),
    ...TABLES.map(([t]) => count(t)),
  ]);
  const { data: profile } = await supabase.from("profile").select("full_name, headline, avatar_url, resume_url").eq("id", 1).single();
  const { data: mf } = await supabase.auth.mfa.listFactors();
  const checks = [
    ["Name", profile?.full_name], ["Headline", profile?.headline],
    ["Photo", profile?.avatar_url], ["Resume", profile?.resume_url], ["Two-factor login", mf?.totp?.length],
  ];
  const card = "rounded-xl border bg-white p-5";
  return (
    <div className="flex max-w-5xl flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <Link href="/admin/inbox" className={card}><div className="text-sm text-neutral-500">Unread messages</div><div className="text-3xl font-semibold">{unread}</div></Link>
        <Link href="/admin/projects" className={card}><div className="text-sm text-neutral-500">Draft projects</div><div className="text-3xl font-semibold">{drafts}</div></Link>
        <Link href="/admin/sections" className={card}><div className="text-sm text-neutral-500">Hidden sections</div><div className="text-3xl font-semibold">{hidden}</div></Link>
      </div>
      <div className={card}>
        <h2 className="mb-3 font-semibold">Content</h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {TABLES.map(([, label, href], i) => (
            <Link key={label} href={href} className="rounded-lg border p-3 hover:bg-neutral-50">
              <div className="text-sm text-neutral-500">{label}</div><div className="text-2xl font-semibold">{totals[i]}</div>
            </Link>
          ))}
        </div>
      </div>
      <div className={card}>
        <h2 className="mb-3 font-semibold">Profile checklist</h2>
        <ul className="grid gap-2 sm:grid-cols-2">
          {checks.map(([l, v]) => (
            <li key={l as string} className="flex items-center gap-2 text-sm">
              <span className={v ? "text-green-600" : "text-amber-600"}>{v ? "✓" : "○"}</span>{l}
            </li>
          ))}
        </ul>
        <Link href="/admin/profile" className="mt-3 inline-block text-sm text-indigo-600 underline">Edit profile</Link>
      </div>
    </div>
  );
}

export default function Dashboard() {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold">Dashboard</h1>
      <Suspense fallback={<p>Loading…</p>}><Stats /></Suspense>
    </div>
  );
}
