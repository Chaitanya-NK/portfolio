"use server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";

export async function deleteMedia(path: string) {
  const supabase = await requireAdmin();
  const { error } = await supabase.storage.from("media").remove([path]);
  revalidatePath("/admin/media");
  return { ok: !error, error: error?.message };
}

export async function deleteMediaMany(paths: string[]) {
  const supabase = await requireAdmin();
  const clean = paths.filter((p) => typeof p === "string" && p && !p.includes("..")).slice(0, 200);
  if (!clean.length) return { ok: false, error: "Nothing selected" };
  const { error } = await supabase.storage.from("media").remove(clean);
  revalidatePath("/admin/media");
  return { ok: !error, error: error?.message };
}
