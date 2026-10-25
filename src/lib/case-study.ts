export type GalleryItem = { url: string; alt: string; caption: string };

export function normalizeGallery(v: unknown): GalleryItem[] {
  if (!Array.isArray(v)) return [];
  return v
    .map((g: any) => ({
      url: String(g?.url ?? "").trim(),
      alt: String(g?.alt ?? "").trim().slice(0, 200),
      caption: String(g?.caption ?? "").trim().slice(0, 200),
    }))
    .filter((g) => /^https:\/\//i.test(g.url) && g.url.length < 600)
    .slice(0, 24);
}
