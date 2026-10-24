import { Suspense } from "react";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { SignatureBuilder } from "./signature-builder";

async function Loader() {
  await connection();
  const supabase = await createClient();
  const { data } = await supabase.from("profile").select("full_name,headline,email,phone,avatar_url,resume_url,socials,theme").eq("id", 1).maybeSingle();
  const site = (process.env.NEXT_PUBLIC_SITE_URL ?? "").replace(/\/$/, "");
  return <SignatureBuilder p={data ?? {}} site={site.startsWith("https://") ? site : ""} />;
}

export default function Page() {
  return (
    <div>
      <h1 className="mb-1 text-2xl font-semibold">Email signature</h1>
      <p className="mb-6 text-sm text-neutral-600">Build a signature from your profile, then paste it into Gmail or Outlook.</p>
      <Suspense fallback={<p>Loading…</p>}><Loader /></Suspense>
    </div>
  );
}
