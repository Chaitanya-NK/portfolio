"use server";
import { requireAdmin } from "@/lib/auth";

export async function getAnalytics(days: number) {
  const supabase = await requireAdmin();
  const d = [7, 30, 90].includes(days) ? days : 30;
  const { data, error } = await supabase.rpc("analytics_summary", { p_days: d });
  if (error) return { ok: false as const, error: error.message };
  return { ok: true as const, data };
}
