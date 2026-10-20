import type { Metadata } from "next";
import { getSiteData } from "@/lib/site/data";
import { SiteNav } from "@/components/site/site-nav";
import { Hero, Footer, renderSection } from "@/components/site/sections";

export async function generateMetadata(): Promise<Metadata> {
  const { profile: p } = await getSiteData();
  const title = p.seo?.title || [p.full_name, p.headline].filter(Boolean).join(" · ") || "Portfolio";
  return {
    title,
    description: p.seo?.description || p.bio?.slice(0, 160) || undefined,
    openGraph: { title, images: p.avatar_url ? [p.avatar_url] : undefined },
  };
}

export default async function Home() {
  const data = await getSiteData();
  const { profile: p, sections } = data;
  const accent = p.theme?.accent || "#C6F432";

  const navLinks = sections
    .filter((s) => !["hero", "contact"].includes(s.type))
    .slice(0, 6)
    .map((s) => ({ label: s.title, href: `#${s.key}` }));
  const hasContact = sections.some((s) => s.type === "contact");
  const cta = hasContact
    ? { label: "Hire me", href: "#contact" }
    : p.email ? { label: "Hire me", href: `mailto:${p.email}` } : undefined;

  return (
    <div style={{ ["--accent" as string]: accent }} className="relative">
      <div aria-hidden className="pointer-events-none absolute left-1/2 top-[-160px] h-[420px] w-[min(900px,100%)] -translate-x-1/2 bg-[radial-gradient(closest-side,color-mix(in_srgb,var(--accent)_14%,transparent),transparent)]" />
      <SiteNav name={p.full_name || "Portfolio"} links={navLinks} cta={cta} />
      {sections.map((s, i) => {
        const n = String(i + 1).padStart(2, "0");
        if (s.type === "hero") return <Hero key={s.id} p={p} hasProjects={sections.some((x) => x.type === "projects") && data.projects.length > 0} />;
        return renderSection(s, data, n);
      })}
      <Footer p={p} year={data.year} />
    </div>
  );
}
