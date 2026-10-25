import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { contentIssues } from "@/lib/health";
import { LiveVisitors } from "@/components/admin/live-visitors";

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
  const issues = await contentIssues(supabase);
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
    <div className="flex max-w-none flex-col gap-6">
      <LiveVisitors />
      <div className="grid gap-4 sm:grid-cols-3">
        <Link href="/admin/inbox" className={card}><div className="text-sm text-neutral-500">Unread messages</div><div className="text-3xl font-semibold">{unread}</div></Link>
        <Link href="/admin/projects" className={card}><div className="text-sm text-neutral-500">Draft projects</div><div className="text-3xl font-semibold">{drafts}</div></Link>
        <Link href="/admin/sections" className={card}><div className="text-sm text-neutral-500">Hidden sections</div><div className="text-3xl font-semibold">{hidden}</div></Link>
      </div>
      <div className={card}>
        <h2 className="mb-3 font-semibold">Content</h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 2xl:grid-cols-7">
          {TABLES.map(([, label, href], i) => (
            <Link key={label} href={href} className="rounded-lg border p-3 hover:bg-neutral-50">
              <div className="text-sm text-neutral-500">{label}</div><div className="text-2xl font-semibold">{totals[i]}</div>
            </Link>
          ))}
        </div>
      </div>
      <div className={card}>
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="font-semibold">Content health</h2>
          <Link href="/admin/checker" className="text-sm text-indigo-600 underline">Open checker</Link>
        </div>
        {issues.length === 0 ? (
          <p className="text-sm text-green-700">✓ Everything looks good.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {issues.slice(0, 6).map((i) => (
              <li key={i.id}>
                <Link href={i.items.length === 1 ? i.items[0].href : "/admin/checker"} className="flex items-start gap-2 text-sm hover:underline">
                  <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${i.level === "error" ? "bg-red-500" : i.level === "warn" ? "bg-amber-500" : "bg-sky-500"}`} />
                  {i.message}
                </Link>
              </li>
            ))}
          </ul>
        )}
        {issues.length > 6 && <p className="mt-3 text-xs text-neutral-500">+ {issues.length - 6} more in the checker</p>}
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
