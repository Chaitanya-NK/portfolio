"use server";
import { revalidatePath, updateTag } from "next/cache";
import { requireAdmin } from "@/lib/auth";

export type SettingsState = { ok: boolean; message: string } | null;

export async function saveSettings(_p: SettingsState, fd: FormData): Promise<SettingsState> {
  const supabase = await requireAdmin();
  const accent = String(fd.get("accent") ?? "").trim();
  if (!/^#[0-9a-fA-F]{6}$/.test(accent)) return { ok: false, message: "Accent must be a hex color like #C6F432" };
  const { data: cur } = await supabase.from("profile").select("theme").eq("id", 1).single();
  const theme = {
    ...(cur?.theme ?? {}),
    accent,
    site_name: String(fd.get("site_name") ?? "").trim() || null,
    footer_text: String(fd.get("footer_text") ?? "").trim() || null,
    favicon_url: String(fd.get("favicon_url") ?? "").trim() || null,
    share_image_url: String(fd.get("share_image_url") ?? "").trim() || null,
    resume_mode: fd.get("resume_mode") === "generated" ? "generated" : "upload",
  };
  const { error } = await supabase.from("profile").update({ theme }).eq("id", 1);
  if (error) return { ok: false, message: error.message };
  revalidatePath("/"); updateTag("site");
  return { ok: true, message: "Settings saved" };
}
