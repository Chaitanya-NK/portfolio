import { ImageResponse } from "next/og";

export const shareSize = { width: 1200, height: 630 };

// the image renderer can't draw WebP or SVG, so only use formats it supports
const drawable = (u?: string | null) => (u && /\.(png|jpe?g|gif)(\?|$)/i.test(u) ? u : null);

type Card = { kicker: string; title: string; subtitle?: string; tags?: string[]; image?: string | null; name?: string | null; accent: string };

/** The link-preview card for a project or blog post: text on the left, the cover on the right when there is one. */
export function shareCard({ kicker, title, subtitle, tags, image, name, accent }: Card) {
  const img = drawable(image);
  const long = title.length > 60;
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "#0A0A0F", color: "#F2F2F5" }}>
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", flex: 1, padding: 64 }}>
          <div style={{ display: "flex", fontSize: 28, color: accent, textTransform: "uppercase", letterSpacing: 3 }}>{kicker.slice(0, 48)}</div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", fontSize: long ? 54 : 68, fontWeight: 700, lineHeight: 1.1 }}>{title.slice(0, 100)}</div>
            {subtitle ? <div style={{ display: "flex", fontSize: 30, color: "#9A9AAE", marginTop: 22, lineHeight: 1.35 }}>{subtitle.slice(0, 130)}</div> : null}
            {tags && tags.length ? (
              <div style={{ display: "flex", marginTop: 26 }}>
                {tags.slice(0, 4).map((t) => (
                  <div key={t} style={{ display: "flex", fontSize: 24, color: "#C9C9D6", border: "2px solid #34343F", borderRadius: 10, padding: "6px 16px", marginRight: 12 }}>{t.slice(0, 20)}</div>
                ))}
              </div>
            ) : null}
          </div>
          <div style={{ display: "flex", alignItems: "center" }}>
            <div style={{ display: "flex", width: 56, height: 8, background: accent, borderRadius: 4, marginRight: 20 }} />
            <div style={{ display: "flex", fontSize: 28, color: "#9A9AAE" }}>{name ?? ""}</div>
          </div>
        </div>
        {img ? (
          <div style={{ display: "flex", width: 420, height: "100%", borderLeft: "2px solid #22222B" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={img} alt="" width={420} height={630} style={{ width: 420, height: 630, objectFit: "cover" }} />
          </div>
        ) : null}
      </div>
    ),
    shareSize
  );
}
