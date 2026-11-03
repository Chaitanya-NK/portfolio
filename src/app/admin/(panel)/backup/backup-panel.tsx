"use client";

import { useRef, useState, useTransition } from "react";
import { Download, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { exportBackup, restoreBackup } from "./actions";

const card = "rounded-lg border border-neutral-200 bg-white p-5";

export function BackupPanel() {
  const [msgs, setMsgs] = useState(false);
  const [note, setNote] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();
  const file = useRef<HTMLInputElement>(null);

  const download = () => start(async () => {
    setNote(null);
    const r = await exportBackup(msgs);
    if (!r.ok || !r.json) return setNote({ ok: false, text: r.error ?? "Backup failed" });
    const url = URL.createObjectURL(new Blob([r.json], { type: "application/json" }));
    const a = document.createElement("a");
    a.href = url; a.download = r.filename ?? "backup.json"; a.click();
    URL.revokeObjectURL(url);
    setNote({ ok: true, text: `Backed up ${r.rows} rows.` });
  });

  const restore = (f: File | undefined) => {
    if (!f) return;
    if (!window.confirm("Restore from this backup? Matching items will be overwritten with the saved version. Items added since the backup are kept.")) {
      if (file.current) file.current.value = "";
      return;
    }
    start(async () => {
      setNote(null);
      const r = await restoreBackup(await f.text());
      if (file.current) file.current.value = "";
      setNote(r.ok ? { ok: true, text: `Restored ${r.restored} rows.` } : { ok: false, text: r.error ?? "Restore failed" });
    });
  };

  return (
    <div className="grid max-w-3xl gap-4 sm:grid-cols-2">
      <section className={card}>
        <h2 className="mb-1 flex items-center gap-2 font-medium"><Download className="h-4 w-4" aria-hidden />Download a backup</h2>
        <p className="mb-4 text-sm text-neutral-600">Profile, sections, skills, projects, posts and the rest of your content, as one JSON file.</p>
        <label className="mb-4 flex items-center gap-2 text-sm">
          <input type="checkbox" checked={msgs} onChange={(e) => setMsgs(e.target.checked)} /> Include inbox messages and replies
        </label>
        <Button onClick={download} disabled={pending}>{pending ? "Working…" : "Download backup"}</Button>
      </section>

      <section className={card}>
        <h2 className="mb-1 flex items-center gap-2 font-medium"><Upload className="h-4 w-4" aria-hidden />Restore from a backup</h2>
        <p className="mb-4 text-sm text-neutral-600">Pick a file made here. Matching items are replaced with the saved version; nothing is deleted.</p>
        <input ref={file} type="file" accept="application/json,.json" disabled={pending} onChange={(e) => restore(e.target.files?.[0])} className="text-sm" />
      </section>

      {note && <p role="status" className={`sm:col-span-2 text-sm ${note.ok ? "text-green-700" : "text-red-600"}`}>{note.text}</p>}
    </div>
  );
}
