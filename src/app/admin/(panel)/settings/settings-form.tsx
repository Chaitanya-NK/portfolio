"use client";
import { useActionState, useEffect, useState } from "react";
import { format } from "date-fns";
import { HexColorPicker } from "react-colorful";
import { saveSettings, type SettingsState } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileUpload } from "@/components/admin/file-upload";
import { DatePicker, DateTimePicker } from "@/components/admin/date-picker";

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

const L = ({ t, children }: { t: string; children: React.ReactNode }) => (
  <label className="flex flex-col gap-1 text-sm font-medium">{t}{children}</label>
);

export function SettingsForm({ theme, aiReady }: { theme: Record<string, any>; aiReady: boolean }) {
  const [state, action, pending] = useActionState<SettingsState, FormData>(saveSettings, null);
  const [accent, setAccent] = useState<string>(theme.accent || "#C6F432");
  const [resumeMode, setResumeMode] = useState<string>(theme.resume_mode || "upload");
  const ann = theme.announcement ?? {};
  const [annOn, setAnnOn] = useState<boolean>(Boolean(ann.enabled));
  const [annText, setAnnText] = useState<string>(ann.text ?? "");
  const [annLabel, setAnnLabel] = useState<string>(ann.link_label ?? "");
  const [annUrl, setAnnUrl] = useState<string>(ann.link_url ?? "");
  const [annStart, setAnnStart] = useState("");
  const [annEnd, setAnnEnd] = useState("");
  const [availUntil, setAvailUntil] = useState("");
  const [maint, setMaint] = useState<boolean>(Boolean(theme.maintenance));
  const [ask, setAsk] = useState<boolean>(Boolean(theme.assistant_enabled));

  // dates are shown in the browser's own time zone, so fill them after mount
  useEffect(() => {
    if (ann.start) setAnnStart(format(new Date(ann.start), "yyyy-MM-dd'T'HH:mm"));
    if (ann.end) setAnnEnd(format(new Date(ann.end), "yyyy-MM-dd'T'HH:mm"));
    if (theme.availability_until) setAvailUntil(format(new Date(theme.availability_until), "yyyy-MM-dd"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const valid = /^#[0-9a-fA-F]{6}$/.test(accent);
  const low = valid && contrastOnDark(accent) < 4.5;

  return (
    <form action={action} className="flex max-w-3xl flex-col gap-6">
      <Card>
        <CardHeader><CardTitle>Brand</CardTitle></CardHeader>
        <CardContent className="grid gap-5">
          <L t="Site name (shown in the top bar)"><Input name="site_name" defaultValue={theme.site_name ?? ""} placeholder="Defaults to your full name" /></L>
          <L t="Footer text"><Input name="footer_text" defaultValue={theme.footer_text ?? ""} placeholder="© 2026 Your Name" /></L>
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
        <CardHeader><CardTitle>Availability badge</CardTitle></CardHeader>
        <CardContent className="grid gap-3">
          <input type="hidden" name="availability_until" value={availUntil ? new Date(`${availUntil}T23:59:59`).toISOString() : ""} />
          <div className="flex flex-col gap-1 text-sm font-medium">
            Hide the badge automatically after
            <DatePicker value={availUntil} onChange={setAvailUntil} placeholder="Never (stays until you change it)" />
          </div>
          <p className="text-sm text-neutral-500">The text itself is set in Profile &amp; SEO. After this date the badge disappears by itself, so it never says “open to work” when you aren’t.</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Announcement banner</CardTitle></CardHeader>
        <CardContent className="grid gap-4">
          <input type="hidden" name="ann_enabled" value={annOn ? "on" : ""} />
          <div className="flex items-center justify-between rounded-lg border p-3 text-sm font-medium">
            Show the banner
            <Switch checked={annOn} onCheckedChange={(c: boolean) => setAnnOn(c)} aria-label="Show the banner" />
          </div>
          <L t="Message (up to 160 characters)"><Input name="ann_text" maxLength={160} value={annText} onChange={(e) => setAnnText(e.target.value)} placeholder="Open to new roles from January" /></L>
          <div className="grid gap-3 sm:grid-cols-2">
            <L t="Link text (optional)"><Input name="ann_link_label" maxLength={40} value={annLabel} onChange={(e) => setAnnLabel(e.target.value)} placeholder="Get in touch" /></L>
            <L t="Link address (optional)"><Input name="ann_link_url" value={annUrl} onChange={(e) => setAnnUrl(e.target.value)} placeholder="#contact or https://…" /></L>
          </div>
          <input type="hidden" name="ann_start" value={annStart ? new Date(annStart).toISOString() : ""} />
          <input type="hidden" name="ann_end" value={annEnd ? new Date(annEnd).toISOString() : ""} />
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1 text-sm font-medium">Show from (optional)<DateTimePicker value={annStart} onChange={setAnnStart} /></div>
            <div className="flex flex-col gap-1 text-sm font-medium">Hide after (optional)<DateTimePicker value={annEnd} onChange={setAnnEnd} /></div>
          </div>
          {annText && (
            <div className="rounded-lg bg-[#0A0A0F] p-3">
              <div className="rounded-md px-4 py-2 text-center text-sm font-medium text-[#0A0A0F]" style={{ background: valid ? accent : "#888" }}>
                {annText}{annUrl && <span className="ml-2 underline">{annLabel || "Learn more"}</span>}
              </div>
            </div>
          )}
          <p className="text-sm text-neutral-500">Visitors can dismiss it, and it stays dismissed for them until you change the message.</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Accent color</CardTitle></CardHeader>
        <CardContent className="grid gap-4">
          <input type="hidden" name="accent" value={accent} />
          <div className="flex flex-wrap items-center gap-3">
            <Popover>
              <PopoverTrigger className="flex h-10 items-center gap-2 rounded-md border px-3 text-sm" aria-label="Pick color">
                <span className="h-5 w-5 rounded-full border" style={{ background: valid ? accent : "#000" }} />Pick color
              </PopoverTrigger>
              <PopoverContent className="w-auto p-3"><HexColorPicker color={valid ? accent : "#C6F432"} onChange={setAccent} /></PopoverContent>
            </Popover>
            <Input className="w-32 font-mono" value={accent} onChange={(e) => setAccent(e.target.value)} aria-label="Hex color" />
            <div className="flex flex-wrap gap-2">
              {PRESETS.map((c) => (
                <button key={c} type="button" aria-label={`Use ${c}`} onClick={() => setAccent(c)} className="h-8 w-8 rounded-full border" style={{ background: c }} />
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

      <Card>
        <CardHeader><CardTitle>“Ask AI” assistant</CardTitle></CardHeader>
        <CardContent className="grid gap-3">
          <input type="hidden" name="assistant_enabled" value={ask ? "on" : ""} />
          <div className="flex items-center justify-between rounded-lg border p-3 text-sm font-medium">
            Show the Ask AI chat on my site
            <Switch checked={ask} onCheckedChange={(c: boolean) => setAsk(c)} aria-label="Show the Ask AI chat" />
          </div>
          <p className={`text-sm ${aiReady ? "text-green-700" : "text-amber-600"}`}>
            {aiReady ? "✓ AI key found." : "No GEMINI_API_KEY is set, so the chat stays hidden. Add the key in your environment variables."}
          </p>
          <p className="text-sm text-neutral-500">Answers come only from your public portfolio content. Visitors are limited per person and to a daily total (ASK_DAILY_CAP) so the free quota lasts. Visitors’ questions are processed by Google Gemini.</p>
        </CardContent>
      </Card>

      <Card className={maint ? "border-red-300" : ""}>
        <CardHeader><CardTitle>Maintenance mode</CardTitle></CardHeader>
        <CardContent className="grid gap-4">
          <input type="hidden" name="maintenance" value={maint ? "on" : ""} />
          <div className="flex items-center justify-between rounded-lg border p-3 text-sm font-medium">
            Show a “back soon” page to visitors
            <Switch checked={maint} onCheckedChange={(c: boolean) => setMaint(c)} aria-label="Maintenance mode" />
          </div>
          <L t="Message (optional)"><Textarea name="maintenance_message" rows={2} maxLength={300} defaultValue={theme.maintenance_message ?? ""} placeholder="I’m updating a few things and will be back shortly." /></L>
          <p className={`text-sm ${maint ? "text-red-600" : "text-neutral-500"}`}>
            {maint
              ? "Maintenance mode will be ON after you save. The public site is hidden from visitors and search engines, but this admin area keeps working. Turn it off to see the site again."
              : "The admin area always keeps working while this is on."}
          </p>
        </CardContent>
      </Card>

      <div className="flex items-center gap-4">
        <Button type="submit" disabled={pending || !valid}>{pending ? "Saving…" : "Save settings"}</Button>
        {state && <span className={`text-sm ${state.ok ? "text-green-600" : "text-red-600"}`}>{state.message}</span>}
      </div>
    </form>
  );
}
