"use server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { sendReplyEmail } from "@/lib/email";

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

export async function sendReply(id: string, subject: string, body: string) {
  const supabase = await requireAdmin();
  const text = body.trim();
  if (text.length < 2 || text.length > 8000) return { ok: false as const, error: "Write a reply first (up to 8000 characters)." };
  const { data: m } = await supabase.from("messages").select("id,name,email,body,created_at").eq("id", id).single();
  if (!m?.email) return { ok: false as const, error: "This message has no email address." };
  const subj = (subject.trim() || "Re: your message").replace(/[\r\n]+/g, " ").slice(0, 200);
  const sent = await sendReplyEmail({ to: m.email, subject: subj, text, original: { name: m.name, body: m.body, at: m.created_at } });
  if (!sent.ok) return { ok: false as const, error: sent.error };
  const { data: reply, error } = await supabase
    .from("message_replies").insert({ message_id: id, subject: subj, body: text })
    .select("id,subject,body,created_at").single();
  if (error || !reply) return { ok: false as const, error: "Sent, but could not save the reply history." };
  await supabase.from("messages").update({ replied_at: new Date().toISOString(), is_read: true }).eq("id", id);
  revalidatePath("/admin/inbox");
  return { ok: true as const, reply };
}
