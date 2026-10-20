import { Suspense } from "react";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";

async function SectionList() {
  await connection();
  const supabase = await createClient();
  const { data: sections } = await supabase
    .from("sections")
    .select("title, visible, sort_order")
    .order("sort_order");
  return (
    <ul className="list-disc pl-5">
      {sections?.map((s) => (
        <li key={s.title}>{s.title} {s.visible ? "" : "(hidden)"}</li>
      ))}
    </ul>
  );
}

export default function Dashboard() {
  return (
    <div>
      <h1 className="mb-4 text-2xl font-semibold">Dashboard</h1>
      <p className="mb-2 text-sm text-muted-foreground">Sections loaded from Supabase:</p>
      <Suspense fallback={<p>Loading…</p>}>
        <SectionList />
      </Suspense>
    </div>
  );
}
