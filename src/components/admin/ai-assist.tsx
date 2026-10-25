"use client";
import { useState } from "react";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

type Res = { ok: true; text: string } | { ok: false; error: string };

// read and write an uncontrolled form field by its name
export function domField(name: string) {
  const el = () => document.querySelector<HTMLInputElement | HTMLTextAreaElement>(`[name="${name}"]`);
  return {
    get: () => el()?.value ?? "",
    set: (v: string) => {
      const e = el();
      if (e) { e.value = v; e.dispatchEvent(new Event("input", { bubbles: true })); }
    },
  };
}

export function AiTextAssist({ label, getValue, setValue, run }: {
  label: string; getValue: () => string; setValue: (v: string) => void; run: (current: string) => Promise<Res>;
}) {
  const [busy, setBusy] = useState(false);
  const [undo, setUndo] = useState<string | null>(null);

  async function go() {
    const cur = getValue();
    setBusy(true);
    const r = await run(cur);
    setBusy(false);
    if (!r.ok) { toast.error(r.error); return; }
    setUndo(cur);
    setValue(r.text);
    toast.success("Done. Please read it before saving.");
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button type="button" variant="outline" size="sm" disabled={busy} onClick={go}>
        <Sparkles className="mr-1.5 h-3.5 w-3.5" />{busy ? "Thinking…" : label}
      </Button>
      {undo !== null && !busy && (
        <Button type="button" variant="ghost" size="sm" onClick={() => { setValue(undo); setUndo(null); }}>Undo</Button>
      )}
    </div>
  );
}
