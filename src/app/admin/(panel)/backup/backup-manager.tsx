"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { strFromU8, strToU8, unzipSync, zipSync } from "fflate";
import { toast } from "sonner";
import { Download, FileUp, ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TABLE_LABEL, type Backup } from "@/lib/backup";
import { exportBackup, restoreBackup } from "./actions";

type Loaded = { name: string; b: Backup; media: Record<string, Uint8Array> };

const mb = (n: number) => `${(n / 1048576).toFixed(n > 10485760 ? 0 : 1)} MB`;
const stamp = () => format(new Date(), "yyyyMMdd-HHmm");
const TYPES: Record<string, string> = {
  png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", webp: "image/webp", gif: "image/gif",
  svg: "image/svg+xml", pdf: "application/pdf", ico: "image/x-icon", txt: "text/plain", avif: "image/avif",
};

function save(name: string, data: unknown, type: string) {
  const url = URL.createObjectURL(new Blob([data as BlobPart], { type }));
  const a = document.createElement("a");
  a.href = url; a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

function Toggle({ label, hint, on, set }: { label: string; hint: string; on: boolean; set: (v: boolean) => void }) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-lg border p-3">
      <div className="text-sm"><div className="font-medium">{label}</div><div className="text-neutral-500">{hint}</div></div>
      <Switch checked={on} onCheckedChange={(c: boolean) => set(c)} aria-label={label} />
    </div>
  );
}

export function BackupManager({ last, lastLabel }: { last: string | null; lastLabel: string | null }) {
  const router = useRouter();
  const [busy, setBusy] = useState("");
  const [inclMedia, setInclMedia] = useState(true);
  const [inclMsgs, setInclMsgs] = useState(false);
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [mode, setMode] = useState<"merge" | "replace">("merge");
  const [restoreMedia, setRestoreMedia] = useState(true);
  const [restoreMsgs, setRestoreMsgs] = useState(false);
  const [confirm, setConfirm] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const days = last ? Math.floor((Date.now() - new Date(last).getTime()) / 864e5) : null;

  async function download() {
    setBusy("Preparing your backup…");
    const r = await exportBackup({ messages: inclMsgs, media: inclMedia, label: "manual" });
    if (!r.ok) { setBusy(""); toast.error(r.error); return; }

    if (!inclMedia || r.files.length === 0) {
      save(`portfolio-backup-${stamp()}.json`, r.json, "application/json");
      setBusy(""); toast.success("Backup downloaded"); router.refresh();
      return;
    }
    const total = r.files.reduce((a, f) => a + f.size, 0);
    if (total > 300 * 1048576) {
      setBusy("");
      toast.error(`Your media is ${mb(total)}, which is too big to zip in the browser. Turn off “Include images” and download the content only.`);
      return;
    }
    const sb = createClient();
    const files: Record<string, Uint8Array> = { "content.json": strToU8(r.json) };
    let next = 0, done = 0, failed = 0;
    const worker = async () => {
      while (next < r.files.length) {
        const f = r.files[next++];
        try {
          const res = await fetch(sb.storage.from("media").getPublicUrl(f.path).data.publicUrl);
          if (!res.ok) throw new Error(String(res.status));
          files[`media/${f.path}`] = new Uint8Array(await res.arrayBuffer());
        } catch { failed++; }
        setBusy(`Downloading images ${++done} of ${r.files.length}…`);
      }
    };
    await Promise.all([worker(), worker(), worker(), worker()]);
    setBusy("Building the ZIP file…");
    save(`portfolio-backup-${stamp()}.zip`, zipSync(files, { level: 0 }), "application/zip");
    setBusy("");
    if (failed) toast.warning(`Backup downloaded, but ${failed} image${failed === 1 ? "" : "s"} couldn’t be fetched.`);
    else toast.success("Backup downloaded");
    router.refresh();
  }

  async function pick(file: File) {
    try {
      let text: string;
      const media: Record<string, Uint8Array> = {};
      if (/\.zip$/i.test(file.name)) {
        const u = unzipSync(new Uint8Array(await file.arrayBuffer()));
        if (!u["content.json"]) throw new Error("This ZIP has no content.json inside.");
        text = strFromU8(u["content.json"]);
        for (const [k, v] of Object.entries(u)) {
          if (!k.startsWith("media/") || k.endsWith("/")) continue;
          const p = k.slice(6);
          if (p && !p.includes("..") && /^[\w\-./ ]+$/.test(p)) media[p] = v;
        }
      } else text = await file.text();
      const b = JSON.parse(text) as Backup;
      if (b?.version !== 1 || b.app !== "portfolio" || !b.tables) throw new Error("That isn’t a backup from this portfolio.");
      setLoaded({ name: file.name, b, media });
      setMode("merge"); setConfirm(""); setRestoreMsgs(false); setRestoreMedia(true);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn’t read that file.");
    }
  }

  async function run() {
    if (!loaded) return;
    // 1. safety copy of what you have right now
    setBusy("Saving a safety copy of your current content…");
    const cur = await exportBackup({ messages: false, media: false, label: "safety copy" });
    if (!cur.ok) { setBusy(""); toast.error(`Couldn’t make a safety copy: ${cur.error}`); return; }
    save(`portfolio-before-restore-${stamp()}.json`, cur.json, "application/json");

    // 2. restore the content
    setBusy("Restoring your content…");
    const tables = { ...loaded.b.tables };
    if (!restoreMsgs) { delete tables.messages; delete tables.message_replies; }
    const r = await restoreBackup(JSON.stringify({ ...loaded.b, tables }), mode);
    if (!r.ok) { setBusy(""); toast.error(r.error); return; }

    // 3. restore the images
    const paths = restoreMedia ? Object.keys(loaded.media) : [];
    let failed = 0;
    if (paths.length) {
      const sb = createClient();
      let next = 0, done = 0;
      const worker = async () => {
        while (next < paths.length) {
          const p = paths[next++];
          const ext = p.split(".").pop()?.toLowerCase() ?? "";
          const type = TYPES[ext] ?? "application/octet-stream";
          const { error } = await sb.storage.from("media").upload(p, new Blob([loaded.media[p] as BlobPart], { type }), { upsert: true, contentType: type });
          if (error) failed++;
          setBusy(`Restoring images ${++done} of ${paths.length}…`);
        }
      };
      await Promise.all([worker(), worker(), worker(), worker()]);
    }

    setBusy(""); setLoaded(null); setConfirm("");
    if (fileRef.current) fileRef.current.value = "";
    const total = Object.values(r.counts).reduce((a, n) => a + n, 0);
    if (failed) toast.warning(`Restored ${total} items, but ${failed} image${failed === 1 ? "" : "s"} failed to upload.`);
    else toast.success(`Restored ${total} items${paths.length ? ` and ${paths.length} images` : ""}.`);
    router.refresh();
  }

  const tableRows = loaded
    ? Object.entries(loaded.b.tables).filter(([t, rows]) => Array.isArray(rows) && TABLE_LABEL[t])
    : [];
  const hasMsgs = tableRows.some(([t]) => t === "messages");
  const mediaCount = loaded ? Object.keys(loaded.media).length : 0;
  const canRun = loaded && !busy && (mode === "merge" || confirm.trim().toUpperCase() === "REPLACE");

  return (
    <div className="grid max-w-4xl gap-6">
      <Card>
        <CardHeader><CardTitle>Download a backup</CardTitle></CardHeader>
        <CardContent className="grid gap-4">
          <div className={`flex items-center gap-2 rounded-lg border p-3 text-sm ${days === null || days > 30 ? "border-amber-300 bg-amber-50 text-amber-800" : "bg-neutral-50"}`}>
            <ShieldCheck className="h-4 w-4 shrink-0" />
            <span suppressHydrationWarning>
              {last
                ? `Last backup: ${format(new Date(last), "d MMM yyyy, h:mm a")}${lastLabel ? ` (${lastLabel})` : ""}${days !== null && days > 30 ? ` · ${days} days ago` : ""}`
                : "You haven’t made a backup yet."}
            </span>
          </div>
          <Toggle label="Include images" hint="Downloads a ZIP with every file from your media library. Larger, but complete." on={inclMedia} set={setInclMedia} />
          <Toggle label="Include inbox messages" hint="Adds messages and your replies. They contain other people’s details, so keep the file safe. Attachments aren’t included." on={inclMsgs} set={setInclMsgs} />
          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={download} disabled={!!busy}><Download className="mr-2 h-4 w-4" />{busy && !loaded ? "Working…" : "Download backup"}</Button>
            {busy && !loaded && <span className="text-sm text-neutral-500">{busy}</span>}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Restore from a backup</CardTitle></CardHeader>
        <CardContent className="grid gap-4">
          <input ref={fileRef} type="file" accept=".json,.zip,application/json,application/zip" className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) pick(f); }} />
          {!loaded ? (
            <div className="flex flex-col items-start gap-2">
              <Button variant="outline" onClick={() => fileRef.current?.click()}><FileUp className="mr-2 h-4 w-4" />Choose a backup file (.json or .zip)</Button>
              <p className="text-sm text-neutral-500">You’ll see what’s inside and confirm before anything changes. A safety copy of your current content is downloaded first.</p>
            </div>
          ) : (
            <>
              <div className="rounded-lg border p-3 text-sm">
                <div className="font-medium">{loaded.name}</div>
                <div suppressHydrationWarning className="text-neutral-500">Made {format(new Date(loaded.b.exported_at), "d MMM yyyy, h:mm a")}</div>
                <ul className="mt-2 grid gap-x-6 gap-y-1 sm:grid-cols-2">
                  {tableRows.map(([t, rows]) => (
                    <li key={t} className="flex justify-between"><span>{TABLE_LABEL[t]}</span><span className="text-neutral-500">{rows.length}</span></li>
                  ))}
                  {mediaCount > 0 && <li className="flex justify-between"><span>Images</span><span className="text-neutral-500">{mediaCount}</span></li>}
                </ul>
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                {([
                  ["merge", "Merge", "Adds and updates items from the backup. Anything not in the backup stays as it is."],
                  ["replace", "Replace", "Makes your content match the backup exactly. Items that are not in the backup are removed."],
                ] as const).map(([v, t, d]) => (
                  <button key={v} type="button" onClick={() => setMode(v)} aria-pressed={mode === v}
                    className={`rounded-lg border p-3 text-left text-sm ${mode === v ? "border-neutral-900 ring-1 ring-neutral-900" : "hover:bg-neutral-50"}`}>
                    <div className="font-medium">{t}</div><div className="text-neutral-500">{d}</div>
                  </button>
                ))}
              </div>

              {mediaCount > 0 && <Toggle label="Restore images" hint="Uploads the images from the ZIP to your media library (existing files with the same name are overwritten)." on={restoreMedia} set={setRestoreMedia} />}
              {hasMsgs && <Toggle label="Restore inbox messages" hint="Brings back the messages included in this backup." on={restoreMsgs} set={setRestoreMsgs} />}

              {mode === "replace" && (
                <div className="grid gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                  <p>Replace removes anything not in this backup. Your current content is saved to a file first, but please be sure.</p>
                  <Input value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Type REPLACE to confirm" aria-label="Type REPLACE to confirm" className="bg-white" />
                </div>
              )}

              <div className="flex flex-wrap items-center gap-3">
                <Button onClick={run} disabled={!canRun} variant={mode === "replace" ? "destructive" : "default"}>
                  {busy ? "Working…" : mode === "replace" ? "Replace my content" : "Merge backup in"}
                </Button>
                <Button variant="ghost" disabled={!!busy} onClick={() => { setLoaded(null); if (fileRef.current) fileRef.current.value = ""; }}>Cancel</Button>
                {busy && <span className="text-sm text-neutral-500">{busy}</span>}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Automatic weekly backup</CardTitle></CardHeader>
        <CardContent className="text-sm text-neutral-600">
          A scheduled job on your GitHub repository can save a content backup every Sunday and keep it for 90 days (open the repository’s <strong>Actions</strong> tab, then the “Weekly backup” run, then <strong>Artifacts</strong>). Automatic backups don’t include images, so still download a ZIP now and then.
        </CardContent>
      </Card>
    </div>
  );
}
