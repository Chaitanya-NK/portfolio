import type { MetadataRoute } from "next";
import { getAllPosts, getSiteData } from "@/lib/site/data";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
  const [posts, site] = await Promise.all([getAllPosts(), getSiteData()]);
  const home = site.profile.updated_at;
  return [
    { url: base, lastModified: home, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/blog`, lastModified: posts[0]?.updated_at ?? home, changeFrequency: "weekly", priority: 0.7 },
    ...posts.map((p) => ({ url: `${base}/blog/${p.slug}`, lastModified: p.updated_at, priority: 0.6 })),
    ...site.projects.map((p) => ({ url: `${base}/projects/${p.slug}`, lastModified: p.updated_at, priority: 0.6 })),
  ];
}
