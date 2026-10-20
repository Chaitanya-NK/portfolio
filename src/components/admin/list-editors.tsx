"use client";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export const PLATFORMS = [
  "LinkedIn", "GitHub", "X / Twitter", "Instagram", "Reddit", "YouTube", "Facebook",
  "Medium", "Dev.to", "Dribbble", "Behance", "Stack Overflow", "Discord",
  "Telegram", "WhatsApp", "Website", "Email", "Other",
];

type Stat = { label: string; value: string };
type Social = { platform: string; url: string };

const selectCls =
  "h-9 rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring";

export function StatsEditor({ name, initial }: { name: string; initial: Stat[] }) {
  const [rows, setRows] = useState<Stat[]>(initial.length ? initial : [{ label: "", value: "" }]);
  const set = (i: number, k: keyof Stat, v: string) =>
    setRows((r) => r.map((x, j) => (j === i ? { ...x, [k]: v } : x)));
  return (
    <div className="flex flex-col gap-2">
      <input type="hidden" name={name} value={JSON.stringify(rows)} />
      {rows.map((r, i) => (
        <div key={i} className="flex gap-2">
          <Input className="w-32" placeholder="Value (e.g. 5+)" value={r.value} onChange={(e) => set(i, "value", e.target.value)} aria-label="Stat value" />
          <Input className="flex-1" placeholder="Label (e.g. Years of experience)" value={r.label} onChange={(e) => set(i, "label", e.target.value)} aria-label="Stat label" />
          <Button type="button" variant="ghost" size="sm" onClick={() => setRows((r) => r.filter((_, j) => j !== i))}>Remove</Button>
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
        <div key={i} className="flex gap-2">
          <select className={`${selectCls} w-44`} value={r.platform} onChange={(e) => set(i, "platform", e.target.value)} aria-label="Platform">
            {PLATFORMS.map((p) => <option key={p}>{p}</option>)}
          </select>
          <Input className="flex-1" placeholder={r.platform === "Email" ? "you@example.com" : "https://..."} value={r.url} onChange={(e) => set(i, "url", e.target.value)} aria-label="URL" />
          <Button type="button" variant="ghost" size="sm" onClick={() => setRows((r) => r.filter((_, j) => j !== i))}>Remove</Button>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" className="w-fit" onClick={() => setRows((r) => [...r, { platform: "GitHub", url: "" }])}>
        + Add link
      </Button>
    </div>
  );
}
