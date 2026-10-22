"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { toast } from "sonner";
import { Copy, Link as LinkIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { createRequest, deleteRequest, rejectRequest, approveRequest } from "./actions";

type Req = {
  id: string; token: string; label: string | null; status: "open" | "submitted" | "approved" | "rejected";
  expires_at: string; name: string | null; title: string | null; company: string | null;
  quote: string | null; avatar_url: string | null; submitted_at: string | null; created_at: string;
};

const link = (t: string) => `${window.location.origin}/testimonial/${t}`;
const copy = (t: string) => { navigator.clipboard.writeText(link(t)); toast.success("Link copied"); };

export function RequestsView({ initial }: { initial: Req[] }) {
  const router = useRouter();
  const [list, setList] = useState(initial);
  const [creating, setCreating] = useState(false);
  const [label, setLabel] = useState("");
  const [days, setDays] = useState("30");
  const [busy, setBusy] = useState(false);
  const [review, setReview] = useState<Req | null>(null);
  const [form, setForm] = useState({ name: "", title: "", company: "", quote: "" });

  const pending = list.filter((r) => r.status === "submitted").length;
  const expired = (r: Req) => r.status === "open" && new Date(r.expires_at) < new Date();

  async function create() {
    setBusy(true);
    const r = await createRequest(label, Number(days));
    setBusy(false);
    if (!r.ok || !r.token) return toast.error(r.error ?? "Failed");
    await navigator.clipboard.writeText(link(r.token)).catch(() => {});
    toast.success("Link created and copied. Send it to the person.");
    setCreating(false); setLabel("");
    router.refresh();
    setTimeout(() => window.location.reload(), 400);
  }
  async function remove(r: Req) {
    const x = await deleteRequest(r.id);
    if (!x.ok) return toast.error(x.error ?? "Failed");
    setList((l) => l.filter((i) => i.id !== r.id));
    toast.success("Deleted");
  }
  function openReview(r: Req) {
    setReview(r);
    setForm({ name: r.name ?? "", title: r.title ?? "", company: r.company ?? "", quote: r.quote ?? "" });
  }
  async function decide(approve: boolean) {
    if (!review) return;
    setBusy(true);
    const r = approve ? await approveRequest(review.id, form) : await rejectRequest(review.id);
    setBusy(false);
    if (!r.ok) return toast.error(r.error ?? "Failed");
    setList((l) => l.map((i) => (i.id === review.id ? { ...i, status: approve ? "approved" : "rejected" } : i)));
    toast.success(approve ? "Approved and published on your site" : "Rejected");
    setReview(null);
  }

  const badge = (r: Req) =>
    r.status === "submitted" ? <Badge>Needs review</Badge>
    : r.status === "approved" ? <Badge variant="secondary">Published</Badge>
    : r.status === "rejected" ? <Badge variant="secondary">Rejected</Badge>
    : expired(r) ? <Badge variant="secondary">Expired</Badge>
    : <Badge variant="secondary">Waiting</Badge>;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-neutral-600">{pending ? `${pending} submission${pending === 1 ? "" : "s"} waiting for your review.` : "Create a private link, send it to someone, and approve what they write."}</p>
        <Button onClick={() => setCreating(true)}><LinkIcon className="mr-2 h-4 w-4" />New request link</Button>
      </div>

      {list.length === 0 && <p className="rounded-xl border border-dashed bg-white p-8 text-center text-sm text-neutral-500">No requests yet.</p>}

      <div className="grid gap-2 min-[1700px]:grid-cols-2">
        {list.map((r) => (
          <div key={r.id} className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border bg-white p-3">
            <div className="min-w-0 flex-1 basis-48">
              <div className="truncate font-medium">{r.status === "open" ? r.label || "Untitled link" : r.name || r.label || "Submission"}</div>
              <div suppressHydrationWarning className="truncate text-xs text-neutral-500">
                {r.status === "submitted" || r.status === "approved" || r.status === "rejected"
                  ? `${[r.title, r.company].filter(Boolean).join(", ") || "Submitted"} · ${r.submitted_at ? format(new Date(r.submitted_at), "d MMM yyyy") : ""}`
                  : `Expires ${format(new Date(r.expires_at), "d MMM yyyy")}`}
              </div>
            </div>
            {badge(r)}
            <div className="ml-auto flex flex-wrap gap-1">
              {r.status === "open" && !expired(r) && <Button variant="outline" size="sm" onClick={() => copy(r.token)}><Copy className="mr-1 h-3.5 w-3.5" />Copy link</Button>}
              {r.status === "submitted" && <Button size="sm" onClick={() => openReview(r)}>Review</Button>}
              <Button variant="ghost" size="sm" onClick={() => remove(r)}>{r.status === "open" ? "Revoke" : "Delete"}</Button>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={creating} onOpenChange={(o) => !busy && setCreating(o)}>
        <DialogContent>
          <DialogHeader><DialogTitle>New request link</DialogTitle></DialogHeader>
          <label className="flex flex-col gap-1 text-sm font-medium">
            Who is it for? (only you see this)
            <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. Priya, former manager" />
          </label>
          <div className="flex flex-col gap-1 text-sm font-medium">
            Link works for
            <Select value={days} onValueChange={(v) => v != null && setDays(String(v))}>
              <SelectTrigger aria-label="Expiry"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="7">7 days</SelectItem>
                <SelectItem value="30">30 days</SelectItem>
                <SelectItem value="90">90 days</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <p className="text-xs text-neutral-500">The link can be used once. Nothing is published until you approve it.</p>
          <DialogFooter>
            <Button variant="outline" disabled={busy} onClick={() => setCreating(false)}>Cancel</Button>
            <Button disabled={busy} onClick={create}>{busy ? "Creating…" : "Create and copy link"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!review} onOpenChange={(o) => !o && !busy && setReview(null)}>
        <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-lg">
          <DialogHeader><DialogTitle>Review testimonial</DialogTitle></DialogHeader>
          {review?.avatar_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={review.avatar_url} alt="" className="h-20 w-20 rounded-full border object-cover" />
          )}
          <div className="grid gap-3">
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} aria-label="Name" placeholder="Name" />
            <div className="grid gap-3 sm:grid-cols-2">
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} aria-label="Job title" placeholder="Job title" />
              <Input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} aria-label="Company" placeholder="Company" />
            </div>
            <Textarea rows={6} value={form.quote} onChange={(e) => setForm({ ...form, quote: e.target.value })} aria-label="Quote" />
          </div>
          <p className="text-xs text-neutral-500">You can fix typos before publishing. They agreed to public display when they submitted.</p>
          <DialogFooter className="gap-2">
            <Button variant="outline" disabled={busy} onClick={() => decide(false)}>Reject</Button>
            <Button disabled={busy} onClick={() => decide(true)}>{busy ? "Saving…" : "Approve and publish"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
