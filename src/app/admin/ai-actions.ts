"use server";
import { requireAdmin } from "@/lib/auth";
import { generate } from "@/lib/ai";
import { globalLimit } from "@/lib/rate-limit";

type R = { ok: true; text: string } | { ok: false; error: string };
const fail = (error: string): R => ({ ok: false, error });
const clip = (s: unknown, n: number) => String(s ?? "").trim().slice(0, n);
const plain = (h: unknown) =>
  String(h ?? "").replace(/<(script|style)[\s\S]*?<\/\1>/gi, " ").replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/\s+/g, " ").trim();
const unquote = (s: string) => s.replace(/^["'“”‘’`]+|["'“”‘’`]+$/g, "").replace(/\s+/g, " ").trim();

async function ready(): Promise<R | null> {
  await requireAdmin();
  if (!(await globalLimit("ai-admin", 120, 3600))) return fail("Too many AI requests this hour. Please try again later.");
  return null;
}

export async function aiBullets(i: { title: string; notes: string }): Promise<R> {
  const stop = await ready(); if (stop) return stop;
  const notes = clip(i.notes, 2000);
  if (notes.length < 8) return fail("Type a few rough notes in the box first, then click again.");
  const r = await generate({
    system: "You are a careful resume editor. Rewrite the person's rough notes into 3 to 5 achievement-focused resume bullet points. Start each with a strong past-tense verb (or present tense for ongoing work). Keep each under 22 words. Use ONLY facts and numbers that appear in the notes: never invent metrics, tools or results. Output one bullet per line with no bullet symbols, no numbering and no other text.",
    turns: [{ role: "user", text: `Job title: ${clip(i.title, 100) || "not given"}\n\nRough notes:\n${notes}` }],
    maxTokens: 800, temperature: 0.3,
  });
  if (!r.ok) return r;
  const lines = r.text.split("\n").map((l) => l.replace(/^\s*(?:[-*•·]|\d+[.)])\s+/, "").trim()).filter(Boolean).slice(0, 6);
  return lines.length ? { ok: true, text: lines.join("\n") } : fail("The AI returned nothing usable. Please try again.");
}

export async function aiBio(i: { name: string; headline: string; bio: string }): Promise<R> {
  const stop = await ready(); if (stop) return stop;
  const bio = clip(i.bio, 1500);
  if (bio.length < 20) return fail("Write a rough bio first, then click again.");
  const r = await generate({
    system: "You polish short professional bios for a personal portfolio. Keep every fact and the same point of view (first person stays first person, third person stays third person). Make it clear, confident and natural, 2 to 3 sentences, under 420 characters, plain text. Avoid buzzwords and hype. Never add facts that are not in the original. Output only the bio.",
    turns: [{ role: "user", text: `Name: ${clip(i.name, 100)}\nHeadline: ${clip(i.headline, 200)}\n\nCurrent bio:\n${bio}` }],
    maxTokens: 500, temperature: 0.4,
  });
  return r.ok ? { ok: true, text: unquote(r.text).slice(0, 500) } : r;
}

const META_SYSTEM =
  "You write SEO meta descriptions. Write one natural sentence of at most 155 characters that summarises the content and makes a searcher want to click. No quotation marks, no emojis, no hashtags. Use only facts from the content. Output only the sentence.";

export async function aiProfileMeta(i: { name: string; headline: string; bio: string }): Promise<R> {
  const stop = await ready(); if (stop) return stop;
  if (clip(i.bio, 20).length < 10 && !clip(i.headline, 10)) return fail("Fill in your headline or bio first.");
  const r = await generate({
    system: META_SYSTEM,
    turns: [{ role: "user", text: `Page: personal portfolio website.\nName: ${clip(i.name, 100)}\nHeadline: ${clip(i.headline, 200)}\nBio: ${clip(i.bio, 800)}` }],
    maxTokens: 300, temperature: 0.4,
  });
  return r.ok ? { ok: true, text: unquote(r.text).slice(0, 160) } : r;
}

export async function aiPostMeta(i: { title: string; html: string }): Promise<R> {
  const stop = await ready(); if (stop) return stop;
  const text = plain(i.html).slice(0, 3500);
  if (text.length < 80) return fail("Write more of the post first.");
  const r = await generate({
    system: META_SYSTEM,
    turns: [{ role: "user", text: `Blog post title: ${clip(i.title, 150)}\n\nPost text:\n${text}` }],
    maxTokens: 300, temperature: 0.4,
  });
  return r.ok ? { ok: true, text: unquote(r.text).slice(0, 160) } : r;
}

export async function aiExcerpt(i: { title: string; html: string }): Promise<R> {
  const stop = await ready(); if (stop) return stop;
  const text = plain(i.html).slice(0, 3500);
  if (text.length < 80) return fail("Write more of the post first.");
  const r = await generate({
    system: "You write blog post excerpts. Write 1 to 2 plain sentences, at most 200 characters, that tease what the reader will learn. No quotation marks. Use only facts from the post. Output only the excerpt.",
    turns: [{ role: "user", text: `Title: ${clip(i.title, 150)}\n\nPost text:\n${text}` }],
    maxTokens: 300, temperature: 0.5,
  });
  return r.ok ? { ok: true, text: unquote(r.text).slice(0, 220) } : r;
}

export async function aiAltText(url: string): Promise<R> {
  const stop = await ready(); if (stop) return stop;
  let u: URL;
  try { u = new URL(url); } catch { return fail("That image address isn’t valid."); }
  const own = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!).hostname;
  if (u.protocol !== "https:" || u.hostname !== own || !u.pathname.startsWith("/storage/v1/object/public/media/"))
    return fail("Only images from your media library are supported.");

  let res: Response;
  try { res = await fetch(u, { signal: AbortSignal.timeout(8000), cache: "no-store" }); } catch { return fail("Couldn’t load the image."); }
  if (!res.ok) return fail("Couldn’t load the image.");
  const mime = (res.headers.get("content-type") ?? "").split(";")[0].trim();
  if (!["image/png", "image/jpeg", "image/webp", "image/gif"].includes(mime)) return fail("The AI can read PNG, JPG, WebP and GIF images (not SVG).");
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length > 4_000_000) return fail("That image is too large for the AI (over 4 MB).");

  const r = await generate({
    system: "You write alt text for website images. Describe what the image shows in one short sentence under 120 characters, for someone using a screen reader. Do not start with 'Image of' or 'Picture of'. If it is a screenshot of an app, page or dashboard, say what it shows. Include any text that matters. Output only the alt text.",
    turns: [{ role: "user", text: "Write the alt text for this image." }],
    image: { mime, data: buf.toString("base64") },
    maxTokens: 300, temperature: 0.2,
  });
  return r.ok ? { ok: true, text: unquote(r.text).slice(0, 125) } : r;
}
