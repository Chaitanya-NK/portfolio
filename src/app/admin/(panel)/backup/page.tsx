import { Suspense } from "react";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { BackupManager } from "./backup-manager";

async function Loader() {
  await connection();
  const supabase = await createClient();
  const { data } = await supabase
    .from("audit_logs").select("created_at, meta").eq("action", "backup")
    .order("created_at", { ascending: false }).limit(1);
  const row = data?.[0] as { created_at: string; meta?: { label?: string } } | undefined;
  return <BackupManager last={row?.created_at ?? null} lastLabel={row?.meta?.label ?? null} />;
}

export default function Page() {
  return (
    <div>
      <h1 className="mb-1 text-2xl font-semibold">Backup &amp; restore</h1>
      <p className="mb-6 text-sm text-neutral-600">Keep a copy of everything you’ve written, and bring it back if something goes wrong.</p>
      <Suspense fallback={<p>Loading…</p>}><Loader /></Suspense>
    </div>
  );
}
