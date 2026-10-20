import { Suspense } from "react";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ProfileForm } from "./profile-form";

async function Loader() {
  await connection();
  const supabase = await createClient();
  const { data } = await supabase.from("profile").select("*").eq("id", 1).single();
  return <ProfileForm p={data ?? {}} />;
}

export default function ProfilePage() {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold">Profile &amp; SEO</h1>
      <Suspense fallback={<p>Loading…</p>}><Loader /></Suspense>
    </div>
  );
}
