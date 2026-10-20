"use server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";

export async function setRead(id: string, is_read: boolean) {
  const supabase = await requireAdmin();
  const { error } = await supabase.from("messages").update({ is_read }).eq("id", id);
  revalidatePath("/admin/inbox"); revalidatePath("/admin");
  return { ok: !error, error: error?.message };
}
export async function deleteMessage(id: string) {
  const supabase = await requireAdmin();
  const { error } = await supabase.from("messages").delete().eq("id", id);
  revalidatePath("/admin/inbox"); revalidatePath("/admin");
  return { ok: !error, error: error?.message };
}
