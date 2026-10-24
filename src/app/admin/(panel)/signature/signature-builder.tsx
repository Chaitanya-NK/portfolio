"use client";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Social = { platform?: string; label?: string; url: string };
type P = {
  full_name?: string | null; headline?: string | null; email?: string | null; phone?: string | null;
  avatar_url?: string | null; resume_url?: string | null; socials?: Social[] | null; theme?: { resume_mode?: string } | null;
};

const SWATCHES = ["#4F46E5", "#0F766E", "#B45309", "#BE185D", "#111111"];
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

type Opts = {
  name: string; title: string; email: string; phone: string; site: string; photo: string;
  accent: string; layout: "card" | "compact"; links: { name: string; url: string }[];
};

function build(o: Opts) {
  const a = (url: string, label: string) => `<a href="${esc(url)}" style="color:${o.accent};text-decoration:none">${esc(label)}</a>`;
  const bits: string[] = [];
  if (o.email) bits.push(a(`mailto:${o.email}`, o.email));
  if (o.phone) bits.push(a(`tel:${o.phone.replace(/[^\d+]/g, "")}`, o.phone));
  const web = o.site ? a(o.site, o.site.replace(/^https?:\/\//, "").replace(/\/$/, "")) : "";
  const social = o.links.map((l) => a(l.url, l.name)).join(" &nbsp;·&nbsp; ");
  const sep = " &nbsp;|&nbsp; ";

  const html =
    o.layout === "compact"
      ? `<div style="font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:1.5;color:#444444"><strong style="color:#111111">${esc(o.name)}</strong>${o.title ? ` &nbsp;·&nbsp; ${esc(o.title)}` : ""}<br>${[...bits, web].filter(Boolean).join(sep)}${social ? `<br>${social}` : ""}</div>`
      : `<table cellpadding="0" cellspacing="0" border="0" style="font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.45;color:#444444"><tr>${
          o.photo ? `<td style="padding-right:16px;vertical-align:top"><img src="${esc(o.photo)}" width="84" height="84" alt="${esc(o.name)}" style="display:block;width:84px;height:84px;border-radius:50%;object-fit:cover"></td>` : ""
        }<td style="${o.photo ? `border-left:3px solid ${o.accent};padding-left:16px;` : ""}vertical-align:top"><div style="font-size:18px;font-weight:bold;color:#111111">${esc(o.name)}</div>${
          o.title ? `<div style="color:#666666;margin-bottom:6px">${esc(o.title)}</div>` : ""
        }${bits.length ? `<div>${bits.join(sep)}</div>` : ""}${web ? `<div>${web}</div>` : ""}${social ? `<div style="margin-top:6px">${social}</div>` : ""}</td></tr></table>`;

  const text = [o.name + (o.title ? ` | ${o.title}` : ""), [o.email, o.phone].filter(Boolean).join(" | "), o.site, o.links.map((l) => `${l.name}: ${l.url}`).join("  ")]
    .filter(Boolean).join("\n");
  return { html, text };
}

const Row = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <label className="flex flex-col gap-1 text-sm font-medium">{label}{children}</label>
);

export function SignatureBuilder({ p, site }: { p: P; site: string }) {
  const socials = (p.socials ?? []).filter((s) => /^https?:/i.test(s.url));
  const resumeUrl = p.theme?.resume_mode === "generated" && site ? `${site}/resume` : p.resume_url ?? "";
  const [name, setName] = useState(p.full_name ?? "");
  const [title, setTitle] = useState(p.headline ?? "");
  const [email, setEmail] = useState(p.email ?? "");
  const [phone, setPhone] = useState("");
  const [showSite, setShowSite] = useState(Boolean(site));
  const [showPhoto, setShowPhoto] = useState(Boolean(p.avatar_url));
  const [showResume, setShowResume] = useState(false);
  const [layout, setLayout] = useState<"card" | "compact">("card");
  const [accent, setAccent] = useState("#4F46E5");
  const [picked, setPicked] = useState<number[]>(socials.slice(0, 3).map((_, i) => i));
  const ref = useRef<HTMLDivElement>(null);

  const links = [
    ...socials.filter((_, i) => picked.includes(i)).map((s) => ({ name: s.platform ?? s.label ?? "Link", url: s.url })),
    ...(showResume && resumeUrl ? [{ name: "Resume", url: resumeUrl }] : []),
  ];
  const { html, text } = build({
    name, title, email, phone, site: showSite ? site : "", photo: showPhoto && layout === "card" ? p.avatar_url ?? "" : "",
    accent, layout, links,
  });

  async function copyRich() {
    try {
      await navigator.clipboard.write([
        new ClipboardItem({
          "text/html": new Blob([html], { type: "text/html" }),
          "text/plain": new Blob([text], { type: "text/plain" }),
        }),
      ]);
      toast.success("Signature copied. Paste it into your email settings.");
      return;
    } catch {}
    const el = ref.current, sel = window.getSelection();
    if (el && sel) {
      const range = document.createRange();
      range.selectNodeContents(el);
      sel.removeAllRanges(); sel.addRange(range);
      const ok = document.execCommand("copy");
      sel.removeAllRanges();
      if (ok) { toast.success("Signature copied. Paste it into your email settings."); return; }
    }
    toast.error("Couldn’t copy. Select the preview and press Ctrl+C.");
  }
  async function copyCode() {
    try { await navigator.clipboard.writeText(html); toast.success("HTML copied"); }
    catch { toast.error("Couldn’t copy the code."); }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <Card>
        <CardHeader><CardTitle>Details</CardTitle></CardHeader>
        <CardContent className="grid gap-4">
          <Row label="Name"><Input value={name} onChange={(e) => setName(e.target.value)} /></Row>
          <Row label="Title"><Input value={title} onChange={(e) => setTitle(e.target.value)} /></Row>
          <div className="grid gap-4 sm:grid-cols-2">
            <Row label="Email"><Input value={email} onChange={(e) => setEmail(e.target.value)} /></Row>
            <Row label="Phone (optional)"><Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 …" /></Row>
          </div>

          <div className="flex flex-col gap-2 text-sm font-medium">
            Layout
            <div className="flex gap-2">
              {(["card", "compact"] as const).map((l) => (
                <button key={l} type="button" aria-pressed={layout === l} onClick={() => setLayout(l)}
                  className={`rounded-full border px-4 py-2 text-sm ${layout === l ? "border-neutral-900 bg-neutral-900 text-white" : "bg-white text-neutral-600 hover:bg-neutral-50"}`}>
                  {l === "card" ? "Card with photo" : "Compact"}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2 text-sm font-medium">
            Link color
            <div className="flex flex-wrap items-center gap-2">
              {SWATCHES.map((c) => (
                <button key={c} type="button" aria-label={`Use ${c}`} aria-pressed={accent === c} onClick={() => setAccent(c)}
                  className={`h-8 w-8 rounded-full border-2 ${accent === c ? "border-neutral-900" : "border-transparent"}`} style={{ background: c }} />
              ))}
            </div>
          </div>

          {p.avatar_url && layout === "card" && (
            <div className="flex items-center justify-between rounded-lg border p-3 text-sm font-medium">Include my photo<Switch checked={showPhoto} onCheckedChange={(c: boolean) => setShowPhoto(c)} aria-label="Include photo" /></div>
          )}
          {site && <div className="flex items-center justify-between rounded-lg border p-3 text-sm font-medium">Include my website<Switch checked={showSite} onCheckedChange={(c: boolean) => setShowSite(c)} aria-label="Include website" /></div>}
          {resumeUrl && <div className="flex items-center justify-between rounded-lg border p-3 text-sm font-medium">Include a resume link<Switch checked={showResume} onCheckedChange={(c: boolean) => setShowResume(c)} aria-label="Include resume" /></div>}

          {socials.length > 0 && (
            <div className="flex flex-col gap-2 text-sm font-medium">
              Social links
              <div className="flex flex-wrap gap-2">
                {socials.map((s, i) => {
                  const on = picked.includes(i);
                  return (
                    <button key={i} type="button" aria-pressed={on}
                      onClick={() => setPicked((l) => (on ? l.filter((x) => x !== i) : [...l, i]))}
                      className={`rounded-full border px-3 py-1.5 text-sm ${on ? "border-neutral-900 bg-neutral-900 text-white" : "bg-white text-neutral-600 hover:bg-neutral-50"}`}>
                      {s.platform ?? s.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex flex-col gap-4">
        <Card>
          <CardHeader><CardTitle>Preview</CardTitle></CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div ref={ref} className="overflow-x-auto rounded-lg border bg-white p-5" dangerouslySetInnerHTML={{ __html: html }} />
            <div className="flex flex-wrap gap-2">
              <Button onClick={copyRich}><Copy className="mr-2 h-4 w-4" />Copy signature</Button>
              <Button variant="outline" onClick={copyCode}>Copy HTML code</Button>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Where to paste it</CardTitle></CardHeader>
          <CardContent className="flex flex-col gap-3 text-sm text-neutral-600">
            <p><strong className="text-neutral-900">Gmail:</strong> Settings (gear) → See all settings → General → Signature → Create new → paste with Ctrl+V → Save changes.</p>
            <p><strong className="text-neutral-900">Outlook on the web:</strong> Settings → Accounts → Signatures → paste → Save.</p>
            <p><strong className="text-neutral-900">Outlook desktop:</strong> File → Options → Mail → Signatures → New → paste.</p>
            <p className="text-xs">The photo is loaded from your site, so recipients may need to click “show images”. Outlook desktop shows round photos as squares.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
