"use client";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, ImagePlus, Sparkles, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { aiAltText } from "@/app/admin/ai-actions";
import { uploadFiles } from "@/lib/upload-store";
import type { GalleryItem } from "@/lib/case-study";

const MAX = 24;

export function GalleryEditor({ value, onChange, folder = "projects" }: {
  value: GalleryItem[]; onChange: (v: GalleryItem[]) => void; folder?: string;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState("");
  const [drag, setDrag] = useState(false);
  const [aiIdx, setAiIdx] = useState<number | null>(null);

  async function add(files: FileList | File[]) {
    const all = Array.from(files);
    const ok = all.filter((f) => /^image\/(png|jpe?g|webp|gif)$/.test(f.type) && f.size <= 5 * 1024 * 1024);
    if (ok.length < all.length) toast.error("Some files were skipped. Use PNG, JPG, WebP or GIF under 5 MB.");
    const room = MAX - value.length;
    if (ok.length > room) toast.error(`A gallery holds up to ${MAX} images.`);
    const take = ok.slice(0, Math.max(0, room));
    if (!take.length) return;
    setBusy("Uploading…");
    const ups = await uploadFiles(take, { folder: `${folder}/gallery`, accept: ["image/png", "image/jpeg", "image/webp", "image/gif"], maxMB: 5 });
    setBusy("");
    if (ups.length) {
      onChange([...value, ...ups.map((u) => ({ url: u.url, alt: "", caption: "" }))]);
      toast.success(`Added ${ups.length} image${ups.length === 1 ? "" : "s"}. Click Save to apply.`);
    }
  }

  const set = (i: number, p: Partial<GalleryItem>) => onChange(value.map((g, j) => (j === i ? { ...g, ...p } : g)));
  const move = (i: number, d: number) => {
    const k = i + d;
    if (k < 0 || k >= value.length) return;
    const n = [...value];
    [n[i], n[k]] = [n[k], n[i]];
    onChange(n);
  };
  async function suggest(i: number) {
    setAiIdx(i);
    const r = await aiAltText(value[i].url);
    setAiIdx(null);
    if (r.ok) set(i, { alt: r.text });
    else toast.error(r.error);
  }

  return (
    <div className="flex flex-col gap-3">
      <input ref={ref} type="file" multiple accept="image/png,image/jpeg,image/webp,image/gif" className="hidden"
        onChange={(e) => { if (e.target.files) add(e.target.files); e.target.value = ""; }} />
      <div
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); add(e.dataTransfer.files); }}
        className={`flex flex-col items-center gap-2 rounded-xl border-2 border-dashed p-4 text-center text-sm ${drag ? "border-indigo-500 bg-indigo-50" : ""}`}
      >
        <Button type="button" variant="outline" size="sm" disabled={!!busy} onClick={() => ref.current?.click()}>
          <ImagePlus className="mr-2 h-4 w-4" />{busy || "Add screenshots"}
        </Button>
        <span className="text-xs font-normal text-neutral-500">Drop images here too. Up to {MAX}, each under 5 MB.</span>
      </div>

      {value.map((g, i) => (
        <div key={g.url + i} className="flex flex-col gap-2 rounded-lg border bg-neutral-50 p-2 sm:flex-row">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={g.url} alt="" className="h-24 w-full shrink-0 rounded-md border bg-white object-contain sm:w-32" />
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <Input value={g.caption} onChange={(e) => set(i, { caption: e.target.value })} placeholder="Caption (optional)" aria-label="Caption" />
            <div className="flex gap-2">
              <Input value={g.alt} onChange={(e) => set(i, { alt: e.target.value })} placeholder="Alt text (describe the image)" aria-label="Alt text" />
              <Button type="button" variant="outline" size="icon" disabled={aiIdx === i} onClick={() => suggest(i)} aria-label="Suggest alt text with AI" title="Suggest alt text with AI">
                <Sparkles className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="flex shrink-0 gap-1 sm:flex-col">
            <Button type="button" variant="ghost" size="icon" disabled={i === 0} onClick={() => move(i, -1)} aria-label="Move up"><ArrowUp className="h-4 w-4" /></Button>
            <Button type="button" variant="ghost" size="icon" disabled={i === value.length - 1} onClick={() => move(i, 1)} aria-label="Move down"><ArrowDown className="h-4 w-4" /></Button>
            <Button type="button" variant="ghost" size="icon" onClick={() => onChange(value.filter((_, j) => j !== i))} aria-label="Remove image"><Trash2 className="h-4 w-4" /></Button>
          </div>
        </div>
      ))}
    </div>
  );
}
