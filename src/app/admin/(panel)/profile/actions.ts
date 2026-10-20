"use server";
import { revalidatePath, updateTag } from "next/cache";
import { requireAdmin } from "@/lib/auth";

export type FormState = { ok: boolean; message: string } | null;

function json<T>(v: FormDataEntryValue | null): T[] {
  try {
    const a = JSON.parse(String(v ?? "[]"));
    return Array.isArray(a) ? a : [];
  } catch {
    return [];
  }
}

function fixUrl(platform: string, raw: string) {
  const u = raw.trim();
  if (!u) return "";
  if (platform === "Email") return u.startsWith("mailto:") ? u : `mailto:${u}`;
  return /^(https?:|mailto:|tel:)/i.test(u) ? u : `https://${u}`;
}

export async function updateProfile(_prev: FormState, fd: FormData): Promise<FormState> {
  const supabase = await requireAdmin();
  const s = (k: string) => String(fd.get(k) ?? "").trim() || null;

  const stats = json<{ label: string; value: string }>(fd.get("stats"))
    .map((x) => ({ label: String(x.label ?? "").trim(), value: String(x.value ?? "").trim() }))
    .filter((x) => x.label || x.value);

  const socials = json<{ platform: string; url: string }>(fd.get("socials"))
    .map((x) => ({
      platform: String(x.platform ?? "Other"),
      label: String(x.platform ?? "Other"),
      url: fixUrl(String(x.platform ?? ""), String(x.url ?? "")),
    }))
    .filter((x) => x.url);

  const { error } = await supabase
    .from("profile")
    .update({
      full_name: s("full_name"), headline: s("headline"), bio: s("bio"),
      availability: s("availability"), email: s("email"), phone: s("phone"),
      location: s("location"), avatar_url: s("avatar_url"), resume_url: s("resume_url"),
      stats, socials,
      seo: { title: s("seo_title"), description: s("seo_description") },
    })
    .eq("id", 1);
  if (error) return { ok: false, message: error.message };
  revalidatePath("/"); updateTag("site");
  return { ok: true, message: "Profile saved" };
}
