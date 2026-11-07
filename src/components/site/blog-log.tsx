"use client";

import { useEffect, useRef, useState } from "react";
import { format } from "date-fns";
import type { Row } from "@/lib/site/data";
import { WindowBar } from "./contact-terminal";

const COMMAND = "git log --oneline blog/";
const cmd = "inline-flex min-h-9 items-center rounded border border-[color:var(--line2)] px-2.5 text-[0.8125rem] text-[color:var(--fg2)] transition-colors hover:border-[color:var(--accent-ink)] hover:text-[color:var(--accent-ink)]";

/** A short, stable "commit hash" derived from the post's slug. */
function hash(slug: string) {
  let h = 2166136261;
  for (let i = 0; i < slug.length; i++) { h ^= slug.charCodeAt(i); h = Math.imul(h, 16777619); }
  return (h >>> 0).toString(16).padStart(8, "0").slice(0, 7);
}

const Caret = ({ blink = true }: { blink?: boolean }) => (
  <span aria-hidden className={`${blink ? "term-cursor " : ""}ml-0.5 inline-block h-[1.05em] w-2 translate-y-[0.2em] bg-[var(--accent)]`} />
);

export function BlogLog({ posts, name }: { posts: Row[]; name?: string | null }) {
  const user = (name ?? "guest").trim().split(/\s+/)[0].toLowerCase().replace(/[^a-z0-9]/g, "") || "guest";
  // "static": everything visible (SSR, no JS, reduced motion). "idle": waiting to scroll into view. "run": typing, then lines appear.
  const [mode, setMode] = useState<"static" | "idle" | "run">("static");
  const [typed, setTyped] = useState(0);
  const [lines, setLines] = useState(0);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const el = box.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setMode("run"); io.disconnect(); } else setMode("idle");
    }, { threshold: 0.3 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (mode !== "run") return;
    if (typed < COMMAND.length) {
      const t = setTimeout(() => setTyped(typed + 1), typed === 0 ? 350 : 38);
      return () => clearTimeout(t);
    }
    if (lines < posts.length + 1) {
      const t = setTimeout(() => setLines(lines + 1), lines === 0 ? 380 : 160);
      return () => clearTimeout(t);
    }
  }, [mode, typed, lines, posts.length]);

  const all = mode === "static";
  const chars = all ? COMMAND.length : mode === "idle" ? 0 : typed;
  const typing = !all && mode === "run" && typed < COMMAND.length;
  const rowsShown = all ? posts.length : lines;
  const ready = all || lines > posts.length;

  return (
    <div ref={box} className="flex flex-col overflow-hidden rounded-xl border border-[color:var(--line)] bg-[color:var(--surface)] text-[color:var(--fg2)] shadow-sm">
      <WindowBar title={`${user}@portfolio: ~/blog`} />
      <div className="px-3 py-5 font-[family-name:var(--font-mono)] text-[0.8125rem] leading-relaxed sm:px-5">
        <p>
          <span className={`select-none text-[color:var(--accent-ink)] ${mode === "idle" ? "invisible" : ""}`}>❯ </span>
          <span className="text-[color:var(--fg)]">{COMMAND.slice(0, chars)}</span>
          {typing && <Caret blink={false} />}
          <span className="invisible">{COMMAND.slice(chars)}</span>
        </p>

        <ul className="mt-3 flex flex-col">
          {posts.map((p, i) => {
            const date = p.published_at ? format(new Date(p.published_at), "dd MMM yy") : "";
            const tags: string[] = (p.tags ?? []).slice(0, 2);
            return (
              <li key={p.id} className={i < rowsShown ? "" : "invisible"}>
                <a
                  href={`/blog/${p.slug}`}
                  className="group grid min-h-11 grid-cols-[auto_minmax(0,1fr)] items-baseline gap-x-3 gap-y-0.5 rounded px-2 py-2 transition-colors hover:bg-[color:var(--surface2)] sm:grid-cols-[4.5rem_6rem_minmax(0,1fr)_auto]"
                >
                  <span className="text-[color:var(--accent-ink)]">{hash(p.slug)}</span>
                  <span suppressHydrationWarning className="text-[color:var(--faint)] sm:order-none">{date}</span>
                  <span className="col-span-2 min-w-0 sm:col-span-1">
                    <span className="text-[color:var(--fg)] underline decoration-transparent underline-offset-4 transition-colors group-hover:decoration-[color:var(--accent-ink)]">
                      {i === 0 && <span className="mr-2 text-[color:var(--accent-ink)]">(latest)</span>}
                      {p.title}
                    </span>
                    {p.excerpt && <span className="mt-0.5 block truncate text-[color:var(--muted)]">{p.excerpt}</span>}
                  </span>
                  <span className="col-span-2 flex flex-wrap items-center gap-x-3 text-[color:var(--faint)] sm:col-span-1 sm:justify-end">
                    {tags.map((t) => <span key={t}>#{t.replace(/\s+/g, "-")}</span>)}
                    <span>{p.reading_minutes}m</span>
                  </span>
                </a>
              </li>
            );
          })}
        </ul>

        <div className={`mt-4 flex flex-wrap items-center gap-3 ${ready ? "" : "invisible"}`}>
          <a href="/blog" className={cmd}>./all-posts</a>
        </div>
        <p className={`mt-4 ${ready ? "" : "invisible"}`}>
          <span className="select-none text-[color:var(--accent-ink)]">❯ </span>
          <Caret />
        </p>
      </div>
    </div>
  );
}
