"use server";
import { requireAdmin } from "@/lib/auth";

export async function getLive() {
  const sb = await requireAdmin();
  const cutoff = new Date(Date.now() - 100_000).toISOString();
  const { data } = await sb.from("live_presence").select("path").gte("seen_at", cutoff);
  const rows = (data ?? []) as { path: string }[];
  const by = new Map<string, number>();
  rows.forEach((r) => by.set(r.path, (by.get(r.path) ?? 0) + 1));
  return {
    count: rows.length,
    pages: [...by].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([path, n]) => ({ path, n })),
  };
}
