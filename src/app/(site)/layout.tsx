import { Space_Grotesk, JetBrains_Mono } from "next/font/google";

const display = Space_Grotesk({ subsets: ["latin"], variable: "--font-display", weight: ["500", "700"] });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${display.variable} ${mono.variable} min-h-screen overflow-x-clip bg-[#0A0A0F] text-[#F2F2F5] [color-scheme:dark]`}>
      {children}
    </div>
  );
}
