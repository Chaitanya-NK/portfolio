"use server";
import { revalidatePath, updateTag } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { ALL_TABLES, CORE_TABLES, MESSAGE_TABLES, type Backup } from "@/lib/backup";

type Row = Record<string, any>;
const fail = (error: string) => ({ ok: false as const, error });

export async function exportBackup(opts: { messages: boolean; media: boolean; label?: string }) {
  const sb = await requireAdmin();
  const names: string[] = [...CORE_TABLES, ...(opts.messages ? MESSAGE_TABLES : [])];
  const tables: Backup["tables"] = {};

  for (const t of names) {
    const rows: Row[] = [];
    for (let from = 0; from < 20000; from += 1000) {
      const { data, error } = await sb.from(t).select("*").order("id").range(from, from + 999);
      if (error) return fail(`${t}: ${error.message}`);
      rows.push(...((data ?? []) as Row[]));
      if ((data ?? []).length < 1000) break;
    }
    tables[t] = rows.map(({ fts: _fts, ...rest }) => rest);
  }

  const files: { path: string; size: number }[] = [];
  if (opts.media) {
    const b = sb.storage.from("media");
    const o = { limit: 1000, sortBy: { column: "name", order: "asc" as const } };
    const { data: root } = await b.list("", o);
    const folders = (root ?? []).filter((x) => !x.id).map((x) => x.name);
    const add = (folder: string, list: any[] | null) =>
      (list ?? [])
        .filter((x) => x.id && x.name !== ".emptyFolderPlaceholder")
        .forEach((x) => files.push({ path: folder ? `${folder}/${x.name}` : x.name, size: x.metadata?.size ?? 0 }));
    add("", root);
    for (const f of folders) add(f, (await b.list(f, o)).data);
  }

  const backup: Backup = {
    version: 1, app: "portfolio", exported_at: new Date().toISOString(),
    source_url: process.env.NEXT_PUBLIC_SUPABASE_URL!, tables,
  };
  const counts = Object.fromEntries(Object.entries(tables).map(([k, v]) => [k, v.length]));

  const { data: { user } } = await sb.auth.getUser();
  await createAdminClient().from("audit_logs").insert({
    actor: user?.id ?? null, action: "backup", entity: "backup",
    meta: { label: opts.label ?? (opts.media ? "with media" : "content only"), counts },
  });
  revalidatePath("/admin/backup");
  return { ok: true as const, json: JSON.stringify(backup), files, counts };
}

export async function restoreBackup(text: string, mode: "merge" | "replace") {
  const sb = await requireAdmin();
  if (typeof text !== "string" || text.length > 3_000_000) return fail("That backup is too large to restore here (over 3 MB).");
  if (mode !== "merge" && mode !== "replace") return fail("Choose merge or replace.");

  let b: Backup;
  try { b = JSON.parse(text); } catch { return fail("That file isn’t valid JSON."); }

  // restoring into another Supabase project: point image links at this project
  const here = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  if (b?.source_url && b.source_url !== here) {
    try { b = JSON.parse(text.split(b.source_url).join(here)); } catch { return fail("That file couldn’t be read."); }
  }
  if (!b || b.version !== 1 || b.app !== "portfolio" || !b.tables || typeof b.tables !== "object")
    return fail("That doesn’t look like a backup from this portfolio.");

  const tables: Backup["tables"] = {};
  for (const t of ALL_TABLES) if (Array.isArray(b.tables[t])) tables[t] = b.tables[t];
  if (!Object.keys(tables).length) return fail("The backup contains no content.");

  if (mode === "merge") {
    // rows that already exist under a different id (same key or slug) are matched, not duplicated
    const fix = async (table: string, field: string) => {
      const idMap = new Map<string, string>();
      const rows = tables[table];
      if (!rows?.length) return idMap;
      const { data } = await sb.from(table).select(`id,${field}`);
      const byKey = new Map(((data ?? []) as any[]).map((e) => [e[field], e.id as string]));
      tables[table] = rows.map((r) => {
        const ex = byKey.get(r[field]);
        if (ex && ex !== r.id) { idMap.set(String(r.id), ex); return { ...r, id: ex }; }
        return r;
      });
      return idMap;
    };
    const secMap = await fix("sections", "key");
    await fix("projects", "slug");
    await fix("posts", "slug");
    if (secMap.size && tables.section_items)
      tables.section_items = tables.section_items.map((i) => (secMap.has(String(i.section_id)) ? { ...i, section_id: secMap.get(String(i.section_id)) } : i));
  }

  const { data, error } = await sb.rpc("restore_content", { p: { ...b, tables }, p_replace: mode === "replace" });
  if (error) return fail(`The restore failed, so nothing was changed. ${error.message}`);

  revalidatePath("/");
  revalidatePath("/admin/backup");
  updateTag("site");
  return { ok: true as const, counts: (data ?? {}) as Record<string, number> };
}
