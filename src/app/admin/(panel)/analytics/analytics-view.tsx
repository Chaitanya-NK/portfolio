"use client";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { getAnalytics } from "./actions";

type Item = { label: string; value: number };
type Day = { day: string; views: number; visitors: number };
export type Summary = {
  views: number; visitors: number; daily: Day[];
  pages: Item[]; referrers: Item[]; devices: Item[]; browsers: Item[]; countries: Item[];
};

function Chart({ daily }: { daily: Day[] }) {
  const W = 700, H = 190, P = 28;
  const max = Math.max(1, ...daily.map((d) => d.views));
  const bw = (W - P * 2) / Math.max(daily.length, 1);
  const y = (v: number) => H - P - (v / max) * (H - P * 2);
  const line = daily.map((d, i) => `${P + i * bw + bw / 2},${y(d.visitors)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Daily views and visitors">
      {[0, 0.5, 1].map((t) => (
        <line key={t} x1={P} x2={W - P} y1={y(max * t)} y2={y(max * t)} stroke="#e5e7eb" />
      ))}
      <text x={P - 6} y={y(max) + 4} fontSize="11" textAnchor="end" fill="#6b7280">{max}</text>
      <text x={P - 6} y={y(0) + 4} fontSize="11" textAnchor="end" fill="#6b7280">0</text>
      {daily.map((d, i) => (
        <rect key={d.day} x={P + i * bw + bw * 0.15} y={y(d.views)} width={bw * 0.7}
          height={Math.max(0, H - P - y(d.views))} rx={2} fill="#4f46e5">
          <title>{`${d.day}: ${d.views} views, ${d.visitors} visitors`}</title>
        </rect>
      ))}
      <polyline points={line} fill="none" stroke="#f59e0b" strokeWidth={2} />
      <text x={P} y={H - 8} fontSize="11" fill="#6b7280">{daily[0]?.day}</text>
      <text x={W - P} y={H - 8} fontSize="11" textAnchor="end" fill="#6b7280">{daily.at(-1)?.day}</text>
    </svg>
  );
}

function BarList({ title, items, fmt }: { title: string; items: Item[]; fmt?: (s: string) => string }) {
  const max = Math.max(1, ...items.map((i) => i.value));
  return (
    <div className="rounded-xl border bg-white p-4">
      <h3 className="mb-3 text-sm font-semibold">{title}</h3>
      {items.length === 0 && <p className="text-sm text-neutral-500">No data yet.</p>}
      <div className="flex flex-col gap-2">
        {items.map((i) => (
          <div key={i.label} className="text-sm">
            <div className="flex justify-between gap-3">
              <span className="truncate">{fmt ? fmt(i.label) : i.label}</span>
              <span className="text-neutral-500">{i.value}</span>
            </div>
            <div className="mt-1 h-1.5 rounded-full bg-neutral-100">
              <div className="h-1.5 rounded-full bg-indigo-600" style={{ width: `${(i.value / max) * 100}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const country = (c: string) => {
  try { return new Intl.DisplayNames(["en"], { type: "region" }).of(c) ?? c; } catch { return c; }
};

export function AnalyticsView({ initial }: { initial: Summary }) {
  const [days, setDays] = useState(30);
  const [s, setS] = useState(initial);
  const [pending, start] = useTransition();
  const pick = (d: number) => {
    setDays(d);
    start(async () => {
      const r = await getAnalytics(d);
      if (r.ok) setS(r.data as Summary);
      else toast.error(r.error);
    });
  };
  const perVisitor = s.visitors ? (s.views / s.visitors).toFixed(1) : "0";
  return (
    <div className={`flex max-w-5xl flex-col gap-4 ${pending ? "opacity-60" : ""}`}>
      <div className="flex gap-2">
        {[7, 30, 90].map((d) => (
          <Button key={d} size="sm" variant={days === d ? "default" : "outline"} onClick={() => pick(d)}>{d} days</Button>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[["Page views", s.views], ["Unique visitors", s.visitors], ["Views per visitor", perVisitor]].map(([l, v]) => (
          <div key={l as string} className="rounded-xl border bg-white p-4">
            <div className="text-sm text-neutral-500">{l}</div>
            <div className="text-3xl font-semibold">{v}</div>
          </div>
        ))}
      </div>
      <div className="rounded-xl border bg-white p-4">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-semibold">Traffic</h3>
          <span className="flex items-center gap-3 text-xs text-neutral-500">
            <span className="flex items-center gap-1"><i className="inline-block h-2.5 w-2.5 rounded-sm bg-indigo-600" />Views</span>
            <span className="flex items-center gap-1"><i className="inline-block h-0.5 w-4 bg-amber-500" />Visitors</span>
          </span>
        </div>
        <Chart daily={s.daily} />
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <BarList title="Top pages" items={s.pages} />
        <BarList title="Referrers" items={s.referrers} />
        <BarList title="Devices" items={s.devices} />
        <BarList title="Browsers" items={s.browsers} />
        <BarList title="Countries" items={s.countries} fmt={country} />
      </div>
    </div>
  );
}
