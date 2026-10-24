import "server-only";
import { Resend } from "resend";

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));

export async function notifyNewMessage(m: { name: string; email: string; body: string; topic?: string; attachments?: string[] }) {
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
      ${m.topic ? `<p><strong>Topic:</strong> ${esc(m.topic)}</p>` : ""}${m.attachments?.length ? `<p><strong>Attachments:</strong> ${m.attachments.map(esc).join(", ")}. Open them in Admin → Inbox.</p>` : ""}
      <p style="white-space:pre-wrap;border-left:3px solid #4f46e5;padding-left:12px">${esc(m.body)}</p>
      <p style="color:#666;font-size:12px">Hit reply to answer directly, or open Admin → Inbox.</p></div>`,
  });
  if (error) console.error("Email failed:", error);
}

type Sent = { ok: true } | { ok: false; error: string };

export async function sendReplyEmail(a: {
  to: string; subject: string; text: string;
  original: { name: string | null; body: string | null; at: string };
}): Promise<Sent> {
  const quoted = (a.original.body ?? "").slice(0, 1500).split("\n").map((l) => `> ${l}`).join("\n");
  const when = new Date(a.original.at).toUTCString();
  const text = `${a.text}\n\n---\nOn ${when}, ${a.original.name ?? "you"} wrote:\n${quoted}`;
  const html = `<div style="font-family:system-ui,sans-serif;max-width:600px"><p style="white-space:pre-wrap">${esc(a.text)}</p>
    <hr style="border:0;border-top:1px solid #ddd;margin:24px 0"><p style="color:#666;font-size:13px">On ${esc(when)}, ${esc(a.original.name ?? "you")} wrote:</p>
    <blockquote style="margin:0;padding-left:12px;border-left:3px solid #ddd;color:#555;white-space:pre-wrap">${esc((a.original.body ?? "").slice(0, 1500))}</blockquote></div>`;

  const user = process.env.SMTP_USER, pass = process.env.SMTP_PASS;
  if (user && pass) {
    try {
      const nodemailer = (await import("nodemailer")).default;
      const t = nodemailer.createTransport({ host: "smtp.gmail.com", port: 465, secure: true, auth: { user, pass } });
      await t.sendMail({ from: `"${process.env.SMTP_NAME ?? "Portfolio"}" <${user}>`, to: a.to, replyTo: user, subject: a.subject, text, html });
      return { ok: true };
    } catch (e) {
      console.error("SMTP failed:", e);
      return { ok: false, error: "Gmail rejected the login. Check SMTP_USER and the 16-letter app password." };
    }
  }

  const key = process.env.RESEND_API_KEY, from = process.env.RESEND_FROM;
  if (key && from && !/resend\.dev/i.test(from)) {
    const { error } = await new Resend(key).emails.send({ from, to: a.to, replyTo: process.env.NOTIFY_EMAIL, subject: a.subject, text, html });
    return error ? { ok: false, error: error.message } : { ok: true };
  }
  return { ok: false, error: "Email sending isn’t set up. Add SMTP_USER and SMTP_PASS (Gmail app password) to .env.local." };
}
