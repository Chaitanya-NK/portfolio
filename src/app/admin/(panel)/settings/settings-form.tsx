"use client";
import { useActionState, useState } from "react";
import { HexColorPicker } from "react-colorful";
import { saveSettings, type SettingsState } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { FileUpload } from "@/components/admin/file-upload";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const PRESETS = ["#C6F432", "#7DD3FC", "#F472B6", "#FBBF24", "#34D399", "#A78BFA"];

function luminance(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
const contrastOnDark = (hex: string) => (luminance(hex) + 0.05) / (0.003 + 0.05);

export function SettingsForm({ theme }: { theme: Record<string, any> }) {
  const [state, action, pending] = useActionState<SettingsState, FormData>(saveSettings, null);
  const [accent, setAccent] = useState<string>(theme.accent || "#C6F432");
  const [resumeMode, setResumeMode] = useState<string>(theme.resume_mode || "upload");
  const valid = /^#[0-9a-fA-F]{6}$/.test(accent);
  const low = valid && contrastOnDark(accent) < 4.5;
  return (
    <form action={action} className="flex max-w-2xl flex-col gap-6">
      <Card>
        <CardHeader><CardTitle>Brand</CardTitle></CardHeader>
        <CardContent className="grid gap-5">
          <label className="flex flex-col gap-1 text-sm font-medium">
            Site name (shown in the top bar)
            <Input name="site_name" defaultValue={theme.site_name ?? ""} placeholder="Defaults to your full name" />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium">
            Footer text
            <Input name="footer_text" defaultValue={theme.footer_text ?? ""} placeholder="© 2026 Your Name" />
          </label>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Site icons</CardTitle></CardHeader>
        <CardContent className="grid gap-4">
          <FileUpload name="favicon_url" label="Favicon (square PNG or SVG, at least 256 px)" folder="brand" accept="image/png,image/svg+xml,image/x-icon" defaultValue={theme.favicon_url} maxMB={1} />
          <FileUpload name="share_image_url" label="Share image for WhatsApp, LinkedIn and X links (1200 × 630 PNG or JPG)" folder="brand" accept="image/png,image/jpeg" defaultValue={theme.share_image_url} maxMB={2} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Resume button</CardTitle></CardHeader>
        <CardContent className="grid gap-3">
          <input type="hidden" name="resume_mode" value={resumeMode} />
          <Select value={resumeMode} onValueChange={(v) => v != null && setResumeMode(String(v))}>
            <SelectTrigger aria-label="Resume button action"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="upload">Open my uploaded PDF (Profile &amp; SEO)</SelectItem>
              <SelectItem value="generated">Open the generated resume page (/resume)</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-sm text-neutral-500">The generated page is built from your Experience, Skills, Education and Projects. <a href="/resume" target="_blank" className="underline">Preview it</a>.</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Accent color</CardTitle></CardHeader>
        <CardContent className="grid gap-4">
          <input type="hidden" name="accent" value={accent} />
          <div className="flex flex-wrap items-center gap-3">
            <Popover>
              <PopoverTrigger className="flex h-10 items-center gap-2 rounded-md border px-3 text-sm" aria-label="Pick color">
                <span className="h-5 w-5 rounded-full border" style={{ background: valid ? accent : "#000" }} />
                Pick color
              </PopoverTrigger>
              <PopoverContent className="w-auto p-3">
                <HexColorPicker color={valid ? accent : "#C6F432"} onChange={setAccent} />
              </PopoverContent>
            </Popover>
            <Input className="w-32 font-mono" value={accent} onChange={(e) => setAccent(e.target.value)} aria-label="Hex color" />
            <div className="flex flex-wrap gap-2">
              {PRESETS.map((c) => (
                <button key={c} type="button" aria-label={`Use ${c}`} onClick={() => setAccent(c)}
                  className="h-8 w-8 rounded-full border" style={{ background: c }} />
              ))}
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl bg-[#0A0A0F] p-4">
            <span className="rounded-full px-4 py-2 text-sm font-semibold text-[#0A0A0F]" style={{ background: valid ? accent : "#888" }}>Button</span>
            <span className="text-sm font-semibold" style={{ color: valid ? accent : "#888" }}>Accent text</span>
          </div>
          {low && <p className="text-sm text-amber-600">This color is quite dark on the dark site, so text may be hard to read. Pick a lighter one.</p>}
        </CardContent>
      </Card>
      <div className="flex items-center gap-4">
        <Button type="submit" disabled={pending || !valid}>{pending ? "Saving…" : "Save settings"}</Button>
        {state && <span className={`text-sm ${state.ok ? "text-green-600" : "text-red-600"}`}>{state.message}</span>}
      </div>
    </form>
  );
}
