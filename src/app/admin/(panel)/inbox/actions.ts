"use server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";

type R = { ok: boolean; error?: string };
const ids = (a: string[]) => a.filter((x) => typeof x === "string" && x).slice(0, 200);
const done = (error?: { message: string } | null): R => {
  revalidatePath("/admin/inbox");
  revalidatePath("/admin");
  return error ? { ok: false, error: error.message } : { ok: true };
};

export async function markReadMany(list: string[], is_read: boolean): Promise<R> {
  const supabase = await requireAdmin();
  const { error } = await supabase.from("messages").update({ is_read }).in("id", ids(list));
  return done(error);
}

export async function setStarred(id: string, is_starred: boolean): Promise<R> {
  const supabase = await requireAdmin();
  const { error } = await supabase.from("messages").update({ is_starred }).eq("id", id);
  return done(error);
}

export async function deleteMany(list: string[]): Promise<R> {
  const supabase = await requireAdmin();
  const { error } = await supabase.from("messages").delete().in("id", ids(list));
  return done(error);
}
