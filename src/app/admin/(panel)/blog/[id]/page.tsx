import { Suspense } from "react";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { PostForm } from "./post-form";

async function Loader({ params }: { params: Promise<{ id: string }> }) {
  await connection();
  const { id } = await params;
  if (id === "new") return <PostForm post={null} />;
  const supabase = await createClient();
  const { data } = await supabase.from("posts").select("*").eq("id", id).maybeSingle();
  if (!data) notFound();
  return <PostForm post={data} />;
}

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  return <Suspense fallback={<p>Loading…</p>}><Loader params={params} /></Suspense>;
}
