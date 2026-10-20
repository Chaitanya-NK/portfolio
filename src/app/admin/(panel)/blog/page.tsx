import { Suspense } from "react";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { PostsList } from "./posts-list";

async function Loader() {
  await connection();
  const supabase = await createClient();
  const { data } = await supabase
    .from("posts")
    .select("id,title,slug,status,publish_at,published_at,updated_at,tags,reading_minutes")
    .order("updated_at", { ascending: false });
  return <PostsList initial={data ?? []} />;
}

export default function Page() {
  return (
    <div>
      <h1 className="mb-1 text-2xl font-semibold">Blog posts</h1>
      <p className="mb-6 text-sm text-neutral-600">Write, schedule and publish posts for the Blog section.</p>
      <Suspense fallback={<p>Loading…</p>}><Loader /></Suspense>
    </div>
  );
}
