"use client";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { uploadFiles } from "@/lib/upload-store";

type Props = {
  name?: string;
  label: string;
  folder: string;
  accept: string;
  defaultValue?: string | null;
  maxMB?: number;
  onChange?: (url: string) => void;
};

const isImage = (u: string) => /\.(png|jpe?g|webp|gif|svg|avif)(\?|$)/i.test(u);

export function FileUpload({ name, label, folder, accept, defaultValue, maxMB = 5, onChange }: Props) {
  const [url, setUrl] = useState(defaultValue ?? "");
  const [busy, setBusy] = useState(false);
  const ref = useRef<HTMLInputElement>(null);

  const update = (u: string) => { setUrl(u); onChange?.(u); };

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (ref.current) ref.current.value = "";
    if (!file) return;
    setBusy(true);
    await uploadFiles(file, {
      folder, maxMB,
      accept: accept.split(",").map((s) => s.trim()).filter(Boolean),
      onEach: (u) => { update(u.url); toast.success("Uploaded. Click Save to apply."); },
    });
    setBusy(false);
  }

  return (
    <div className="flex flex-col gap-2 text-sm font-medium sm:col-span-2">
      {label}
      {name && <input type="hidden" name={name} value={url} />}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-dashed p-4 sm:gap-4">
        {url && isImage(url) && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt="" className="h-20 w-20 rounded-lg object-cover" />
        )}
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          {url ? (
            <a href={url} target="_blank" rel="noreferrer" className="truncate text-xs font-normal text-indigo-600 underline">
              {decodeURIComponent(url.split("/").pop() ?? "file")}
            </a>
          ) : (
            <span className="text-xs font-normal text-neutral-500">No file uploaded</span>
          )}
        </div>
        <input ref={ref} type="file" accept={accept} className="hidden" onChange={onPick} />
        <Button type="button" variant="outline" size="sm" disabled={busy} onClick={() => ref.current?.click()}>
          {busy ? "Uploading…" : url ? "Replace" : "Upload"}
        </Button>
        {url && <Button type="button" variant="ghost" size="sm" onClick={() => update("")}>Remove</Button>}
      </div>
    </div>
  );
}
