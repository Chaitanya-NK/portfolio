import { createClient } from "@/lib/supabase/client";

export type Status = "queued" | "uploading" | "processing" | "done" | "error" | "canceled";
export type Item = {
  id: string; name: string; size: number; type: string; preview: string;
  bucket: string; path: string; status: Status; loaded: number; speed: number;
  error?: string; url?: string; canRetry: boolean;
};
export type Uploaded = { url: string; path: string; name: string; size: number; type: string; index: number };
export type Opts = {
  folder: string; bucket?: string; maxMB?: number; accept?: string[]; upsert?: boolean;
  onEach?: (u: Uploaded) => void; // called for every successful file, including after a retry
};
export type Snapshot = { items: Item[]; open: boolean; minimized: boolean };

type Job = {
  item: Item; file: File; opts: Opts; index: number; xhr?: XMLHttpRequest;
  samples: { t: number; l: number }[]; lastEmit: number; counted: boolean;
  settle: () => void; sink: Uploaded[];
};

const MAX_PARALLEL = 3;
const EMPTY: Snapshot = { items: [], open: false, minimized: false };
let jobs: Job[] = [];
let view = { open: false, minimized: false };
let snap: Snapshot = EMPTY;
let seq = 0;
const subs = new Set<() => void>();

const isEnd = (s: Status) => s === "done" || s === "error" || s === "canceled";
const isActive = (s: Status) => s === "queued" || s === "uploading" || s === "processing";

function emit() {
  snap = { items: jobs.map((j) => ({ ...j.item })), ...view };
  subs.forEach((f) => f());
}
export const subscribe = (f: () => void) => { subs.add(f); return () => { subs.delete(f); }; };
export const getSnapshot = () => snap;
export const getServerSnapshot = () => EMPTY;

const matches = (f: File, accept?: string[]) =>
  !accept?.length ||
  accept.some((a) => (a.endsWith("/*") ? f.type.startsWith(a.slice(0, -1)) : a.startsWith(".") ? f.name.toLowerCase().endsWith(a.toLowerCase()) : f.type === a));

function problem(f: File, o: Opts): string | null {
  const mb = o.maxMB ?? 50;
  if (f.size === 0) return "The file is empty.";
  if (f.size > mb * 1024 * 1024) return `Too large (limit ${mb} MB).`;
  if (!matches(f, o.accept)) return "This file type isn’t allowed here.";
  return null;
}

function finish(job: Job) {
  if (!job.counted) { job.counted = true; job.settle(); }
}
function fail(job: Job, msg: string) {
  job.item.status = "error";
  job.item.error = msg;
  job.item.speed = 0;
  job.item.canRetry = Boolean(job.opts.onEach);
  emit(); finish(job); pump();
}

function pump() {
  let active = jobs.filter((j) => j.item.status === "uploading" || j.item.status === "processing").length;
  for (const j of jobs) {
    if (active >= MAX_PARALLEL) break;
    if (j.item.status === "queued") { active++; void start(j); }
  }
}

async function start(job: Job) {
  const { item, file, opts } = job;
  item.status = "uploading"; item.loaded = 0; item.speed = 0; item.error = undefined;
  job.samples = []; job.lastEmit = 0;
  emit();

  const sb = createClient();
  const { data } = await sb.auth.getSession();
  const token = data.session?.access_token;
  if (!token) return fail(job, "Your session expired. Please sign in again.");
  if (item.status !== "uploading") return; // canceled while waiting for the token

  const xhr = new XMLHttpRequest();
  job.xhr = xhr;
  const path = item.path.split("/").map(encodeURIComponent).join("/");
  xhr.open("POST", `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/${item.bucket}/${path}`);
  xhr.setRequestHeader("authorization", `Bearer ${token}`);
  xhr.setRequestHeader("apikey", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
  xhr.setRequestHeader("x-upsert", String(Boolean(opts.upsert)));
  xhr.timeout = 15 * 60 * 1000;

  xhr.upload.onprogress = (e) => {
    if (!e.lengthComputable) return;
    const now = performance.now();
    job.samples.push({ t: now, l: e.loaded });
    while (job.samples.length > 2 && now - job.samples[0].t > 2500) job.samples.shift();
    const a = job.samples[0], b = job.samples[job.samples.length - 1];
    if (b.t > a.t) item.speed = ((b.l - a.l) / (b.t - a.t)) * 1000;
    item.loaded = Math.min(e.loaded, item.size);
    if (now - job.lastEmit > 100) { job.lastEmit = now; emit(); }
  };
  xhr.upload.onload = () => { item.loaded = item.size; item.speed = 0; item.status = "processing"; emit(); };
  xhr.onload = () => {
    if (xhr.status >= 200 && xhr.status < 300) {
      item.status = "done"; item.loaded = item.size; item.speed = 0;
      item.url = sb.storage.from(item.bucket).getPublicUrl(item.path).data.publicUrl;
      const u: Uploaded = { url: item.url, path: item.path, name: file.name, size: file.size, type: file.type, index: job.index };
      job.sink.push(u);
      opts.onEach?.(u);
      emit(); finish(job); pump();
      return;
    }
    let msg = "The upload failed.";
    try { const j = JSON.parse(xhr.responseText); msg = j.message || j.error || msg; } catch {}
    if (xhr.status === 413) msg = "The file is larger than the server allows.";
    else if (xhr.status === 401 || xhr.status === 403 || /row-level security/i.test(msg)) msg = "Permission denied. Please sign in again.";
    fail(job, msg);
  };
  xhr.onerror = () => fail(job, "Network error. Check your connection and retry.");
  xhr.ontimeout = () => fail(job, "The upload timed out. Please retry.");
  xhr.onabort = () => {
    if (item.status === "canceled") return;
    item.status = "canceled"; item.speed = 0; emit(); finish(job); pump();
  };

  const fd = new FormData();
  fd.append("cacheControl", "3600");
  fd.append("", file);
  xhr.send(fd);
}

export function uploadFiles(files: File | File[], opts: Opts): Promise<Uploaded[]> {
  const list = Array.isArray(files) ? files : [files];
  const sink: Uploaded[] = [];
  return new Promise((resolve) => {
    if (!list.length) { resolve([]); return; }
    let pending = list.length;
    const settle = () => { if (--pending === 0) resolve([...sink].sort((a, b) => a.index - b.index)); };

    list.forEach((file, index) => {
      const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-90) || "file";
      const stamp = Date.now() * 100 + (seq++ % 100);
      const item: Item = {
        id: `${stamp}-${index}`, name: file.name, size: file.size, type: file.type,
        preview: URL.createObjectURL(file), bucket: opts.bucket ?? "media",
        path: `${opts.folder}/${stamp}-${safe}`, status: "queued", loaded: 0, speed: 0, canRetry: false,
      };
      const job: Job = { item, file, opts, index, samples: [], lastEmit: 0, counted: false, settle, sink };
      const bad = problem(file, opts);
      jobs.push(job);
      if (bad) { item.status = "error"; item.error = bad; finish(job); }
    });
    view = { open: true, minimized: false };
    emit();
    pump();
  });
}

export function setMinimized(v: boolean) { view = { ...view, minimized: v }; emit(); }

export function dismiss() {
  jobs.filter((j) => isEnd(j.item.status)).forEach((j) => URL.revokeObjectURL(j.item.preview));
  jobs = jobs.filter((j) => !isEnd(j.item.status));
  view = { open: jobs.length > 0, minimized: view.minimized && jobs.length > 0 };
  emit();
}

export function cancel(id: string) {
  const j = jobs.find((x) => x.item.id === id);
  if (!j || !isActive(j.item.status)) return;
  const wasQueued = j.item.status === "queued";
  j.item.status = "canceled"; j.item.speed = 0;
  j.xhr?.abort();
  if (wasQueued || !j.xhr) { emit(); finish(j); pump(); }
}
export function cancelAll() { jobs.forEach((j) => cancel(j.item.id)); }

export function retry(id: string) {
  const j = jobs.find((x) => x.item.id === id);
  if (!j || j.item.status !== "error" || !j.item.canRetry) return;
  j.item.status = "queued"; j.item.error = undefined; j.item.loaded = 0;
  view = { open: true, minimized: false };
  emit(); pump();
}
export function retryFailed() { jobs.filter((j) => j.item.status === "error" && j.item.canRetry).forEach((j) => retry(j.item.id)); }
