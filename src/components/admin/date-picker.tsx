"use client";
import { useState } from "react";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const triggerCls =
  "inline-flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 text-left text-sm font-normal shadow-xs outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring";

const toDate = (s: string) => {
  const [y, m, d] = s.slice(0, 10).split("-").map(Number);
  return y && m && d ? new Date(y, m - 1, d) : undefined;
};
const toStr = (d: Date) => format(d, "yyyy-MM-dd");

function CalendarPopover({ date, onPick, onClear, placeholder }: {
  date?: Date; onPick: (d: Date) => void; onClear: () => void; placeholder: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger className={triggerCls}>
        <span className={date ? "" : "text-muted-foreground"}>
          {date ? format(date, "dd MMM yyyy") : placeholder}
        </span>
        <span aria-hidden className="text-neutral-400">▾</span>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          defaultMonth={date}
          captionLayout="dropdown"
          startMonth={new Date(1970, 0)}
          endMonth={new Date(2040, 11)}
          onSelect={(d) => {
            if (d) { onPick(d); setOpen(false); }
          }}
        />
        <div className="flex justify-end border-t p-2">
          <Button type="button" variant="ghost" size="sm" onClick={() => { onClear(); setOpen(false); }}>
            Clear
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function DatePicker({ value, onChange, placeholder = "Pick a date" }: {
  value: string; onChange: (v: string) => void; placeholder?: string;
}) {
  return (
    <CalendarPopover
      date={value ? toDate(value) : undefined}
      placeholder={placeholder}
      onPick={(d) => onChange(toStr(d))}
      onClear={() => onChange("")}
    />
  );
}

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
const MINUTES = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, "0"));

export function DateTimePicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const date = value ? toDate(value) : undefined;
  const hh = value?.slice(11, 13) || "09";
  const mm = value?.slice(14, 16) || "00";
  const build = (d: Date, h: string, m: string) => `${toStr(d)}T${h}:${m}`;
  return (
    <div className="flex gap-2">
      <div className="flex-1">
        <CalendarPopover
          date={date}
          placeholder="Pick a date"
          onPick={(d) => onChange(build(d, hh, mm))}
          onClear={() => onChange("")}
        />
      </div>
      <Select value={hh} onValueChange={(h) => date && h && onChange(build(date, String(h), mm))}>
        <SelectTrigger className="w-20" aria-label="Hour" disabled={!date}><SelectValue /></SelectTrigger>
        <SelectContent>{HOURS.map((h) => <SelectItem key={h} value={h}>{h}</SelectItem>)}</SelectContent>
      </Select>
      <Select value={MINUTES.includes(mm) ? mm : "00"} onValueChange={(m) => date && m && onChange(build(date, hh, String(m)))}>
        <SelectTrigger className="w-20" aria-label="Minute" disabled={!date}><SelectValue /></SelectTrigger>
        <SelectContent>{MINUTES.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
      </Select>
    </div>
  );
}
