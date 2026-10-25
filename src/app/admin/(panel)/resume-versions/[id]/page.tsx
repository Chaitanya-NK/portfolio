import { Suspense } from "react";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { toPublicExperience } from "@/lib/roles";
import { VersionForm } from "./version-form";

async function Loader({ params }: { params: Promise<{ id: string }> }) {
  await connection();
  const { id } = await params;
  const supabase = await createClient();
  const [skills, exps, projects, ver] = await Promise.all([
    supabase.from("skills").select("id,category,name").eq("published", true).order("sort_order"),
    supabase.from("experiences").select("*").eq("published", true).order("sort_order"),
    supabase.from("projects").select("id,title,featured").eq("published", true).order("sort_order"),
    id === "new" ? Promise.resolve({ data: null }) : supabase.from("resume_versions").select("*").eq("id", id).maybeSingle(),
  ]);
  if (id !== "new" && !ver.data) notFound();
  const experiences = ((exps.data ?? []) as Record<string, any>[]).map((e) => {
    const pe = toPublicExperience(e);
    return { id: e.id as string, company: e.company as string, roles: (pe.roles as any[]).map((r) => ({ title: r.title as string, bullets: (r.bullets ?? []) as string[] })) };
  });
  return <VersionForm version={ver.data} skills={skills.data ?? []} experiences={experiences} projects={projects.data ?? []} />;
}

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  return <Suspense fallback={<p>Loading…</p>}><Loader params={params} /></Suspense>;
}
