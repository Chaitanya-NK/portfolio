import { Suspense } from "react";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { SectionBuilder } from "./builder";

async function Loader() {
  await connection();
  const supabase = await createClient();
  const { data } = await supabase
    .from("sections").select("id,key,type,title,subtitle,visible").order("sort_order");
  return <SectionBuilder initial={data ?? []} />;
}

export default function SectionsPage() {
  return (
    <div>
      <h1 className="mb-1 text-2xl font-semibold">Section builder</h1>
      <p className="mb-6 text-sm text-neutral-600">
        Drag to reorder, toggle visibility, rename, or add custom sections. The public page follows this order.
      </p>
      <Suspense fallback={<p>Loading…</p>}><Loader /></Suspense>
    </div>
  );
}
