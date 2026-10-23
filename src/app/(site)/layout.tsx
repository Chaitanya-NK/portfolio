import { Suspense } from "react";
import type { Metadata } from "next";
import { Space_Grotesk, JetBrains_Mono } from "next/font/google";
import { Tracker } from "@/components/site/tracker";
import { ThemeToggle } from "@/components/site/theme-toggle";
import { getSiteData } from "@/lib/site/data";

const display = Space_Grotesk({ subsets: ["latin"], variable: "--font-display", weight: ["500", "700"] });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });

// runs before first paint so there is no flash of the wrong theme
const THEME_INIT = `try{var t=localStorage.getItem("site-theme");document.documentElement.setAttribute("data-theme",t==="light"?"light":"dark")}catch(e){document.documentElement.setAttribute("data-theme","dark")}`;

export async function generateMetadata(): Promise<Metadata> {
  const { profile: p } = await getSiteData();
  const icon = p.theme?.favicon_url;
  return icon ? { icons: { icon, apple: icon } } : {};
}

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const { profile: p } = await getSiteData();
  const accent = p.theme?.accent || "#C6F432";
  return (
    <div
      className={`site ${display.variable} ${mono.variable} flow-root min-h-dvh overflow-x-clip`}
      style={{ ["--accent" as string]: accent }}
    >
      <script dangerouslySetInnerHTML={{ __html: THEME_INIT }} />
      {children}
      <ThemeToggle />
      <Suspense fallback={null}><Tracker /></Suspense>
    </div>
  );
}
