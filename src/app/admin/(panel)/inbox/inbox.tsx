"use client";
import { useMemo, useState } from "react";
import { format, isThisYear, isToday } from "date-fns";
import { toast } from "sonner";
import {
  ArrowLeft, ChevronDown, ChevronUp, Copy, Inbox as InboxIcon, Mail, MailOpen, Search, Send, Star, Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { markReadMany, setStarred, deleteMany, sendReply } from "./actions";

type M = {
  id: string; name: string | null; email: string | null; body: string | null;
  is_read: boolean; is_starred: boolean; created_at: string;
  replied_at?: string | null;
  message_replies?: { id: string; subject: string | null; body: string; created_at: string }[];
};
type Tab = "all" | "unread" | "starred";

const stamp = (s: string) => {
  const d = new Date(s);
  return isToday(d) ? format(d, "h:mm a") : isThisYear(d) ? format(d, "d MMM") : format(d, "d MMM yyyy");
};
const AVATARS = ["bg-indigo-100 text-indigo-700", "bg-emerald-100 text-emerald-700", "bg-amber-100 text-amber-700",
  "bg-rose-100 text-rose-700", "bg-sky-100 text-sky-700", "bg-violet-100 text-violet-700"];
const tone = (s: string) => AVATARS[[...s].reduce((a, c) => a + c.charCodeAt(0), 0) % AVATARS.length];
const initial = (m: M) => (m.name || m.email || "?").trim().slice(0, 1).toUpperCase();

function Avatar({ m, size = "h-10 w-10" }: { m: M; size?: string }) {
  return (
    <span className={`flex ${size} shrink-0 items-center justify-center rounded-full text-sm font-semibold ${tone(m.email || m.name || "?")}`}>
      {initial(m)}
    </span>
  );
}

type Reply = { id: string; subject: string | null; body: string; created_at: string };

function ReplyThread({ m, onSent }: { m: M; onSent: (id: string, r: Reply) => void }) {
  const [open, setOpen] = useState(false);
  const [subject, setSubject] = useState("Re: your message");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const replies = [...(m.message_replies ?? [])].sort((a, b) => a.created_at.localeCompare(b.created_at));

  async function send() {
    setBusy(true);
    const r = await sendReply(m.id, subject, body);
    setBusy(false);
    if (!r.ok) return toast.error(r.error);
    onSent(m.id, r.reply);
    setBody("");
    setOpen(false);
    toast.success("Reply sent");
  }

  return (
    <div className="mt-6 flex flex-col gap-3">
      {replies.map((r) => (
        <div key={r.id} className="ml-auto w-full max-w-[92%] rounded-xl bg-indigo-50 p-4 text-sm">
          <div suppressHydrationWarning className="mb-1 text-xs text-neutral-500">You replied · {format(new Date(r.created_at), "d MMM yyyy, h:mm a")}</div>
          <p className="whitespace-pre-wrap break-words">{r.body}</p>
        </div>
      ))}
      {m.email && !open && (
        <Button className="w-fit" onClick={() => setOpen(true)}><Send className="mr-2 h-4 w-4" />{replies.length ? "Reply again" : "Reply"}</Button>
      )}
      {open && (
        <div className="flex flex-col gap-2 rounded-xl border p-3">
          <div className="text-xs text-neutral-500">To: {m.email}</div>
          <Input value={subject} onChange={(e) => setSubject(e.target.value)} aria-label="Subject" />
          <Textarea rows={6} autoFocus value={body} onChange={(e) => setBody(e.target.value)} placeholder="Write your reply…" aria-label="Reply" />
          <div className="flex flex-wrap gap-2">
            <Button onClick={send} disabled={busy || !body.trim()}>{busy ? "Sending…" : "Send reply"}</Button>
            <Button variant="ghost" onClick={() => setOpen(false)} disabled={busy}>Cancel</Button>
          </div>
        </div>
      )}
    </div>
  );
}

export function Inbox({ initial: initialList }: { initial: M[] }) {
  const [list, setList] = useState(initialList);
  const [tab, setTab] = useState<Tab>("all");
  const [q, setQ] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [confirm, setConfirm] = useState<string[] | null>(null);
  const [busy, setBusy] = useState(false);

  const unread = list.filter((m) => !m.is_read).length;
  const starred = list.filter((m) => m.is_starred).length;

  const shown = useMemo(
    () =>
      list.filter(
        (m) =>
          (tab === "all" || (tab === "unread" ? !m.is_read : m.is_starred)) &&
          (!q || `${m.name ?? ""} ${m.email ?? ""} ${m.body ?? ""}`.toLowerCase().includes(q.toLowerCase()))
      ),
    [list, tab, q]
  );
  const current = list.find((m) => m.id === openId) ?? null;
  const idx = shown.findIndex((m) => m.id === openId);

  async function mark(idsToMark: string[], read: boolean) {
    setList((l) => l.map((m) => (idsToMark.includes(m.id) ? { ...m, is_read: read } : m)));
    const r = await markReadMany(idsToMark, read);
    if (!r.ok) toast.error(r.error ?? "Failed");
  }
  function open(m: M) {
    setOpenId(m.id);
    if (!m.is_read) mark([m.id], true);
  }
  async function star(m: M) {
    setList((l) => l.map((x) => (x.id === m.id ? { ...x, is_starred: !m.is_starred } : x)));
    const r = await setStarred(m.id, !m.is_starred);
    if (!r.ok) toast.error(r.error ?? "Failed");
  }
  async function remove(idsToDelete: string[]) {
    setBusy(true);
    const r = await deleteMany(idsToDelete);
    setBusy(false);
    setConfirm(null);
    if (!r.ok) return toast.error(r.error ?? "Failed");
    const gone = new Set(idsToDelete);
    const next = shown.find((m, i) => i > idx && !gone.has(m.id)) ?? shown.find((m) => !gone.has(m.id));
    setList((l) => l.filter((m) => !gone.has(m.id)));
    setSel(new Set());
    if (openId && gone.has(openId)) setOpenId(null);
    void next;
    toast.success(`Deleted ${idsToDelete.length} message${idsToDelete.length === 1 ? "" : "s"}`);
  }
  const step = (d: number) => {
    const n = shown[idx + d];
    if (n) open(n);
  };
  const toggle = (id: string) => setSel((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const allOn = shown.length > 0 && shown.every((m) => sel.has(m.id));

  const tabBtn = (t: Tab, label: string, n?: number) => (
    <button
      onClick={() => setTab(t)}
      aria-pressed={tab === t}
      className={`rounded-full px-3 py-1.5 text-sm transition-colors ${tab === t ? "bg-neutral-900 text-white" : "text-neutral-600 hover:bg-neutral-100"}`}
    >
      {label}{n ? <span className={`ml-1.5 text-xs ${tab === t ? "text-neutral-300" : "text-neutral-400"}`}>{n}</span> : null}
    </button>
  );

  if (!list.length)
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed bg-white p-12 text-center">
        <InboxIcon className="h-10 w-10 text-neutral-300" />
        <p className="font-medium">No messages yet</p>
        <p className="max-w-sm text-sm text-neutral-500">When someone uses the contact form on your site, their message appears here and you also get an email.</p>
      </div>
    );

  const replyHref = (m: M) => {
    const quoted = (m.body ?? "").slice(0, 1500).split("\n").map((l) => `> ${l}`).join("\n");
    return `mailto:${m.email}?subject=${encodeURIComponent("Re: your message")}&body=${encodeURIComponent(`\n\n\nOn ${format(new Date(m.created_at), "d MMM yyyy, h:mm a")}, ${m.name ?? "you"} wrote:\n${quoted}`)}`;
  };

  return (
    <div className="grid h-[calc(100dvh-11rem)] min-h-[28rem] overflow-hidden rounded-xl border bg-white lg:h-[calc(100dvh-9rem)] lg:grid-cols-[22rem_minmax(0,1fr)] xl:grid-cols-[26rem_minmax(0,1fr)]">
      {/* list pane */}
      <div className={`${openId ? "hidden lg:flex" : "flex"} min-h-0 flex-col border-r`}>
        <div className="flex flex-col gap-2 border-b p-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <Input className="pl-9" placeholder="Search messages…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search messages" />
          </div>
          <div className="flex flex-wrap gap-1">
            {tabBtn("all", "All", list.length)}
            {tabBtn("unread", "Unread", unread)}
            {tabBtn("starred", "Starred", starred)}
          </div>
        </div>

        <div className="flex min-h-11 flex-wrap items-center gap-2 border-b px-3 py-1.5 text-sm">
          <input type="checkbox" className="h-4 w-4" checked={allOn} aria-label="Select all shown"
            onChange={() => setSel(allOn ? new Set() : new Set(shown.map((m) => m.id)))} />
          {sel.size ? (
            <>
              <span className="text-neutral-600">{sel.size} selected</span>
              <Button variant="ghost" size="sm" onClick={() => { mark([...sel], true); setSel(new Set()); }}><MailOpen className="mr-1 h-4 w-4" />Read</Button>
              <Button variant="ghost" size="sm" onClick={() => { mark([...sel], false); setSel(new Set()); }}><Mail className="mr-1 h-4 w-4" />Unread</Button>
              <Button variant="ghost" size="sm" className="text-red-600" onClick={() => setConfirm([...sel])}><Trash2 className="mr-1 h-4 w-4" />Delete</Button>
            </>
          ) : (
            <>
              <span className="text-neutral-500">{shown.length} message{shown.length === 1 ? "" : "s"}</span>
              {unread > 0 && <Button variant="ghost" size="sm" className="ml-auto" onClick={() => mark(list.filter((m) => !m.is_read).map((m) => m.id), true)}>Mark all read</Button>}
            </>
          )}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {shown.length === 0 && <p className="p-8 text-center text-sm text-neutral-500">No messages match.</p>}
          {shown.map((m) => (
            <div
              key={m.id}
              className={`group flex items-start gap-2.5 border-b px-3 py-3 transition-colors ${m.id === openId ? "bg-indigo-50" : "hover:bg-neutral-50"}`}
            >
              <input type="checkbox" className="mt-3 h-4 w-4 shrink-0" checked={sel.has(m.id)} onChange={() => toggle(m.id)} aria-label={`Select message from ${m.name ?? m.email}`} />
              <button onClick={() => open(m)} className="flex min-w-0 flex-1 gap-3 text-left" aria-label={`Open message from ${m.name ?? m.email}`}>
                <Avatar m={m} />
                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-2">
                    <span className={`truncate text-sm ${m.is_read ? "text-neutral-700" : "font-semibold"}`}>{m.name || "Anonymous"}</span>
                    <span suppressHydrationWarning className={`shrink-0 text-xs ${m.is_read ? "text-neutral-400" : "font-medium text-indigo-600"}`}>{stamp(m.created_at)}</span>
                  </span>
                  <span className="block truncate text-xs text-neutral-500">{m.email}</span>
                  <span className={`mt-0.5 line-clamp-2 text-sm ${m.is_read ? "text-neutral-500" : "text-neutral-800"}`}>{m.body}</span>
                </span>
              </button>
              <div className="flex shrink-0 flex-col items-center gap-1.5 pt-1">
                {!m.is_read && <span className="h-2 w-2 rounded-full bg-indigo-600" aria-label="Unread" />}
                {m.is_starred && <Star className="h-4 w-4 fill-amber-400 text-amber-400" aria-label="Starred" />}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* reading pane */}
      <div className={`${openId ? "flex" : "hidden lg:flex"} min-h-0 min-w-0 flex-col`}>
        {!current ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 p-8 text-center text-neutral-400">
            <Mail className="h-10 w-10" />
            <p className="text-sm">Select a message to read it</p>
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-1 border-b p-2">
              <Button variant="ghost" size="sm" className="lg:hidden" onClick={() => setOpenId(null)}><ArrowLeft className="mr-1 h-4 w-4" />Inbox</Button>
              <div className="ml-auto flex flex-wrap items-center gap-1">
                <Button variant="ghost" size="icon" aria-label="Previous message" disabled={idx <= 0} onClick={() => step(-1)}><ChevronUp className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" aria-label="Next message" disabled={idx === -1 || idx >= shown.length - 1} onClick={() => step(1)}><ChevronDown className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" aria-label={current.is_starred ? "Remove star" : "Star message"} onClick={() => star(current)}>
                  <Star className={`h-4 w-4 ${current.is_starred ? "fill-amber-400 text-amber-400" : ""}`} />
                </Button>
                <Button variant="ghost" size="icon" aria-label="Mark as unread" onClick={() => { mark([current.id], false); setOpenId(null); }}><Mail className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" aria-label="Delete message" className="text-red-600" onClick={() => setConfirm([current.id])}><Trash2 className="h-4 w-4" /></Button>
              </div>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
              <div className="flex items-start gap-3">
                <Avatar m={current} size="h-12 w-12" />
                <div className="min-w-0 flex-1">
                  <h2 className="truncate text-lg font-semibold">{current.name || "Anonymous"}</h2>
                  <p className="truncate text-sm text-neutral-500">{current.email}</p>
                  <p suppressHydrationWarning className="text-xs text-neutral-400">{format(new Date(current.created_at), "EEEE, d MMMM yyyy 'at' h:mm a")}</p>
                </div>
              </div>
              <div className="mt-6 whitespace-pre-wrap break-words rounded-xl bg-neutral-50 p-4 text-[0.95rem] leading-relaxed sm:p-5">{current.body}</div>
              <ReplyThread key={current.id} m={current} onSent={(id, r) => setList((l) => l.map((x) => (x.id === id ? { ...x, is_read: true, replied_at: r.created_at, message_replies: [...(x.message_replies ?? []), r] } : x)))} />
              <div className="mt-6 flex flex-wrap gap-2">
                {current.email && (
                  <a href={replyHref(current)} className="inline-flex h-10 items-center gap-2 rounded-md bg-neutral-900 px-4 text-sm font-medium text-white hover:bg-neutral-800">
                    <Mail className="h-4 w-4" />Open in email app
                  </a>
                )}
                {current.email && (
                  <Button variant="outline" className="h-10" onClick={() => { navigator.clipboard.writeText(current.email!); toast.success("Email copied"); }}>
                    <Copy className="mr-2 h-4 w-4" />Copy email
                  </Button>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      <Dialog open={!!confirm} onOpenChange={(o) => !o && !busy && setConfirm(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Delete {confirm?.length === 1 ? "this message" : `${confirm?.length} messages`}?</DialogTitle></DialogHeader>
          <p className="text-sm text-neutral-600">This can’t be undone.</p>
          <DialogFooter>
            <Button variant="outline" disabled={busy} onClick={() => setConfirm(null)}>Cancel</Button>
            <Button variant="destructive" disabled={busy} onClick={() => confirm && remove(confirm)}>{busy ? "Deleting…" : "Delete"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
