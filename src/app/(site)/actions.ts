"use server";
import { after } from "next/server";
import { headers } from "next/headers";
import { randomBytes } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { rateLimit } from "@/lib/rate-limit";
import { notifyNewMessage } from "@/lib/email";
import { TOPICS } from "@/lib/topics";

export type ContactState = { ok: boolean; message: string } | null;

const MAX_FILE = 2.5 * 1024 * 1024;
const starts = (b: Uint8Array, ...v: number[]) => v.every((x, i) => b[i] === x);
const FILES: Record<string, { type: string; ok: (b: Uint8Array) => boolean }> = {
  pdf: { type: "application/pdf", ok: (b) => starts(b, 0x25, 0x50, 0x44, 0x46) },
  png: { type: "image/png", ok: (b) => starts(b, 0x89, 0x50, 0x4e, 0x47) },
  jpg: { type: "image/jpeg", ok: (b) => starts(b, 0xff, 0xd8) },
  jpeg: { type: "image/jpeg", ok: (b) => starts(b, 0xff, 0xd8) },
  webp: { type: "image/webp", ok: (b) => starts(b, 0x52, 0x49, 0x46, 0x46) && starts(b.slice(8), 0x57, 0x45, 0x42, 0x50) },
  docx: { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", ok: (b) => starts(b, 0x50, 0x4b) },
  txt: { type: "text/plain", ok: (b) => !b.slice(0, 512).includes(0) },
};

async function verifyTurnstile(token: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return true; // not configured: honeypot and rate limit still apply
  if (!token) return false;
  const ip = ((await headers()).get("x-forwarded-for") ?? "").split(",")[0].trim();
  try {
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body: new URLSearchParams({ secret, response: token, ...(ip ? { remoteip: ip } : {}) }),
      signal: AbortSignal.timeout(6000),
    });
    return ((await res.json()) as { success?: boolean }).success === true;
  } catch {
    return false;
  }
}

async function storeAttachment(sb: ReturnType<typeof createAdminClient>, file: File) {
  const ext = (file.name.split(".").pop() ?? "").toLowerCase();
  const rule = FILES[ext];
  if (!rule) return { error: "That file type isn’t allowed. Use PDF, PNG, JPG, WebP, DOCX or TXT." } as const;
  if (file.size > MAX_FILE) return { error: "The file is over 2.5 MB." } as const;
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (!rule.ok(bytes)) return { error: "That file doesn’t look like a real " + ext.toUpperCase() + " file." } as const;
  const path = `${Date.now()}-${randomBytes(6).toString("hex")}.${ext}`;
  const { error } = await sb.storage.from("attachments").upload(path, bytes, { contentType: rule.type, upsert: false });
  if (error) return { error: "The file couldn’t be uploaded. Please try again." } as const;
  const name = file.name.replace(/[\u0000-\u001f<>:"/\\|?*]/g, "").slice(-80) || `file.${ext}`;
  return { att: { name, path, size: file.size } } as const;
}

export async function sendMessage(_p: ContactState, fd: FormData): Promise<ContactState> {
  if (String(fd.get("website") ?? "")) return { ok: true, message: "Thanks, message sent." }; // honeypot
  const name = String(fd.get("name") ?? "").trim();
  const email = String(fd.get("email") ?? "").trim();
  const body = String(fd.get("message") ?? "").trim();
  const topic = TOPICS[String(fd.get("topic") ?? "")] ?? TOPICS.general;

  if (!name || name.length > 100) return { ok: false, message: "Please enter your name." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 200) return { ok: false, message: "Please enter a valid email." };
  if (body.length < 10 || body.length > 4000) return { ok: false, message: "Message must be 10 to 4000 characters." };

  if (!(await verifyTurnstile(String(fd.get("cf-turnstile-response") ?? ""))))
    return { ok: false, message: "Please complete the spam check and try again." };
  if (!(await rateLimit("contact", 5, 3600)))
    return { ok: false, message: "Too many messages from your network. Please try again later." };

  const sb = createAdminClient();
  const attachments: { name: string; path: string; size: number }[] = [];
  const file = fd.get("attachment");
  if (file instanceof File && file.size > 0) {
    const r = (await storeAttachment(sb, file)) as { error?: string; att?: { name: string; path: string; size: number } };
    if (r.error) return { ok: false, message: r.error };
    if (r.att) attachments.push(r.att);
  }

  const { error } = await sb.from("messages").insert({
    name, email, body, topic: topic.label, labels: topic.tag ? [topic.tag] : [], attachments,
  });
  if (error) {
    if (attachments[0]) await sb.storage.from("attachments").remove([attachments[0].path]);
    return { ok: false, message: "Could not send right now. Please try again." };
  }

  after(async () => {
    try {
      await notifyNewMessage({ name, email, body, topic: topic.label, attachments: attachments.map((a) => a.name) });
    } catch (e) { console.error(e); }
  });
  return { ok: true, message: "Thanks! Your message was sent." };
}
