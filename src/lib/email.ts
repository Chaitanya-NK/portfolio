import "server-only";
import { Resend } from "resend";

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));

export async function notifyNewMessage(m: { name: string; email: string; body: string }) {
  const key = process.env.RESEND_API_KEY;
  const to = process.env.NOTIFY_EMAIL;
  if (!key || !to) return;
  const { error } = await new Resend(key).emails.send({
    from: process.env.RESEND_FROM ?? "Portfolio <onboarding@resend.dev>",
    to,
    replyTo: m.email,
    subject: `New message from ${m.name.replace(/[\r\n]+/g, " ")}`,
    html: `<div style="font-family:system-ui,sans-serif;max-width:560px">
      <h2>New message from ${esc(m.name)}</h2>
      <p><strong>Email:</strong> <a href="mailto:${esc(m.email)}">${esc(m.email)}</a></p>
      <p style="white-space:pre-wrap;border-left:3px solid #4f46e5;padding-left:12px">${esc(m.body)}</p>
      <p style="color:#666;font-size:12px">Hit reply to answer directly, or open Admin → Inbox.</p></div>`,
  });
  if (error) console.error("Email failed:", error);
}
