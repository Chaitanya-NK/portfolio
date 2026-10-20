import { Suspense } from "react";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { AuditLog } from "./audit-log";

async function Loader() {
  await connection();
  const supabase = await createClient();
  const { data } = await supabase.from("audit_logs").select("*").order("created_at", { ascending: false }).limit(300);
  return <AuditLog logs={data ?? []} />;
}

export default function Page() {
  return (
    <div>
      <h1 className="mb-1 text-2xl font-semibold">Audit log</h1>
      <p className="mb-6 text-sm text-neutral-600">Everything changed in the admin, plus sign-ins and failed sign-in attempts. Latest 300 entries.</p>
      <Suspense fallback={<p>Loading…</p>}><Loader /></Suspense>
    </div>
  );
}
