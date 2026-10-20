"use server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";

export async function deleteMedia(path: string) {
  const supabase = await requireAdmin();
  const { error } = await supabase.storage.from("media").remove([path]);
  revalidatePath("/admin/media");
  return { ok: !error, error: error?.message };
}
