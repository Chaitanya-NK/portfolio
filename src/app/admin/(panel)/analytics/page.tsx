import { Suspense } from "react";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { AnalyticsView, type Summary } from "./analytics-view";

const empty: Summary = { views: 0, visitors: 0, daily: [], pages: [], referrers: [], devices: [], browsers: [], countries: [] };

async function Loader() {
  await connection();
  const supabase = await createClient();
  const { data } = await supabase.rpc("analytics_summary", { p_days: 30 });
  return <AnalyticsView initial={(data as Summary) ?? empty} />;
}

export default function Page() {
  return (
    <div>
      <h1 className="mb-1 text-2xl font-semibold">Analytics</h1>
      <p className="mb-6 text-sm text-neutral-600">Cookie-free and private. Visitors are anonymous daily hashes, bots are ignored, and the admin is never counted.</p>
      <Suspense fallback={<p>Loading…</p>}><Loader /></Suspense>
    </div>
  );
}
