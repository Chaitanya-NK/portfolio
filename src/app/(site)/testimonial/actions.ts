"use server";
import { createAdminClient } from "@/lib/supabase/admin";
import { rateLimit } from "@/lib/rate-limit";

export type SubmitState = { ok: boolean; message: string } | null;

export async function submitTestimonial(token: string, _p: SubmitState, fd: FormData): Promise<SubmitState> {
  if (String(fd.get("website") ?? "")) return { ok: true, message: "Thank you!" }; // honeypot
  const s = (k: string, max: number) => String(fd.get(k) ?? "").trim().slice(0, max);
  const name = s("name", 100), title = s("title", 100), company = s("company", 100), quote = s("quote", 800);

  if (!name) return { ok: false, message: "Please enter your name." };
  if (quote.length < 20) return { ok: false, message: "Please write at least a couple of sentences." };
  if (!fd.get("consent")) return { ok: false, message: "Please tick the box to allow publishing." };
  if (!/^[A-Za-z0-9_-]{20,64}$/.test(token)) return { ok: false, message: "This link is no longer valid." };
  if (!(await rateLimit("testimonial", 6, 3600))) return { ok: false, message: "Too many attempts. Please try again later." };

  const sb = createAdminClient();
  const { data: req } = await sb.from("testimonial_requests").select("id,status,expires_at").eq("token", token).maybeSingle();
  if (!req || req.status !== "open" || new Date(req.expires_at) < new Date())
    return { ok: false, message: "This link is no longer valid." };

  let avatar_url: string | null = null;
  const file = fd.get("photo");
  if (file instanceof File && file.size > 0) {
    if (!/^image\/(png|jpe?g|webp)$/.test(file.type) || file.size > 2 * 1024 * 1024)
      return { ok: false, message: "Photo must be a PNG, JPG or WebP under 2 MB." };
    const ext = file.type.split("/")[1].replace("jpeg", "jpg");
    const path = `testimonials/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error } = await sb.storage.from("media").upload(path, file, { contentType: file.type, upsert: false });
    if (!error) avatar_url = sb.storage.from("media").getPublicUrl(path).data.publicUrl;
  }

  const { data: upd, error } = await sb
    .from("testimonial_requests")
    .update({ status: "submitted", name, title: title || null, company: company || null, quote, avatar_url, submitted_at: new Date().toISOString() })
    .eq("id", req.id).eq("status", "open").select("id");
  if (error || !upd?.length) return { ok: false, message: "Could not send right now. Please try again." };
  return { ok: true, message: "Thank you! Your testimonial was sent for review." };
}
