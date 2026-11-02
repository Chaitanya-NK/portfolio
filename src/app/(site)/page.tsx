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

  const filled: Record<string, boolean> = {
    tools: data.tools.length > 0, skills: data.skills.length > 0, experience: data.experiences.length > 0,
    education: data.education.length > 0, achievements: data.achievements.length > 0, projects: data.projects.length > 0,
    services: data.services.length > 0, testimonials: data.testimonials.length > 0, notes: data.notes.length > 0,
  };
  const shown = sections.filter((s) =>
    s.type === "hero" || s.type === "contact" || s.type === "blog" ||
    (s.type === "custom" ? Boolean(data.itemsBySection[s.id]?.length) : filled[s.type] !== false)
  );

  const jsonLd = JSON.stringify({
    "@context": "https://schema.org", "@type": "Person",
    name: p.full_name, jobTitle: p.headline, description: p.bio, image: p.avatar_url, email: p.email,
    sameAs: (p.socials ?? []).map((x: any) => x.url).filter((u: string) => /^https?:/.test(u)),
  }).replace(/</g, "\\u003c");

  const hasContact = shown.some((s) => s.type === "contact");
  const navLinks = shown.filter((s) => !["hero", "contact"].includes(s.type)).slice(0, 6).map((s) => ({ label: s.title, href: `#${s.key}` }));
  const cta = hasContact ? { label: "Contact", href: "#contact" } : p.email ? { label: "Contact", href: `mailto:${p.email}` } : undefined;

  return (
    <div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
      <SiteNav name={p.theme?.site_name || p.full_name || "Portfolio"} links={navLinks} cta={cta} />
      <main>
        {shown.map((s, i) => {
          const n = String(i + 1).padStart(2, "0");
          if (s.type === "hero") return <Hero key={s.id} p={p} hasProjects={shown.some((x) => x.type === "projects")} hasContact={hasContact} />;
          return renderSection(s, data, n);
        })}
      </main>
      <Footer p={p} year={data.year} />
    </div>
  );
}
