import { getPost, getSiteData } from "@/lib/site/data";
import { shareCard, shareSize } from "@/lib/site/share-image";

export const alt = "Blog post";
export const size = shareSize;
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [post, { profile: p }] = await Promise.all([getPost(slug), getSiteData()]);
  return shareCard({
    kicker: post ? `Blog · ${post.reading_minutes} min read` : "Blog",
    title: String(post?.title ?? "Post"),
    subtitle: post?.excerpt ?? undefined,
    tags: post?.tags ?? undefined,
    image: post?.cover_url,
    name: p.full_name,
    accent: p.theme?.accent || "#C6F432",
  });
}
