"use client";
import { useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { deletePost } from "./actions";

type P = {
  id: string; title: string; slug: string; status: string; publish_at: string | null;
  published_at: string | null; updated_at: string; tags: string[]; reading_minutes: number;
};

export function PostsList({ initial }: { initial: P[] }) {
  const [posts, setPosts] = useState(initial);
  const [del, setDel] = useState<P | null>(null);
  return (
    <div className="flex max-w-none flex-col gap-3">
      <div className="flex justify-end">
        <Link href="/admin/blog/new" className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white">+ New post</Link>
      </div>
      {posts.length === 0 && (
        <p className="rounded-xl border border-dashed p-8 text-center text-sm text-neutral-500">No posts yet. Write your first one.</p>
      )}
      {posts.map((p) => {
        const scheduled = p.status === "published" && p.publish_at && new Date(p.publish_at) > new Date();
        return (
          <div key={p.id} className="flex flex-wrap items-center gap-2 rounded-xl border bg-white p-4 sm:gap-3">
            <div className="min-w-0 flex-1 basis-56">
              <Link href={`/admin/blog/${p.id}`} className="block truncate font-medium hover:underline">{p.title}</Link>
              <div className="truncate text-sm text-neutral-500" suppressHydrationWarning>
                Updated {format(new Date(p.updated_at), "dd MMM yyyy, HH:mm")} · {p.reading_minutes} min read
                {p.tags.length ? ` · ${p.tags.join(", ")}` : ""}
              </div>
            </div>
            <Badge variant={p.status === "published" && !scheduled ? "default" : "secondary"}>
              {scheduled ? "Scheduled" : p.status === "published" ? "Published" : "Draft"}
            </Badge>
            <Link href={`/admin/blog/${p.id}`} className="rounded-md border px-3 py-1.5 text-sm hover:bg-neutral-50">Edit</Link>
            <Button variant="ghost" size="sm" onClick={() => setDel(p)}>Delete</Button>
          </div>
        );
      })}
      <Dialog open={!!del} onOpenChange={(o) => !o && setDel(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Delete this post?</DialogTitle></DialogHeader>
          <p className="text-sm text-neutral-600">“{del?.title}” will be removed permanently.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDel(null)}>Cancel</Button>
            <Button variant="destructive" onClick={async () => {
              const d = del!; setDel(null);
              const r = await deletePost(d.id);
              if (!r.ok) return toast.error(r.error ?? "Failed");
              setPosts((l) => l.filter((x) => x.id !== d.id));
              toast.success("Deleted");
            }}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
