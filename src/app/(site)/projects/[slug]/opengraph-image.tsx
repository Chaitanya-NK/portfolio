import { getProject, getSiteData } from "@/lib/site/data";
import { shareCard, shareSize } from "@/lib/site/share-image";
import { normalizeGallery } from "@/lib/case-study";

export const alt = "Project";
export const size = shareSize;
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [proj, { profile: p }] = await Promise.all([getProject(slug), getSiteData()]);
  const kicker = ["Project", proj?.role, proj?.year].filter(Boolean).join(" · ");
  return shareCard({
    kicker,
    title: String(proj?.title ?? "Project"),
    subtitle: proj?.summary ?? undefined,
    tags: proj?.tags ?? undefined,
    image: proj?.cover_url || (proj ? normalizeGallery(proj.gallery)[0]?.url : null),
    name: p.full_name,
    accent: p.theme?.accent || "#C6F432",
  });
}
