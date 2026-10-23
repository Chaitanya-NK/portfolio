import { connection } from "next/server";
import { getSiteData } from "@/lib/site/data";

const esc = (s: string) => s.replace(/\\/g, "\\\\").replace(/\r?\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");
const fold = (line: string) => line.replace(/(.{74})(?=.)/g, "$1\r\n ");

async function photo(url?: string | null) {
  if (!url) return null;
  try {
    const own = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!).hostname;
    if (new URL(url).hostname !== own) return null;
    const r = await fetch(url, { signal: AbortSignal.timeout(4000) });
    if (!r.ok) return null;
    const ct = r.headers.get("content-type") ?? "";
    const type = /png/.test(ct) ? "PNG" : /jpe?g/.test(ct) ? "JPEG" : null;
    if (!type) return null;
    const buf = Buffer.from(await r.arrayBuffer());
    if (buf.length > 400_000) return null;
    return `PHOTO;ENCODING=b;TYPE=${type}:${buf.toString("base64")}`;
  } catch { return null; }
}

export async function GET(req: Request) {
  await connection();
  const { profile: p } = await getSiteData();
  if (!p.full_name) return new Response("Not found", { status: 404 });

  const parts = String(p.full_name).trim().split(/\s+/);
  const family = parts.length > 1 ? parts[parts.length - 1] : "";
  const given = parts.length > 1 ? parts.slice(0, -1).join(" ") : parts[0];
  const site = (process.env.NEXT_PUBLIC_SITE_URL ?? new URL(req.url).origin).replace(/\/$/, "");

  const lines = [
    "BEGIN:VCARD", "VERSION:3.0",
    `N:${esc(family)};${esc(given)};;;`,
    `FN:${esc(p.full_name)}`,
    p.headline ? `TITLE:${esc(p.headline)}` : "",
    p.email ? `EMAIL;TYPE=INTERNET:${esc(p.email)}` : "",
    p.phone ? `TEL;TYPE=CELL:${esc(p.phone)}` : "",
    p.location ? `ADR;TYPE=HOME:;;${esc(p.location)};;;;` : "",
    `URL:${site}`,
    ...((p.socials ?? []) as { url: string }[]).filter((x) => /^https?:/i.test(x.url)).slice(0, 6).map((x) => `URL:${x.url}`),
    p.bio ? `NOTE:${esc(String(p.bio).slice(0, 300))}` : "",
    await photo(p.avatar_url) ?? "",
    "END:VCARD",
  ].filter(Boolean).map(fold);

  const file = String(p.full_name).replace(/[^\w\- ]+/g, "").trim().replace(/\s+/g, "-") || "contact";
  return new Response(lines.join("\r\n") + "\r\n", {
    headers: {
      "Content-Type": "text/vcard; charset=utf-8",
      "Content-Disposition": `attachment; filename="${file}.vcf"`,
      "Cache-Control": "public, max-age=300",
    },
  });
}
