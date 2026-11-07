import type { Metadata } from "next";
import { getSiteData } from "@/lib/site/data";
import { FallingStack } from "@/components/site/falling-stack";
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
  const visible = sections.filter((s) =>
    s.type === "hero" || s.type === "contact" || s.type === "blog" ||
    (s.type === "custom" ? Boolean(data.itemsBySection[s.id]?.length) : filled[s.type] !== false)
  );
  // Work, education and achievements share one combined timeline when at least two of them have content.
  const JOURNEY = ["experience", "education", "achievements"];
  const parts = visible.filter((s) => JOURNEY.includes(s.type));
  const host = parts.length >= 2 ? (parts.find((s) => s.type === "experience") ?? parts[0]) : null;
  const shown = host ? visible.filter((s) => !JOURNEY.includes(s.type) || s.id === host.id) : visible;

  const jsonLd = JSON.stringify({
    "@context": "https://schema.org", "@type": "Person",
    name: p.full_name, jobTitle: p.headline, description: p.bio, image: p.avatar_url, email: p.email,
    sameAs: (p.socials ?? []).map((x: any) => x.url).filter((u: string) => /^https?:/.test(u)),
  }).replace(/</g, "\\u003c");

  const hasContact = shown.some((s) => s.type === "contact");
  const navLinks = shown.filter((s) => !["hero", "contact"].includes(s.type)).slice(0, 6).map((s) => ({ label: s.title, href: `#${s.key}` }));
  const cta = hasContact ? { label: "Contact", href: "#contact" } : p.email ? { label: "Contact", href: `mailto:${p.email}` } : undefined;

  return (
    <div className="relative z-[1]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
      <SiteNav name={p.theme?.site_name || p.full_name || "Portfolio"} links={navLinks} cta={cta} />
      <main>
        {shown.map((s, i) => {
          const n = String(i + 1).padStart(2, "0");
          const el = s.type === "hero"
            ? <Hero key={s.id} p={p} hasProjects={shown.some((x) => x.type === "projects")} hasContact={hasContact} />
            : renderSection(s, data, n, host?.id === s.id);
          // the faint falling skills/tools sit behind the first two sections only
          if (i === 0) return <div key={s.id} className="relative isolate"><FallingStack items={[...data.tools, ...data.skills] as any[]} />{el}{shown[1] ? renderSection(shown[1], data, "02", host?.id === shown[1].id) : null}</div>;
          if (i === 1) return null;
          return el;
        })}
      </main>
      <Footer p={p} year={data.year} />
    </div>
  );
}
