import { ImageResponse } from "next/og";
import { getPost, getSiteData } from "@/lib/site/data";

export const alt = "Blog post";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [post, { profile: p }] = await Promise.all([getPost(slug), getSiteData()]);
  const accent = p.theme?.accent || "#C6F432";
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: "#0A0A0F", color: "#F2F2F5", padding: 72 }}>
        <div style={{ display: "flex", fontSize: 30, color: accent }}>{post ? `${post.reading_minutes} min read` : "Blog"}</div>
        <div style={{ display: "flex", fontSize: 72, fontWeight: 700, lineHeight: 1.1 }}>{String(post?.title ?? "Post").slice(0, 110)}</div>
        <div style={{ display: "flex", fontSize: 32, color: "#9A9AAE" }}>{p.full_name ?? ""}</div>
      </div>
    ),
    size
  );
}
