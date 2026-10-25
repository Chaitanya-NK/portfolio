"use client";
import { useMemo, useState } from "react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type L = {
  id: number; actor: string | null; action: string; entity: string | null;
  entity_id: string | null; meta: { label?: string; changed?: string[]; email?: string; count?: number } | null;
  created_at: string;
};

const verb: Record<string, string> = {
  insert: "created", update: "updated", delete: "deleted", reorder: "reordered",
  login: "signed in", logout: "signed out", login_failed: "failed sign-in", backup: "backed up", restore: "restored",
};
const variant = (a: string) =>
  a === "delete" || a === "login_failed" ? "destructive" : a === "insert" ? "default" : "secondary";

export function AuditLog({ logs }: { logs: L[] }) {
  const [q, setQ] = useState("");
  const [entity, setEntity] = useState("all");
  const entities = useMemo(() => [...new Set(logs.map((l) => l.entity).filter(Boolean))].sort() as string[], [logs]);
  const list = logs.filter((l) =>
    (entity === "all" || l.entity === entity) &&
    (!q || `${l.meta?.label ?? ""} ${l.meta?.email ?? ""} ${l.action} ${l.entity ?? ""}`.toLowerCase().includes(q.toLowerCase()))
  );
  return (
    <div className="flex max-w-none flex-col gap-4">
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input placeholder="Search activity…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search" className="sm:max-w-xs" />
        <Select value={entity} onValueChange={(v) => v != null && setEntity(String(v))}>
          <SelectTrigger className="w-full sm:w-52" aria-label="Filter by area"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All areas</SelectItem>
            {entities.map((e) => <SelectItem key={e} value={e}>{e}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      {list.length === 0 && <p className="rounded-xl border border-dashed p-8 text-center text-sm text-neutral-500">No activity yet.</p>}
      <div className="flex flex-col gap-2">
        {list.map((l) => (
          <div key={l.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl border bg-white p-3">
            <Badge variant={variant(l.action)}>{verb[l.action] ?? l.action}</Badge>
            <span className="text-sm font-medium">{l.entity}</span>
            <span className="min-w-0 flex-1 basis-40 truncate text-sm text-neutral-600">
              {l.meta?.label || l.meta?.email || (l.action === "reorder" ? `${l.meta?.count ?? ""} items` : "")}
              {l.meta?.changed?.length ? <span className="text-neutral-400"> · changed {l.meta.changed.join(", ")}</span> : null}
            </span>
            <span className="text-xs text-neutral-500">{l.actor ? "Admin" : "System"}</span>
            <span suppressHydrationWarning className="text-xs text-neutral-500">{format(new Date(l.created_at), "dd MMM yyyy, HH:mm")}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
