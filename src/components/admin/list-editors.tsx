"use client";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SocialIcon } from "@/components/site/social-icon";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

export const PLATFORMS = [
  "LinkedIn", "GitHub", "X / Twitter", "Instagram", "Reddit", "YouTube", "Facebook",
  "Medium", "Dev.to", "Dribbble", "Behance", "Stack Overflow", "Discord",
  "Telegram", "WhatsApp", "Website", "Email", "Other",
];

type Stat = { label: string; value: string };
type Social = { platform: string; url: string };

export function StatsEditor({ name, initial }: { name: string; initial: Stat[] }) {
  const [rows, setRows] = useState<Stat[]>(initial.length ? initial : [{ label: "", value: "" }]);
  const set = (i: number, k: keyof Stat, v: string) =>
    setRows((r) => r.map((x, j) => (j === i ? { ...x, [k]: v } : x)));
  return (
    <div className="flex flex-col gap-2">
      <input type="hidden" name={name} value={JSON.stringify(rows)} />
      {rows.map((r, i) => (
        <div key={i} className="flex flex-col gap-2 rounded-lg border p-2 sm:flex-row sm:border-0 sm:p-0">
          <Input className="sm:w-32" placeholder="Value (e.g. 5+)" value={r.value} onChange={(e) => set(i, "value", e.target.value)} aria-label="Stat value" />
          <Input className="flex-1" placeholder="Label (e.g. Years of experience)" value={r.label} onChange={(e) => set(i, "label", e.target.value)} aria-label="Stat label" />
          <Button type="button" variant="ghost" size="sm" className="self-end sm:self-auto" onClick={() => setRows((r) => r.filter((_, j) => j !== i))}>Remove</Button>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" className="w-fit" onClick={() => setRows((r) => [...r, { label: "", value: "" }])}>
        + Add stat
      </Button>
    </div>
  );
}

export function SocialsEditor({ name, initial }: { name: string; initial: Social[] }) {
  const [rows, setRows] = useState<Social[]>(initial.length ? initial : [{ platform: "LinkedIn", url: "" }]);
  const set = (i: number, k: keyof Social, v: string) =>
    setRows((r) => r.map((x, j) => (j === i ? { ...x, [k]: v } : x)));
  return (
    <div className="flex flex-col gap-2">
      <input type="hidden" name={name} value={JSON.stringify(rows)} />
      {rows.map((r, i) => (
        <div key={i} className="flex flex-col gap-2 rounded-lg border p-2 sm:flex-row sm:border-0 sm:p-0">
          <Select value={r.platform} onValueChange={(v) => v && set(i, "platform", String(v))}>
            <SelectTrigger className="w-full sm:w-44" aria-label="Platform">
              <SelectValue placeholder="Platform" />
            </SelectTrigger>
            <SelectContent>
              {PLATFORMS.map((p) => (
                <SelectItem key={p} value={p}><span className="flex items-center gap-2"><SocialIcon platform={p} className="h-4 w-4 shrink-0" />{p}</span></SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input className="flex-1" placeholder={r.platform === "Email" ? "you@example.com" : "https://..."} value={r.url} onChange={(e) => set(i, "url", e.target.value)} aria-label="URL" />
          <Button type="button" variant="ghost" size="sm" className="self-end sm:self-auto" onClick={() => setRows((r) => r.filter((_, j) => j !== i))}>Remove</Button>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" className="w-fit" onClick={() => setRows((r) => [...r, { platform: "GitHub", url: "" }])}>
        + Add link
      </Button>
    </div>
  );
}
