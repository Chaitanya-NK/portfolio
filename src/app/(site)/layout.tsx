import { Suspense } from "react";
import type { Metadata } from "next";
import { Space_Grotesk, JetBrains_Mono } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { Tracker } from "@/components/site/tracker";
import { ThemeToggle } from "@/components/site/theme-toggle";
import { getSiteData } from "@/lib/site/data";

const display = Space_Grotesk({ subsets: ["latin"], variable: "--font-display", weight: ["500", "700"] });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });

export async function generateMetadata(): Promise<Metadata> {
  const { profile: p } = await getSiteData();
  const icon = p.theme?.favicon_url;
  return icon ? { icons: { icon, apple: icon } } : {};
}

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const { profile: p } = await getSiteData();
  const accent = p.theme?.accent || "#C6F432";
  return (
    <ThemeProvider attribute="data-theme" defaultTheme="dark" enableSystem={false} storageKey="site-theme" disableTransitionOnChange>
      <div
        className={`site ${display.variable} ${mono.variable} flow-root min-h-dvh overflow-x-clip`}
        style={{ ["--accent" as string]: accent }}
      >
        {children}
        <ThemeToggle />
        <Suspense fallback={null}><Tracker /></Suspense>
      </div>
    </ThemeProvider>
  );
}
