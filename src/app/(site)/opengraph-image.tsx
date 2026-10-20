import { ImageResponse } from "next/og";
import { getSiteData } from "@/lib/site/data";

export const alt = "Portfolio";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  const { profile: p } = await getSiteData();
  const accent = p.theme?.accent || "#C6F432";
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: "#0A0A0F", color: "#F2F2F5", padding: 72 }}>
        <div style={{ display: "flex", fontSize: 32, color: accent }}>{p.availability || "Portfolio"}</div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", fontSize: 84, fontWeight: 700, lineHeight: 1.05 }}>{String(p.headline || p.full_name || "Portfolio").slice(0, 90)}</div>
          <div style={{ display: "flex", fontSize: 36, color: "#9A9AAE", marginTop: 24 }}>{p.full_name ?? ""}</div>
        </div>
        <div style={{ display: "flex", width: 160, height: 10, background: accent, borderRadius: 5 }} />
      </div>
    ),
    size
  );
}
