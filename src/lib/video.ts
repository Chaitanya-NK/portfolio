export type Parsed = { kind: "youtube" | "vimeo" | "loom"; id: string };

export function parseVideo(input: string): Parsed | null {
  let u: URL;
  try { u = new URL(input.trim()); } catch { return null; }
  if (!/^https?:$/.test(u.protocol)) return null;
  const host = u.hostname.replace(/^www\.|^m\./, "");
  const yt = (id?: string | null) => (id && /^[\w-]{11}$/.test(id) ? { kind: "youtube" as const, id } : null);

  if (host === "youtu.be") return yt(u.pathname.slice(1).split("/")[0]);
  if (host === "youtube.com" || host === "youtube-nocookie.com") {
    if (u.pathname === "/watch") return yt(u.searchParams.get("v"));
    const m = u.pathname.match(/^\/(?:embed|shorts|live)\/([\w-]{11})/);
    return m ? yt(m[1]) : null;
  }
  if (host === "vimeo.com" || host === "player.vimeo.com") {
    const m = u.pathname.match(/\/(?:video\/)?(\d{6,12})/);
    return m ? { kind: "vimeo", id: m[1] } : null;
  }
  if (host === "loom.com") {
    const m = u.pathname.match(/^\/(?:share|embed)\/([a-f0-9]{32})/i);
    return m ? { kind: "loom", id: m[1].toLowerCase() } : null;
  }
  return null;
}

export function embedUrl(p: Parsed) {
  switch (p.kind) {
    case "youtube": return `https://www.youtube-nocookie.com/embed/${p.id}?rel=0&modestbranding=1&autoplay=1`;
    case "vimeo": return `https://player.vimeo.com/video/${p.id}?dnt=1&autoplay=1`;
    case "loom": return `https://www.loom.com/embed/${p.id}?autoplay=1`;
  }
}
