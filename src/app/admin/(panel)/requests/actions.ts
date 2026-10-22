"use server";
import { randomBytes } from "node:crypto";
import { revalidatePath, updateTag } from "next/cache";
import { requireAdmin } from "@/lib/auth";

type R = { ok: boolean; error?: string; token?: string };
const refresh = () => { revalidatePath("/admin/requests"); revalidatePath("/"); revalidatePath("/admin/testimonials"); updateTag("site"); };

export async function createRequest(label: string, days: number): Promise<R> {
  const supabase = await requireAdmin();
  const d = [7, 30, 90].includes(days) ? days : 30;
  const token = randomBytes(24).toString("base64url");
  const { error } = await supabase.from("testimonial_requests").insert({
    token, label: label.trim().slice(0, 80) || null, expires_at: new Date(Date.now() + d * 864e5).toISOString(),
  });
  if (error) return { ok: false, error: error.message };
  refresh();
  return { ok: true, token };
}

export async function deleteRequest(id: string): Promise<R> {
  const supabase = await requireAdmin();
  const { error } = await supabase.from("testimonial_requests").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  refresh();
  return { ok: true };
}

export async function rejectRequest(id: string): Promise<R> {
  const supabase = await requireAdmin();
  const { error } = await supabase.from("testimonial_requests").update({ status: "rejected" }).eq("id", id).eq("status", "submitted");
  if (error) return { ok: false, error: error.message };
  refresh();
  return { ok: true };
}

export async function approveRequest(id: string, f: { name: string; title: string; company: string; quote: string }): Promise<R> {
  const supabase = await requireAdmin();
  const name = f.name.trim(), quote = f.quote.trim();
  if (!name || !quote) return { ok: false, error: "Name and quote are required" };
  const { data: req } = await supabase.from("testimonial_requests").select("id,status,avatar_url").eq("id", id).single();
  if (!req || req.status !== "submitted") return { ok: false, error: "This submission is no longer pending" };
  const { data: last } = await supabase.from("testimonials").select("sort_order").order("sort_order", { ascending: false }).limit(1);
  const { error } = await supabase.from("testimonials").insert({
    name, title: f.title.trim() || null, company: f.company.trim() || null, quote,
    avatar_url: req.avatar_url, published: true, sort_order: (last?.[0]?.sort_order ?? 0) + 1,
  });
  if (error) return { ok: false, error: error.message };
  await supabase.from("testimonial_requests").update({ status: "approved", name, title: f.title.trim() || null, company: f.company.trim() || null, quote }).eq("id", id);
  refresh();
  return { ok: true };
}
