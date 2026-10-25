import { Suspense } from "react";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { VersionsList } from "./versions-list";

async function Loader() {
  await connection();
  const supabase = await createClient();
  const { data } = await supabase.from("resume_versions").select("id,slug,title,published,headline,updated_at").order("created_at");
  return <VersionsList initial={data ?? []} />;
}

export default function Page() {
  return (
    <div>
      <h1 className="mb-1 text-2xl font-semibold">Resume versions</h1>
      <p className="mb-6 text-sm text-neutral-600">Tailored resumes at their own links, for example <code>/resume/devops</code>. They aren’t linked from your site and search engines can’t see them.</p>
      <Suspense fallback={<p>Loading…</p>}><Loader /></Suspense>
    </div>
  );
}
