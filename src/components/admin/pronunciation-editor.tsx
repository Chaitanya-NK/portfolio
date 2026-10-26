"use client";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Mic, Square, Trash2, Upload } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { uploadFiles } from "@/lib/upload-store";

const MAX_SECONDS = 10;
const PICK = ["audio/webm;codecs=opus", "audio/mp4", "audio/webm", "audio/ogg;codecs=opus"];
const extOf = (m: string) => (/mp4|aac|m4a/.test(m) ? "m4a" : /ogg/.test(m) ? "ogg" : /mpeg|mp3/.test(m) ? "mp3" : /wav/.test(m) ? "wav" : "webm");

export function PronunciationEditor({ defaultPhonetic, defaultUrl }: { defaultPhonetic?: string | null; defaultUrl?: string | null }) {
  const [phonetic, setPhonetic] = useState(defaultPhonetic ?? "");
  const [url, setUrl] = useState(defaultUrl ?? "");
  const [rec, setRec] = useState(false);
  const [secs, setSecs] = useState(0);
  const [take, setTake] = useState<{ blob: Blob; preview: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const recorder = useRef<MediaRecorder | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function stopRec() {
    if (timer.current) { clearInterval(timer.current); timer.current = null; }
    if (recorder.current && recorder.current.state !== "inactive") recorder.current.stop();
    setRec(false);
  }
  useEffect(() => { if (rec && secs >= MAX_SECONDS) stopRec(); }, [secs, rec]);
  useEffect(() => () => {
    if (timer.current) clearInterval(timer.current);
    stream.current?.getTracks().forEach((t) => t.stop());
  }, []);

  async function start() {
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      toast.error("Recording isn’t supported in this browser. Use Upload instead.");
      return;
    }
    try {
      const s = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.current = s;
      const type = PICK.find((t) => MediaRecorder.isTypeSupported(t));
      const r = new MediaRecorder(s, type ? { mimeType: type } : undefined);
      const chunks: Blob[] = [];
      r.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data); };
      r.onstop = () => {
        s.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunks, { type: r.mimeType || type || "audio/webm" });
        setTake({ blob, preview: URL.createObjectURL(blob) });
      };
      recorder.current = r;
      r.start();
      setTake(null); setSecs(0); setRec(true);
      timer.current = setInterval(() => setSecs((n) => n + 1), 1000);
    } catch {
      toast.error("Couldn’t use the microphone. Allow access in the browser, or use Upload.");
    }
  }

  async function upload(blob: Blob) {
    const mime = (blob.type || "audio/webm").split(";")[0];
    const file = blob instanceof File ? blob : new File([blob], `name.${extOf(mime)}`, { type: mime });
    setBusy(true);
    const r = await uploadFiles(file, { folder: "pronunciation", accept: ["audio/*"], maxMB: 1 });
    setBusy(false);
    if (r[0]) { setUrl(r[0].url); setTake(null); toast.success("Uploaded. Click Save profile to apply."); }
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border p-4 text-sm font-medium sm:col-span-2">
      <div>How to pronounce your name</div>
      <label className="flex flex-col gap-1 font-normal">
        <span className="text-neutral-600">Phonetic spelling. Use capitals for the stressed syllable, for example “shi-VAWN” for Siobhan.</span>
        <Input name="name_phonetic" value={phonetic} maxLength={120} onChange={(e) => setPhonetic(e.target.value)} placeholder="Type it the way it sounds" aria-label="Phonetic spelling" />
      </label>

      <input type="hidden" name="name_audio_url" value={url} />
      <input ref={fileRef} type="file" className="hidden" accept="audio/mpeg,audio/mp4,audio/x-m4a,audio/webm,audio/ogg,audio/wav,.mp3,.m4a,.wav,.ogg,.webm"
        onChange={(e) => {
          const f = e.target.files?.[0];
          e.target.value = "";
          if (!f) return;
          if (!f.type.startsWith("audio/")) { toast.error("Please choose an audio file."); return; }
          upload(f);
        }} />

      {url && !take && !rec && (
        <div className="flex flex-wrap items-center gap-3 rounded-lg bg-neutral-50 p-3">
          <audio controls preload="none" src={url} className="h-10 max-w-full" />
          <Button type="button" variant="ghost" size="sm" onClick={() => setUrl("")}><Trash2 className="mr-1.5 h-4 w-4" />Remove recording</Button>
        </div>
      )}

      {take && (
        <div className="flex flex-wrap items-center gap-3 rounded-lg bg-neutral-50 p-3">
          <audio controls src={take.preview} className="h-10 max-w-full" />
          <Button type="button" size="sm" disabled={busy} onClick={() => upload(take.blob)}>{busy ? "Uploading…" : "Use this recording"}</Button>
          <Button type="button" variant="ghost" size="sm" disabled={busy} onClick={() => setTake(null)}>Discard</Button>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        {rec ? (
          <Button type="button" variant="destructive" size="sm" onClick={stopRec}><Square className="mr-1.5 h-4 w-4 fill-current" />Stop ({MAX_SECONDS - secs}s left)</Button>
        ) : (
          <Button type="button" variant="outline" size="sm" disabled={busy} onClick={start}><Mic className="mr-1.5 h-4 w-4" />{url || take ? "Record again" : "Record"}</Button>
        )}
        <Button type="button" variant="outline" size="sm" disabled={busy || rec} onClick={() => fileRef.current?.click()}><Upload className="mr-1.5 h-4 w-4" />Upload a file</Button>
      </div>
      <p className="text-xs font-normal text-neutral-500">
        Say your full name slowly, once, in a quiet room. Up to 10 seconds. Chrome and Firefox record WebM, which very old iPhones can’t play. For the widest support, upload an MP3 or M4A (for example from your phone’s voice recorder). If the sound can’t play for a visitor, they still see the phonetic spelling.
      </p>
    </div>
  );
}
