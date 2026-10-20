"use client";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { deleteMedia } from "./actions";

type F = { path: string; name: string; folder: string; url: string; size: number };
const isImg = (n: string) => /\.(png|jpe?g|webp|gif|svg|avif)$/i.test(n);

export function Library({ initial }: { initial: F[] }) {
  const [files, setFiles] = useState(initial);
  if (!files.length) return <p className="rounded-xl border border-dashed p-8 text-center text-sm text-neutral-500">No files uploaded yet.</p>;
  return (
    <div className="grid max-w-5xl grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
      {files.map((f) => (
        <div key={f.path} className="flex flex-col overflow-hidden rounded-xl border bg-white">
          <div className="flex h-32 items-center justify-center bg-neutral-100 text-xs text-neutral-500">
            {isImg(f.name) ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={f.url} alt="" className="h-full w-full object-cover" /> : "File"}
          </div>
          <div className="flex flex-1 flex-col gap-2 p-3">
            <div className="truncate text-sm font-medium" title={f.name}>{f.name.replace(/^\d+-/, "")}</div>
            <div className="text-xs text-neutral-500">{f.folder} · {(f.size / 1024).toFixed(0)} KB</div>
            <div className="mt-auto flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={() => { navigator.clipboard.writeText(f.url); toast.success("URL copied"); }}>Copy URL</Button>
              <Button variant="ghost" size="sm" onClick={async () => { const r = await deleteMedia(f.path); if (!r.ok) return toast.error(r.error ?? "Failed"); setFiles((l) => l.filter((x) => x.path !== f.path)); toast.success("Deleted"); }}>Delete</Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
