import { Suspense } from "react";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { NotesManager } from "./notes-manager";

async function Loader() {
  await connection();
  const supabase = await createClient();
  const { data } = await supabase.from("notes").select("*").order("pinned", { ascending: false }).order("created_at", { ascending: false });
  return <NotesManager initial={data ?? []} />;
}

export default function Page() {
  return (
    <div>
      <h1 className="mb-1 text-2xl font-semibold">Notes</h1>
      <p className="mb-6 text-sm text-neutral-600">Short “today I learned” updates. Pinned notes stay on top. The latest six show on your home page.</p>
      <Suspense fallback={<p>Loading…</p>}><Loader /></Suspense>
    </div>
  );
}
