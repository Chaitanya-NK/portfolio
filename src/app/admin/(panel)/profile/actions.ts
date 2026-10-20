"use server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";

export type FormState = { ok: boolean; message: string } | null;

function parsePairs(text: string, a: string, b: string) {
  return text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => {
      const [x, ...rest] = l.split("|");
      return { [a]: x.trim(), [b]: rest.join("|").trim() };
    });
}

export async function updateProfile(_prev: FormState, fd: FormData): Promise<FormState> {
  const supabase = await requireAdmin();
  const s = (k: string) => String(fd.get(k) ?? "").trim() || null;
  const { error } = await supabase
    .from("profile")
    .update({
      full_name: s("full_name"), headline: s("headline"), bio: s("bio"),
      availability: s("availability"), email: s("email"), phone: s("phone"),
      location: s("location"), avatar_url: s("avatar_url"), resume_url: s("resume_url"),
      stats: parsePairs(String(fd.get("stats") ?? ""), "label", "value"),
      socials: parsePairs(String(fd.get("socials") ?? ""), "label", "url"),
      seo: { title: s("seo_title"), description: s("seo_description") },
    })
    .eq("id", 1);
  if (error) return { ok: false, message: error.message };
  revalidatePath("/");
  return { ok: true, message: "Profile saved" };
}
