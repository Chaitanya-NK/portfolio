import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ItemsManager } from "./items";

async function Loader({ params }: { params: Promise<{ id: string }> }) {
  await connection();
  const { id } = await params;
  const supabase = await createClient();
  const { data: section } = await supabase.from("sections").select("id,title,type").eq("id", id).maybeSingle();
  if (!section || section.type !== "custom") notFound();
  const { data: items } = await supabase.from("section_items").select("id,data,published").eq("section_id", id).order("sort_order");
  return (
    <div>
      <Link href="/admin/sections" className="text-sm text-indigo-600 underline">← Section builder</Link>
      <h1 className="mb-1 mt-2 text-2xl font-semibold">{section.title}</h1>
      <p className="mb-6 text-sm text-neutral-600">Items shown inside this custom section.</p>
      <ItemsManager sid={id} initial={items ?? []} />
    </div>
  );
}

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  return <Suspense fallback={<p>Loading…</p>}><Loader params={params} /></Suspense>;
}
