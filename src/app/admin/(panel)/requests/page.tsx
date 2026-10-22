import { Suspense } from "react";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { RequestsView } from "./requests-view";

async function Loader() {
  await connection();
  const supabase = await createClient();
  const { data } = await supabase.from("testimonial_requests").select("*").order("created_at", { ascending: false });
  return <RequestsView initial={data ?? []} />;
}

export default function Page() {
  return (
    <div>
      <h1 className="mb-1 text-2xl font-semibold">Testimonial requests</h1>
      <Suspense fallback={<p>Loading…</p>}><Loader /></Suspense>
    </div>
  );
}
