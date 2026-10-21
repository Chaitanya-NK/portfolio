import { Suspense } from "react";
import { Space_Grotesk, JetBrains_Mono } from "next/font/google";
import { Tracker } from "@/components/site/tracker";

const display = Space_Grotesk({ subsets: ["latin"], variable: "--font-display", weight: ["500", "700"] });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${display.variable} ${mono.variable} flow-root min-h-dvh overflow-x-clip bg-[#0A0A0F] text-[#F2F2F5] [color-scheme:dark]`}>
      {children}
      <Suspense fallback={null}><Tracker /></Suspense>
    </div>
  );
}
