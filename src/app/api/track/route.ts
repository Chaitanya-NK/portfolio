import { NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { rateLimit } from "@/lib/rate-limit";

const BOT = /bot|crawl|spider|slurp|preview|headless|lighthouse|monitor|curl|wget|python|facebookexternalhit/i;
const KINDS = ["resume", "project_live", "project_repo", "social"];
const done = () => new NextResponse(null, { status: 204 });

function device(ua: string) {
  if (/ipad|tablet/i.test(ua)) return "tablet";
  if (/mobi|android|iphone/i.test(ua)) return "mobile";
  return "desktop";
}
function browser(ua: string) {
  if (/edg\//i.test(ua)) return "Edge";
  if (/opr\/|opera/i.test(ua)) return "Opera";
  if (/firefox\//i.test(ua)) return "Firefox";
  if (/chrome\//i.test(ua)) return "Chrome";
  if (/safari\//i.test(ua)) return "Safari";
  return "Other";
}

export async function POST(req: Request) {
  const ua = req.headers.get("user-agent") ?? "";
  if (!ua || BOT.test(ua)) return done();
  let body: { type?: string; path?: string; referrer?: string; kind?: string; label?: string };
  try { body = await req.json(); } catch { return done(); }

  const path = String(body.path ?? "").split("?")[0].slice(0, 200);
  if (!path.startsWith("/") || /^\/(admin|api|testimonial)/.test(path)) return done();
  if (!(await rateLimit("track", 200, 3600))) return done();

  const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || "unknown";
  const day = new Date().toISOString().slice(0, 10);
  const visitor = createHash("sha256")
    .update(`${ip}|${ua}|${day}|${process.env.SUPABASE_SERVICE_ROLE_KEY}`)
    .digest("hex").slice(0, 32);
  const sb = createAdminClient();

  if (body.type === "click") {
    const kind = String(body.kind ?? "");
    if (!KINDS.includes(kind)) return done();
    await sb.from("click_events").insert({ kind, label: String(body.label ?? "").slice(0, 100), path, visitor });
    return done();
  }

  let referrer: string | null = null;
  try {
    const host = new URL(String(body.referrer ?? "")).hostname.replace(/^www\./, "");
    const own = (req.headers.get("host") ?? "").split(":")[0].replace(/^www\./, "");
    if (host && host !== own) referrer = host.slice(0, 100);
  } catch {}
  const country = (req.headers.get("x-vercel-ip-country") ?? req.headers.get("cf-ipcountry") ?? "").slice(0, 2).toUpperCase() || null;

  await sb.from("page_views").insert({ path, referrer, country, device: device(ua), browser: browser(ua), visitor });
  return done();
}
