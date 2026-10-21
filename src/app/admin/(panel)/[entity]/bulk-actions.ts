"use server";
import { revalidatePath, updateTag } from "next/cache";
import { requireAdmin } from "@/lib/auth";

type In = { name: string; category: string; icon_url: string };
type R = { ok: boolean; error?: string; created?: number; skipped?: number };

export async function bulkCreateTools(rows: In[]): Promise<R> {
  const supabase = await requireAdmin();
  const clean = rows
    .map((r) => ({
      name: String(r.name ?? "").trim().slice(0, 80),
      category: String(r.category ?? "").trim().slice(0, 60) || null,
      icon_url: String(r.icon_url ?? ""),
    }))
    .filter((r) => r.name && /^https?:\/\//.test(r.icon_url));
  if (!clean.length) return { ok: false, error: "Nothing to import" };

  const { data: existing } = await supabase.from("tools").select("name, sort_order");
  const have = new Set((existing ?? []).map((e) => e.name.toLowerCase()));
  let order = Math.max(0, ...(existing ?? []).map((e) => e.sort_order ?? 0));

  const seen = new Set<string>();
  const toInsert: Record<string, unknown>[] = [];
  let skipped = 0;
  for (const r of clean) {
    const k = r.name.toLowerCase();
    if (have.has(k) || seen.has(k)) { skipped++; continue; }
    seen.add(k);
    toInsert.push({ ...r, published: true, sort_order: ++order });
  }
  if (!toInsert.length) return { ok: true, created: 0, skipped };

  const { error } = await supabase.from("tools").insert(toInsert);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/");
  revalidatePath("/admin/tools");
  updateTag("site");
  return { ok: true, created: toInsert.length, skipped };
}
