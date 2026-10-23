import { Suspense } from "react";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { contentIssues } from "@/lib/health";
import { CheckerView } from "./checker-view";

async function Loader() {
  await connection();
  const supabase = await createClient();
  return <CheckerView issues={await contentIssues(supabase)} />;
}

export default function Page() {
  return (
    <div>
      <h1 className="mb-1 text-2xl font-semibold">Content checker</h1>
      <p className="mb-6 text-sm text-neutral-600">Finds missing details, SEO problems and weak spots across your whole site.</p>
      <Suspense fallback={<p>Loading…</p>}><Loader /></Suspense>
    </div>
  );
}
