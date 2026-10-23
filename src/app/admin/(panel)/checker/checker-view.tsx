"use client";
import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Issue, Level } from "@/lib/health";
import { checkLinks, type LinkReport, type LinkRow } from "./actions";

const LABEL: Record<Level, string> = { error: "Fix", warn: "Improve", info: "Tip" };
const DOT: Record<Level, string> = { error: "bg-red-500", warn: "bg-amber-500", info: "bg-sky-500" };

function LinkList({ title, rows, tone }: { title: string; rows: LinkRow[]; tone: string }) {
  if (!rows.length) return null;
  return (
    <div className="flex flex-col gap-2">
      <h3 className={`text-sm font-semibold ${tone}`}>{title} ({rows.length})</h3>
      {rows.map((r) => (
        <div key={r.url} className="rounded-lg border bg-white p-3 text-sm">
          <a href={r.url} target="_blank" rel="noreferrer" className="break-all font-medium text-indigo-600 underline">{r.url}</a>
          <div className="mt-0.5 text-xs text-neutral-500">{r.status ? `${r.status} · ` : ""}{r.note}</div>
          <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1">
            {r.sources.map((s, i) => <Link key={i} href={s.href} className="text-xs text-neutral-600 underline">{s.label}</Link>)}
          </div>
        </div>
      ))}
    </div>
  );
}

export function CheckerView({ issues }: { issues: Issue[] }) {
  const router = useRouter();
  const [level, setLevel] = useState<"all" | Level>("all");
  const [report, setReport] = useState<LinkReport | null>(null);
  const [pending, start] = useTransition();

  const n = (l: Level) => issues.filter((i) => i.level === l).length;
  const shown = issues.filter((i) => level === "all" || i.level === level);
  const areas = [...new Set(shown.map((i) => i.area))];

  const pill = (on: boolean) =>
    `rounded-full border px-3.5 py-1.5 text-sm transition-colors ${on ? "border-neutral-900 bg-neutral-900 text-white" : "bg-white text-neutral-600 hover:bg-neutral-50"}`;

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-3 gap-3">
        {(["error", "warn", "info"] as Level[]).map((l) => (
          <div key={l} className="rounded-xl border bg-white p-4">
            <div className="flex items-center gap-2 text-sm text-neutral-500"><span className={`h-2.5 w-2.5 rounded-full ${DOT[l]}`} />{LABEL[l]}</div>
            <div className="text-3xl font-semibold">{n(l)}</div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button className={pill(level === "all")} onClick={() => setLevel("all")}>All ({issues.length})</button>
        {(["error", "warn", "info"] as Level[]).map((l) => (
          <button key={l} className={pill(level === l)} onClick={() => setLevel(l)}>{LABEL[l]} ({n(l)})</button>
        ))}
        <Button variant="outline" size="sm" className="ml-auto" onClick={() => router.refresh()}>Re-check</Button>
      </div>

      {issues.length === 0 && (
        <p className="rounded-xl border bg-white p-6 text-center text-sm text-green-700">✓ Everything checks out. Nothing to fix.</p>
      )}

      {areas.map((area) => (
        <section key={area} className="flex flex-col gap-2">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-neutral-500">{area}</h2>
          {shown.filter((i) => i.area === area).map((i) => (
            <details key={i.id} className="group rounded-xl border bg-white">
              <summary className="flex cursor-pointer list-none items-start gap-3 p-3.5">
                <span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${DOT[i.level]}`} aria-label={LABEL[i.level]} />
                <span className="min-w-0 flex-1 text-sm">{i.message}</span>
                <ChevronDown className="mt-0.5 h-4 w-4 shrink-0 text-neutral-400 transition-transform group-open:rotate-180" />
              </summary>
              <div className="flex flex-col gap-1 border-t px-3.5 py-2.5">
                {i.items.map((it, k) => (
                  <Link key={k} href={it.href} className="flex items-center justify-between gap-3 rounded-md px-2 py-1.5 text-sm hover:bg-neutral-50">
                    <span className="truncate">{it.label}</span><span className="shrink-0 text-indigo-600">Open →</span>
                  </Link>
                ))}
              </div>
            </details>
          ))}
        </section>
      ))}

      <section className="flex flex-col gap-3 rounded-xl border bg-white p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="font-semibold">Broken link check</h2>
            <p className="text-sm text-neutral-500">Tests every external link in your profile, projects, blog posts and services. Takes up to a minute.</p>
          </div>
          <Button disabled={pending} onClick={() => start(async () => {
            const r = await checkLinks();
            if (!r.ok) { toast.error(r.error); return; }
            setReport(r.report);
            toast.success(r.report.broken.length ? `${r.report.broken.length} broken link${r.report.broken.length === 1 ? "" : "s"} found` : "No broken links");
          })}>{pending ? "Checking…" : "Run link check"}</Button>
        </div>
        {report && (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-neutral-600">{report.checked} links checked · {report.good} working</p>
            {report.broken.length === 0 && <p className="text-sm text-green-700">✓ No broken links.</p>}
            <LinkList title="Broken" rows={report.broken} tone="text-red-600" />
            <LinkList title="Could not verify (many sites like LinkedIn block bots, so open these by hand)" rows={report.unverified} tone="text-amber-600" />
          </div>
        )}
      </section>
    </div>
  );
}
