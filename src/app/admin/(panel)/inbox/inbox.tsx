"use client";
import { useMemo, useState } from "react";
import { format, isThisYear, isToday } from "date-fns";
import { toast } from "sonner";
import {
  ArrowLeft, ChevronDown, ChevronUp, Copy, Inbox as InboxIcon, Mail, MailOpen, Paperclip, Search, Send, Star, Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { LABELS, LABEL_STYLE } from "@/lib/labels";
import { markReadMany, setStarred, deleteMany, sendReply, setLabels, saveTemplate, deleteTemplate } from "./actions";

type Att = { name: string; path: string; size: number; url: string | null };
type Reply = { id: string; subject: string | null; body: string; created_at: string };
type M = {
  id: string; name: string | null; email: string | null; body: string | null;
  is_read: boolean; is_starred: boolean; created_at: string; replied_at?: string | null;
  topic?: string | null; labels?: string[]; attachments?: Att[]; message_replies?: Reply[];
};
type Tpl = { id: string; title: string; subject: string | null; body: string };
type Tab = "all" | "unread" | "starred" | "spam";

const stamp = (s: string) => {
  const d = new Date(s);
  return isToday(d) ? format(d, "h:mm a") : isThisYear(d) ? format(d, "d MMM") : format(d, "d MMM yyyy");
};
const bytes = (n: number) => (n < 1024 ? `${n} B` : n < 1048576 ? `${(n / 1024).toFixed(0)} KB` : `${(n / 1048576).toFixed(1)} MB`);
const AVATARS = ["bg-indigo-100 text-indigo-700", "bg-emerald-100 text-emerald-700", "bg-amber-100 text-amber-700",
  "bg-rose-100 text-rose-700", "bg-sky-100 text-sky-700", "bg-violet-100 text-violet-700"];
const tone = (s: string) => AVATARS[[...s].reduce((a, c) => a + c.charCodeAt(0), 0) % AVATARS.length];
const isSpam = (m: M) => (m.labels ?? []).includes("Spam");

function Avatar({ m, size = "h-10 w-10" }: { m: M; size?: string }) {
  return (
    <span className={`flex ${size} shrink-0 items-center justify-center rounded-full text-sm font-semibold ${tone(m.email || m.name || "?")}`}>
      {(m.name || m.email || "?").trim().slice(0, 1).toUpperCase()}
    </span>
  );
}
function Chip({ l }: { l: string }) {
  return <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${LABEL_STYLE[l] ?? "bg-neutral-100 text-neutral-700"}`}>{l}</span>;
}

function TemplatesDialog({ open, onClose, templates, setTemplates }: {
  open: boolean; onClose: () => void; templates: Tpl[]; setTemplates: (f: (l: Tpl[]) => Tpl[]) => void;
}) {
  const [editing, setEditing] = useState<Tpl | null>(null);
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("Re: your message");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);

  const load = (t: Tpl | null) => {
    setEditing(t); setTitle(t?.title ?? ""); setSubject(t?.subject ?? "Re: your message"); setBody(t?.body ?? "");
  };
  async function save() {
    setBusy(true);
    const r = await saveTemplate(editing?.id ?? null, { title, subject, body });
    setBusy(false);
    if (!r.ok) { toast.error(r.error); return; }
    setTemplates((l) => (editing ? l.map((x) => (x.id === r.row.id ? r.row : x)) : [...l, r.row]));
    toast.success("Template saved");
    load(null);
  }
  async function remove(t: Tpl) {
    const r = await deleteTemplate(t.id);
    if (!r.ok) { toast.error(r.error ?? "Failed"); return; }
    setTemplates((l) => l.filter((x) => x.id !== t.id));
    if (editing?.id === t.id) load(null);
    toast.success("Deleted");
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && !busy && onClose()}>
      <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader><DialogTitle>Reply templates</DialogTitle></DialogHeader>
        <div className="flex flex-col gap-2">
          {templates.length === 0 && <p className="text-sm text-neutral-500">No templates yet.</p>}
          {templates.map((t) => (
            <div key={t.id} className="flex items-center gap-2 rounded-lg border p-2">
              <span className="min-w-0 flex-1 truncate text-sm font-medium">{t.title}</span>
              <Button variant="outline" size="sm" onClick={() => load(t)}>Edit</Button>
              <Button variant="ghost" size="sm" onClick={() => remove(t)}>Delete</Button>
            </div>
          ))}
        </div>
        <div className="flex flex-col gap-2 rounded-xl border bg-neutral-50 p-3">
          <h3 className="text-sm font-semibold">{editing ? "Edit template" : "New template"}</h3>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Template name (only you see it)" aria-label="Template name" />
          <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Email subject" aria-label="Subject" />
          <Textarea rows={6} value={body} onChange={(e) => setBody(e.target.value)} placeholder="Message" aria-label="Message" />
          <p className="text-xs text-neutral-500">Use <code>{"{{name}}"}</code> for the sender’s first name and <code>{"{{my_name}}"}</code> for your name.</p>
          <div className="flex gap-2">
            <Button onClick={save} disabled={busy || !title.trim() || !body.trim()}>{busy ? "Saving…" : "Save template"}</Button>
            {editing && <Button variant="ghost" onClick={() => load(null)}>Cancel edit</Button>}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ReplyThread({ m, templates, myName, onSent, onManage }: {
  m: M; templates: Tpl[]; myName: string; onSent: (id: string, r: Reply) => void; onManage: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [subject, setSubject] = useState("Re: your message");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const replies = [...(m.message_replies ?? [])].sort((a, b) => a.created_at.localeCompare(b.created_at));

  function apply(id: string) {
    const t = templates.find((x) => x.id === id);
    if (!t) return;
    const first = (m.name ?? "").trim().split(/\s+/)[0] || "there";
    const text = t.body.split("{{name}}").join(first).split("{{my_name}}").join(myName);
    setBody((b) => (b.trim() ? `${b}\n\n${text}` : text));
    if (t.subject) setSubject(t.subject);
  }
  async function send() {
    setBusy(true);
    const r = await sendReply(m.id, subject, body);
    setBusy(false);
    if (!r.ok) { toast.error(r.error); return; }
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
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-neutral-500">To: {m.email}</span>
            <div className="ml-auto flex items-center gap-2">
              <Select value="" onValueChange={(v) => v && apply(String(v))}>
                <SelectTrigger className="h-8 w-48" aria-label="Insert a template"><SelectValue placeholder="Insert a template…" /></SelectTrigger>
                <SelectContent>{templates.map((t) => <SelectItem key={t.id} value={t.id}>{t.title}</SelectItem>)}</SelectContent>
              </Select>
              <Button type="button" variant="ghost" size="sm" onClick={onManage}>Manage</Button>
            </div>
          </div>
          <Input value={subject} onChange={(e) => setSubject(e.target.value)} aria-label="Subject" />
          <Textarea rows={7} autoFocus value={body} onChange={(e) => setBody(e.target.value)} placeholder="Write your reply…" aria-label="Reply" />
          <div className="flex flex-wrap gap-2">
            <Button onClick={send} disabled={busy || !body.trim()}>{busy ? "Sending…" : "Send reply"}</Button>
            <Button variant="ghost" onClick={() => setOpen(false)} disabled={busy}>Cancel</Button>
          </div>
        </div>
      )}
    </div>
  );
}

export function Inbox({ initial: initialList, templates: initialTpls, myName }: { initial: M[]; templates: Tpl[]; myName: string }) {
  const [list, setList] = useState(initialList);
  const [templates, setTemplates] = useState(initialTpls);
  const [tab, setTab] = useState<Tab>("all");
  const [labelFilter, setLabelFilter] = useState("all");
  const [q, setQ] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [confirm, setConfirm] = useState<string[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [manage, setManage] = useState(false);

  const inbox = list.filter((m) => !isSpam(m));
  const unread = inbox.filter((m) => !m.is_read).length;
  const starred = inbox.filter((m) => m.is_starred).length;
  const spam = list.length - inbox.length;

  const shown = useMemo(
    () =>
      list.filter((m) => {
        if (tab === "spam" ? !isSpam(m) : isSpam(m)) return false;
        if (tab === "unread" && m.is_read) return false;
        if (tab === "starred" && !m.is_starred) return false;
        if (labelFilter !== "all" && !(m.labels ?? []).includes(labelFilter)) return false;
        return !q || `${m.name ?? ""} ${m.email ?? ""} ${m.body ?? ""} ${m.topic ?? ""}`.toLowerCase().includes(q.toLowerCase());
      }),
    [list, tab, q, labelFilter]
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
  async function toggleLabel(m: M, l: string) {
    const has = (m.labels ?? []).includes(l);
    const next = has ? (m.labels ?? []).filter((x) => x !== l) : [...(m.labels ?? []), l];
    setList((all) => all.map((x) => (x.id === m.id ? { ...x, labels: next, is_read: next.includes("Spam") ? true : x.is_read } : x)));
    if (l === "Spam" && !has && tab !== "spam") setOpenId(null);
    const r = await setLabels(m.id, next);
    if (!r.ok) toast.error(r.error ?? "Failed");
  }
  async function remove(toDelete: string[]) {
    setBusy(true);
    const r = await deleteMany(toDelete);
    setBusy(false);
    setConfirm(null);
    if (!r.ok) { toast.error(r.error ?? "Failed"); return; }
    const gone = new Set(toDelete);
    setList((l) => l.filter((m) => !gone.has(m.id)));
    setSel(new Set());
    if (openId && gone.has(openId)) setOpenId(null);
    toast.success(`Deleted ${toDelete.length} message${toDelete.length === 1 ? "" : "s"}`);
  }
  const step = (d: number) => { const n = shown[idx + d]; if (n) open(n); };
  const toggle = (id: string) => setSel((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const allOn = shown.length > 0 && shown.every((m) => sel.has(m.id));

  const tabBtn = (t: Tab, label: string, n?: number) => (
    <button onClick={() => setTab(t)} aria-pressed={tab === t}
      className={`rounded-full px-3 py-1.5 text-sm transition-colors ${tab === t ? "bg-neutral-900 text-white" : "text-neutral-600 hover:bg-neutral-100"}`}>
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
      <div className={`${openId ? "hidden lg:flex" : "flex"} min-h-0 flex-col border-r`}>
        <div className="flex flex-col gap-2 border-b p-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <Input className="pl-9" placeholder="Search messages…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search messages" />
          </div>
          <div className="flex flex-wrap gap-1">
            {tabBtn("all", "All", inbox.length)}
            {tabBtn("unread", "Unread", unread)}
            {tabBtn("starred", "Starred", starred)}
            {tabBtn("spam", "Spam", spam)}
          </div>
          <div className="flex items-center gap-2">
            <Select value={labelFilter} onValueChange={(v) => v != null && setLabelFilter(String(v))}>
              <SelectTrigger className="h-8 flex-1" aria-label="Filter by label"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All labels</SelectItem>
                {LABELS.filter((l) => l !== "Spam").map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button variant="ghost" size="sm" onClick={() => setManage(true)}>Templates</Button>
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
              {unread > 0 && tab !== "spam" && (
                <Button variant="ghost" size="sm" className="ml-auto" onClick={() => mark(inbox.filter((m) => !m.is_read).map((m) => m.id), true)}>Mark all read</Button>
              )}
            </>
          )}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {shown.length === 0 && <p className="p-8 text-center text-sm text-neutral-500">No messages match.</p>}
          {shown.map((m) => (
            <div key={m.id} className={`flex items-start gap-2.5 border-b px-3 py-3 transition-colors ${m.id === openId ? "bg-indigo-50" : "hover:bg-neutral-50"}`}>
              <input type="checkbox" className="mt-3 h-4 w-4 shrink-0" checked={sel.has(m.id)} onChange={() => toggle(m.id)} aria-label={`Select message from ${m.name ?? m.email}`} />
              <button onClick={() => open(m)} className="flex min-w-0 flex-1 gap-3 text-left" aria-label={`Open message from ${m.name ?? m.email}`}>
                <Avatar m={m} />
                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-2">
                    <span className={`truncate text-sm ${m.is_read ? "text-neutral-700" : "font-semibold"}`}>{m.name || "Anonymous"}</span>
                    <span suppressHydrationWarning className={`shrink-0 text-xs ${m.is_read ? "text-neutral-400" : "font-medium text-indigo-600"}`}>{stamp(m.created_at)}</span>
                  </span>
                  <span className="block truncate text-xs text-neutral-500">{m.email}</span>
                  {((m.labels ?? []).length > 0 || (m.attachments ?? []).length > 0) && (
                    <span className="mt-1 flex flex-wrap items-center gap-1">
                      {(m.labels ?? []).map((l) => <Chip key={l} l={l} />)}
                      {(m.attachments ?? []).length > 0 && <Paperclip className="h-3.5 w-3.5 text-neutral-400" aria-label="Has attachment" />}
                    </span>
                  )}
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

              <div className="mt-4 flex flex-wrap items-center gap-1.5">
                {LABELS.map((l) => {
                  const on = (current.labels ?? []).includes(l);
                  return (
                    <button key={l} aria-pressed={on} onClick={() => toggleLabel(current, l)}
                      className={`rounded-full border px-3 py-1 text-xs transition-colors ${on ? `${LABEL_STYLE[l]} border-transparent font-medium` : "text-neutral-500 hover:bg-neutral-50"}`}>
                      {l}
                    </button>
                  );
                })}
                {current.topic && <span className="ml-1 text-xs text-neutral-500">Topic: {current.topic}</span>}
              </div>

              <div className="mt-5 whitespace-pre-wrap break-words rounded-xl bg-neutral-50 p-4 text-[0.95rem] leading-relaxed sm:p-5">{current.body}</div>

              {(current.attachments ?? []).length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {(current.attachments ?? []).map((a) =>
                    a.url ? (
                      <a key={a.path} href={a.url} target="_blank" rel="noreferrer" download={a.name}
                        className="inline-flex min-h-10 items-center gap-2 rounded-lg border px-3 text-sm hover:bg-neutral-50">
                        <Paperclip className="h-4 w-4" />{a.name}<span className="text-xs text-neutral-500">{bytes(a.size)}</span>
                      </a>
                    ) : (
                      <span key={a.path} className="inline-flex min-h-10 items-center gap-2 rounded-lg border px-3 text-sm text-neutral-400">{a.name} (link expired, refresh)</span>
                    )
                  )}
                </div>
              )}

              <ReplyThread
                key={current.id} m={current} templates={templates} myName={myName} onManage={() => setManage(true)}
                onSent={(id, r) => setList((l) => l.map((x) => (x.id === id ? { ...x, is_read: true, replied_at: r.created_at, message_replies: [...(x.message_replies ?? []), r] } : x)))}
              />
              <div className="mt-6 flex flex-wrap gap-2">
                {current.email && (
                  <a href={replyHref(current)} className="inline-flex h-10 items-center gap-2 rounded-md border px-4 text-sm font-medium hover:bg-neutral-50">
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

      <TemplatesDialog open={manage} onClose={() => setManage(false)} templates={templates} setTemplates={setTemplates} />

      <Dialog open={!!confirm} onOpenChange={(o) => !o && !busy && setConfirm(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Delete {confirm?.length === 1 ? "this message" : `${confirm?.length} messages`}?</DialogTitle></DialogHeader>
          <p className="text-sm text-neutral-600">Any attached files are deleted too. This can’t be undone.</p>
          <DialogFooter>
            <Button variant="outline" disabled={busy} onClick={() => setConfirm(null)}>Cancel</Button>
            <Button variant="destructive" disabled={busy} onClick={() => confirm && remove(confirm)}>{busy ? "Deleting…" : "Delete"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
