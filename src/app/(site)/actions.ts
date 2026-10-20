"use server";
import { createAdminClient } from "@/lib/supabase/admin";

export type ContactState = { ok: boolean; message: string } | null;

export async function sendMessage(_p: ContactState, fd: FormData): Promise<ContactState> {
  if (String(fd.get("website") ?? "")) return { ok: true, message: "Thanks, message sent." }; // honeypot
  const name = String(fd.get("name") ?? "").trim();
  const email = String(fd.get("email") ?? "").trim();
  const body = String(fd.get("message") ?? "").trim();

  if (!name || name.length > 100) return { ok: false, message: "Please enter your name." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 200) return { ok: false, message: "Please enter a valid email." };
  if (body.length < 10 || body.length > 4000) return { ok: false, message: "Message must be 10 to 4000 characters." };

  const { error } = await createAdminClient().from("messages").insert({ name, email, body });
  if (error) return { ok: false, message: "Could not send right now. Please try again." };
  return { ok: true, message: "Thanks! Your message was sent." };
}
