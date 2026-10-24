"use server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { sendReplyEmail } from "@/lib/email";
import { LABELS } from "@/lib/labels";

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

export async function setLabels(id: string, labels: string[]): Promise<R> {
  const supabase = await requireAdmin();
  const clean = [...new Set(labels)].filter((l) => (LABELS as readonly string[]).includes(l));
  const patch: Record<string, unknown> = { labels: clean };
  if (clean.includes("Spam")) patch.is_read = true;
  const { error } = await supabase.from("messages").update(patch).eq("id", id);
  return done(error);
}

export async function deleteMany(list: string[]): Promise<R> {
  const supabase = await requireAdmin();
  const wanted = ids(list);
  const { data: rows } = await supabase.from("messages").select("attachments").in("id", wanted);
  const paths = (rows ?? []).flatMap((r: any) => (r.attachments ?? []).map((a: any) => a.path)).filter(Boolean);
  if (paths.length) await supabase.storage.from("attachments").remove(paths);
  const { error } = await supabase.from("messages").delete().in("id", wanted);
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

export async function saveTemplate(id: string | null, v: { title: string; subject: string; body: string }) {
  const supabase = await requireAdmin();
  const title = v.title.trim().slice(0, 80);
  const body = v.body.trim().slice(0, 4000);
  const subject = v.subject.trim().slice(0, 200) || null;
  if (!title || !body) return { ok: false as const, error: "Title and message are required." };
  if (id) {
    const { data, error } = await supabase.from("reply_templates").update({ title, subject, body }).eq("id", id).select("id,title,subject,body").single();
    if (error || !data) return { ok: false as const, error: error?.message ?? "Failed" };
    revalidatePath("/admin/inbox");
    return { ok: true as const, row: data };
  }
  const { data: last } = await supabase.from("reply_templates").select("sort_order").order("sort_order", { ascending: false }).limit(1);
  const { data, error } = await supabase.from("reply_templates")
    .insert({ title, subject, body, sort_order: (last?.[0]?.sort_order ?? 0) + 1 }).select("id,title,subject,body").single();
  if (error || !data) return { ok: false as const, error: error?.message ?? "Failed" };
  revalidatePath("/admin/inbox");
  return { ok: true as const, row: data };
}

export async function deleteTemplate(id: string): Promise<R> {
  const supabase = await requireAdmin();
  const { error } = await supabase.from("reply_templates").delete().eq("id", id);
  return done(error);
}
