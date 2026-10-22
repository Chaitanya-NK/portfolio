"use client";

export function PrintButton() {
  return (
    <button
      onClick={() => {
        try {
          navigator.sendBeacon("/api/track", new Blob([JSON.stringify({ type: "click", kind: "resume", label: "print", path: "/resume" })], { type: "application/json" }));
        } catch {}
        window.print();
      }}
      className="inline-flex min-h-11 items-center rounded-md bg-neutral-900 px-4 text-sm font-medium text-white hover:bg-neutral-800"
    >
      Print / Save as PDF
    </button>
  );
}
