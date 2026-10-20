import { Suspense } from "react";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { Inbox } from "./inbox";

async function Loader() {
  await connection();
  const supabase = await createClient();
  const { data } = await supabase.from("messages").select("*").order("created_at", { ascending: false });
  return <Inbox initial={data ?? []} />;
}
export default function Page() {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold">Inbox</h1>
      <Suspense fallback={<p>Loading…</p>}><Loader /></Suspense>
    </div>
  );
}
