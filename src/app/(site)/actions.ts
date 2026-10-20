"use server";
import { after } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { rateLimit } from "@/lib/rate-limit";
import { notifyNewMessage } from "@/lib/email";

export type ContactState = { ok: boolean; message: string } | null;

export async function sendMessage(_p: ContactState, fd: FormData): Promise<ContactState> {
  if (String(fd.get("website") ?? "")) return { ok: true, message: "Thanks, message sent." }; // honeypot
  const name = String(fd.get("name") ?? "").trim();
  const email = String(fd.get("email") ?? "").trim();
  const body = String(fd.get("message") ?? "").trim();

  if (!name || name.length > 100) return { ok: false, message: "Please enter your name." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 200) return { ok: false, message: "Please enter a valid email." };
  if (body.length < 10 || body.length > 4000) return { ok: false, message: "Message must be 10 to 4000 characters." };

  if (!(await rateLimit("contact", 5, 3600)))
    return { ok: false, message: "Too many messages from your network. Please try again later." };

  const { error } = await createAdminClient().from("messages").insert({ name, email, body });
  if (error) return { ok: false, message: "Could not send right now. Please try again." };

  after(async () => {
    try { await notifyNewMessage({ name, email, body }); } catch (e) { console.error(e); }
  });
  return { ok: true, message: "Thanks! Your message was sent." };
}
