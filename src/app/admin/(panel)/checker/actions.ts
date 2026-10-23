"use server";
import dns from "node:dns/promises";
import net from "node:net";
import { requireAdmin } from "@/lib/auth";

type Src = { label: string; href: string };
export type LinkRow = { url: string; status: number | null; note: string; sources: Src[] };
export type LinkReport = { checked: number; good: number; broken: LinkRow[]; unverified: LinkRow[] };

function isPrivate(ip: string): boolean {
  if (net.isIPv6(ip)) {
    const l = ip.toLowerCase();
    if (l === "::1" || l === "::" || l.startsWith("fc") || l.startsWith("fd") || l.startsWith("fe80")) return true;
    const m = l.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
    return m ? isPrivate(m[1]) : false;
  }
  const [a, b] = ip.split(".").map(Number);
  return a === 10 || a === 127 || a === 0 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127) || a >= 224;
}

async function hostCheck(u: URL): Promise<"ok" | "private" | "dns"> {
  if (net.isIP(u.hostname)) return isPrivate(u.hostname) ? "private" : "ok";
  try {
    const addrs = await dns.lookup(u.hostname, { all: true });
    if (!addrs.length) return "dns";
    return addrs.some((a) => isPrivate(a.address)) ? "private" : "ok";
  } catch { return "dns"; }
}

async function probe(raw: string): Promise<{ status: number | null; kind: "ok" | "broken" | "unverified"; note: string }> {
  let url = raw;
  for (let hop = 0; hop < 5; hop++) {
    let u: URL;
    try { u = new URL(url); } catch { return { status: null, kind: "broken", note: "Not a valid URL" }; }
    if (!/^https?:$/.test(u.protocol)) return { status: null, kind: "unverified", note: "Not a web link" };
    const h = await hostCheck(u);
    if (h === "dns") return { status: null, kind: "broken", note: "Domain not found" };
    if (h === "private") return { status: null, kind: "unverified", note: "Points to a private address" };

    const go = (method: string) =>
      fetch(u, { method, redirect: "manual", cache: "no-store", signal: AbortSignal.timeout(8000),
        headers: { "user-agent": "Mozilla/5.0 (compatible; PortfolioLinkChecker/1.0)", accept: "*/*" } });
    let res: Response;
    try {
      res = await go("HEAD");
      if (res.status >= 400) { res.body?.cancel(); res = await go("GET"); }
    } catch (e: any) {
      return { status: null, kind: "unverified", note: e?.name === "TimeoutError" ? "Timed out" : "Could not connect" };
    }
    res.body?.cancel();
    if (res.status >= 300 && res.status < 400 && res.headers.get("location")) {
      url = new URL(res.headers.get("location")!, u).href;
      continue;
    }
    if (res.status < 400) return { status: res.status, kind: "ok", note: "OK" };
    if (res.status === 404 || res.status === 410) return { status: res.status, kind: "broken", note: "Page not found" };
    if (res.status >= 500) return { status: res.status, kind: "broken", note: "Server error" };
    return { status: res.status, kind: "unverified", note: "The site blocks automated checks" };
  }
  return { status: null, kind: "broken", note: "Too many redirects" };
}

export async function checkLinks(): Promise<{ ok: true; report: LinkReport } | { ok: false; error: string }> {
  const sb = await requireAdmin();
  const map = new Map<string, Src[]>();
  const add = (url: unknown, label: string, href: string) => {
    const u = String(url ?? "").trim();
    if (!/^https?:\/\//i.test(u)) return;
    map.set(u, [...(map.get(u) ?? []), { label, href }]);
  };

  const [profile, projects, posts, services] = await Promise.all([
    sb.from("profile").select("socials").eq("id", 1).maybeSingle(),
    sb.from("projects").select("id,title,live_url,repo_url").eq("published", true),
    sb.from("posts").select("id,title,content_html").eq("status", "published"),
    sb.from("services").select("id,title,cta_url").eq("published", true),
  ]);
  ((profile.data as any)?.socials ?? []).forEach((x: any) => add(x.url, `Profile: ${x.platform ?? x.label ?? "link"}`, "/admin/profile"));
  ((projects.data ?? []) as any[]).forEach((p) => {
    add(p.live_url, `${p.title} (Live)`, `/admin/projects?edit=${p.id}`);
    add(p.repo_url, `${p.title} (Code)`, `/admin/projects?edit=${p.id}`);
  });
  ((posts.data ?? []) as any[]).forEach((p) => {
    for (const m of String(p.content_html ?? "").matchAll(/<a\b[^>]*\bhref="([^"]+)"/gi)) add(m[1].replace(/&amp;/g, "&"), p.title, `/admin/blog/${p.id}`);
  });
  ((services.data ?? []) as any[]).forEach((x) => add(x.cta_url, `${x.title} (button)`, `/admin/services?edit=${x.id}`));

  const urls = [...map.keys()].slice(0, 80);
  if (!urls.length) return { ok: false, error: "No external links found to check." };

  const results: LinkRow[] = [];
  const kinds: string[] = [];
  let next = 0;
  const worker = async () => {
    while (next < urls.length) {
      const url = urls[next++];
      const r = await probe(url);
      kinds.push(r.kind);
      if (r.kind !== "ok") results.push({ url, status: r.status, note: r.note, sources: map.get(url) ?? [] });
    }
  };
  await Promise.all([worker(), worker(), worker(), worker(), worker(), worker()]);

  const bad = new Set(results.map((r) => r.url));
  const withKind = (k: string) => results.filter((r) => (r.note === "OK" ? false : true) && k === k);
  void withKind;
  const unverifiedNotes = ["The site blocks automated checks", "Timed out", "Could not connect", "Points to a private address", "Not a web link"];
  return {
    ok: true,
    report: {
      checked: urls.length,
      good: urls.length - bad.size,
      broken: results.filter((r) => !unverifiedNotes.includes(r.note)),
      unverified: results.filter((r) => unverifiedNotes.includes(r.note)),
    },
  };
}
