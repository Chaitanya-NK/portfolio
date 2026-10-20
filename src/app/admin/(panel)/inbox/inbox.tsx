"use client";
import { useState } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { setRead, deleteMessage } from "./actions";

type M = { id: string; name: string | null; email: string | null; body: string | null; is_read: boolean; created_at: string };

export function Inbox({ initial }: { initial: M[] }) {
  const [list, setList] = useState(initial);
  const [open, setOpen] = useState<string | null>(null);
  const mark = async (m: M, v: boolean) => {
    setList((l) => l.map((x) => (x.id === m.id ? { ...x, is_read: v } : x)));
    await setRead(m.id, v);
  };
  if (!list.length) return <p className="rounded-xl border border-dashed p-8 text-center text-sm text-neutral-500">No messages yet. Messages from the public contact form will appear here.</p>;
  return (
    <div className="flex max-w-4xl flex-col gap-2">
      {list.map((m) => (
        <div key={m.id} className="rounded-xl border bg-white">
          <button className="flex w-full items-center gap-3 p-4 text-left" onClick={() => { setOpen(open === m.id ? null : m.id); if (!m.is_read) mark(m, true); }}>
            <span className={`h-2 w-2 shrink-0 rounded-full ${m.is_read ? "bg-transparent" : "bg-indigo-600"}`} />
            <div className="min-w-0 flex-1">
              <div className={`truncate ${m.is_read ? "" : "font-semibold"}`}>{m.name || "Anonymous"} <span className="font-normal text-neutral-500">· {m.email}</span></div>
              <div className="truncate text-sm text-neutral-500">{m.body}</div>
            </div>
            {!m.is_read && <Badge>New</Badge>}
            <span className="text-xs text-neutral-500">{format(new Date(m.created_at), "dd MMM, HH:mm")}</span>
          </button>
          {open === m.id && (
            <div className="border-t p-4">
              <p className="whitespace-pre-wrap text-sm">{m.body}</p>
              <div className="mt-4 flex gap-2">
                {m.email && <a href={`mailto:${m.email}`} className="rounded-md bg-neutral-900 px-3 py-1.5 text-sm text-white">Reply by email</a>}
                <Button variant="outline" size="sm" onClick={() => mark(m, false)}>Mark unread</Button>
                <Button variant="ghost" size="sm" onClick={async () => { const r = await deleteMessage(m.id); if (!r.ok) return toast.error(r.error ?? "Failed"); setList((l) => l.filter((x) => x.id !== m.id)); toast.success("Deleted"); }}>Delete</Button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
