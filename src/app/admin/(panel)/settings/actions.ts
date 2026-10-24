"use server";
import { revalidatePath, updateTag } from "next/cache";
import { requireAdmin } from "@/lib/auth";

export type SettingsState = { ok: boolean; message: string } | null;

const str = (fd: FormData, k: string, max = 200) => String(fd.get(k) ?? "").trim().slice(0, max);
const iso = (v: string) => {
  const d = new Date(v);
  return v && !isNaN(d.getTime()) ? d.toISOString() : null;
};
const linkOk = (u: string) => /^(https?:\/\/|\/|#|mailto:)/i.test(u);

export async function saveSettings(_p: SettingsState, fd: FormData): Promise<SettingsState> {
  const supabase = await requireAdmin();

  const accent = str(fd, "accent", 7);
  if (!/^#[0-9a-fA-F]{6}$/.test(accent)) return { ok: false, message: "Accent must be a hex color like #C6F432" };

  const annText = str(fd, "ann_text", 160);
  const annUrl = str(fd, "ann_link_url", 300);
  if (annUrl && !linkOk(annUrl)) return { ok: false, message: "The banner link must start with https:// or /" };
  const annStart = iso(str(fd, "ann_start", 40));
  const annEnd = iso(str(fd, "ann_end", 40));
  if (annStart && annEnd && new Date(annEnd) <= new Date(annStart))
    return { ok: false, message: "The banner end time must be after its start time" };

  const { data: cur } = await supabase.from("profile").select("theme").eq("id", 1).single();
  const theme = {
    ...(cur?.theme ?? {}),
    accent,
    site_name: str(fd, "site_name", 80) || null,
    footer_text: str(fd, "footer_text", 200) || null,
    favicon_url: str(fd, "favicon_url", 500) || null,
    share_image_url: str(fd, "share_image_url", 500) || null,
    resume_mode: fd.get("resume_mode") === "generated" ? "generated" : "upload",
    availability_until: iso(str(fd, "availability_until", 40)),
    maintenance: fd.get("maintenance") === "on",
    maintenance_message: str(fd, "maintenance_message", 300) || null,
    announcement: annText
      ? {
          enabled: fd.get("ann_enabled") === "on",
          text: annText,
          link_label: str(fd, "ann_link_label", 40) || null,
          link_url: annUrl || null,
          start: annStart,
          end: annEnd,
        }
      : null,
  };

  const { error } = await supabase.from("profile").update({ theme }).eq("id", 1);
  if (error) return { ok: false, message: error.message };
  revalidatePath("/");
  updateTag("site");
  return { ok: true, message: "Settings saved" };
}
