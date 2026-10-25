import { Suspense } from "react";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { SettingsForm } from "./settings-form";
import { aiConfigured } from "@/lib/ai";

async function Loader() {
  await connection();
  const supabase = await createClient();
  const { data } = await supabase.from("profile").select("theme").eq("id", 1).single();
  return <SettingsForm theme={data?.theme ?? {}} aiReady={aiConfigured()} />;
}

export default function Page() {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold">Settings</h1>
      <Suspense fallback={<p>Loading…</p>}><Loader /></Suspense>
    </div>
  );
}
