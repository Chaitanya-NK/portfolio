"use client";
import { useMemo, useState } from "react";
import type { Row } from "@/lib/site/data";
import { PostCard } from "./post-card";

export function BlogIndex({ posts }: { posts: Row[] }) {
  const [q, setQ] = useState("");
  const [tag, setTag] = useState<string | null>(null);
  const tags = useMemo(() => [...new Set(posts.flatMap((p) => p.tags ?? []))].sort() as string[], [posts]);
  const list = posts.filter((p) =>
    (!tag || p.tags?.includes(tag)) &&
    (!q || `${p.title} ${p.excerpt ?? ""}`.toLowerCase().includes(q.toLowerCase()))
  );
  const pill = (on: boolean) =>
    `rounded-md border px-3.5 py-2 text-sm transition-colors ${on ? "border-[color:var(--accent-ink)] text-[color:var(--accent-ink)]" : "border-[color:var(--line)] text-[color:var(--muted)] hover:text-[color:var(--fg)]"}`;
  return (
    <div className="flex flex-col gap-6">
      <input
        value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search posts…" aria-label="Search posts"
        className="w-full rounded-xl border border-[color:var(--line)] bg-[color:var(--surface)] px-4 py-3 outline-none placeholder:text-[color:var(--faint)] focus:border-[color:var(--accent-ink)] sm:max-w-md"
      />
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <button className={pill(tag === null)} onClick={() => setTag(null)}>All</button>
          {tags.map((t) => <button key={t} className={pill(tag === t)} onClick={() => setTag(t)}>{t}</button>)}
        </div>
      )}
      {list.length === 0 && <p className="text-[color:var(--muted)]">No posts found.</p>}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {list.map((p) => <PostCard key={p.id} p={p} />)}
      </div>
    </div>
  );
}
