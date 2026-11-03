"use server";
import { revalidatePath, updateTag } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { ALL_TABLES, CORE_TABLES, MESSAGE_TABLES, type Backup } from "@/lib/backup";

async function log(action: "backup" | "restore", actor: string | undefined, meta: Record<string, unknown>) {
  await createAdminClient().from("audit_logs").insert({ actor, action, entity: "backup", meta });
}

export async function exportBackup(includeMessages: boolean): Promise<{ ok: boolean; error?: string; json?: string; filename?: string; rows?: number }> {
  const supabase = await requireAdmin();
  const { data: { user } } = await supabase.auth.getUser();
  const names: string[] = includeMessages ? [...ALL_TABLES] : [...CORE_TABLES];
  const tables: Backup["tables"] = {};
  let rows = 0;
  for (const t of names) {
    const { data, error } = await supabase.from(t).select("*");
    if (error) return { ok: false, error: `${t}: ${error.message}` };
    tables[t] = (data ?? []).map(({ fts, ...r }: Record<string, any>) => r); // fts is generated, can't be restored
    rows += tables[t].length;
  }
  const b: Backup = {
    version: 1, app: "portfolio", exported_at: new Date().toISOString(),
    source_url: (process.env.NEXT_PUBLIC_SITE_URL ?? "").replace(/\/$/, ""), tables,
  };
  await log("backup", user?.id, { rows, tables: names.length });
  return { ok: true, json: JSON.stringify(b, null, 2), filename: `portfolio-backup-${b.exported_at.slice(0, 10)}.json`, rows };
}

/** Restores by upserting on id. Nothing is deleted, so rows you added since the backup stay. */
export async function restoreBackup(json: string): Promise<{ ok: boolean; error?: string; restored?: number }> {
  const supabase = await requireAdmin();
  const { data: { user } } = await supabase.auth.getUser();
  let b: Backup;
  try { b = JSON.parse(json); } catch { return { ok: false, error: "That file isn't valid JSON." }; }
  if (!b || b.app !== "portfolio" || b.version !== 1 || typeof b.tables !== "object" || !b.tables)
    return { ok: false, error: "This doesn't look like a backup made by this admin panel." };

  const order: string[] = [...CORE_TABLES, ...MESSAGE_TABLES];
  let restored = 0;
  for (const t of order) {
    const rows = (Array.isArray(b.tables[t]) ? b.tables[t] : []).map(({ fts, ...r }: Record<string, any>) => r);
    if (!rows.length) continue;
    for (let i = 0; i < rows.length; i += 200) {
      const { error } = await supabase.from(t).upsert(rows.slice(i, i + 200), { onConflict: "id" });
      if (error) return { ok: false, error: `${t}: ${error.message}`, restored };
    }
    restored += rows.length;
  }
  await log("restore", user?.id, { rows: restored, from: b.exported_at });
  revalidatePath("/");
  revalidatePath("/admin", "layout");
  updateTag("site");
  return { ok: true, restored };
}
