import { Suspense } from "react";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { CONTENT } from "@/lib/content-config";
import { ContentManager } from "./manager";

async function Loader({ params }: { params: Promise<{ entity: string }> }) {
  await connection();
  const { entity } = await params;
  const cfg = CONTENT[entity];
  if (!cfg) notFound();
  const supabase = await createClient();
  const { data } = await supabase.from(cfg.table).select("*").order("sort_order");
  return (
    <div>
      <h1 className="mb-1 text-2xl font-semibold">{cfg.title}</h1>
      <p className="mb-6 text-sm text-neutral-600">
        Drag to reorder, toggle to publish or hide, and edit anything. Changes appear on the public site.
      </p>
      <ContentManager entity={entity} cfg={cfg} initial={data ?? []} />
    </div>
  );
}

export default function ContentPage({ params }: { params: Promise<{ entity: string }> }) {
  return (
    <Suspense fallback={<p>Loading…</p>}>
      <Loader params={params} />
    </Suspense>
  );
}
