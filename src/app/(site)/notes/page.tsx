import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { getAllNotes, getSiteData } from "@/lib/site/data";
import { Notes } from "@/components/site/sections";

export const metadata: Metadata = { title: "Notes", description: "Short notes on what I’m learning and building." };

async function Content() {
  const [notes, { profile }] = await Promise.all([getAllNotes(), getSiteData()]);
  return (
    <main className="mx-auto w-[min(92%,48rem)] py-10 sm:py-16">
      <Link href="/" className="text-sm text-[color:var(--muted)] hover:text-[color:var(--fg)]">← {profile.full_name || "Back to portfolio"}</Link>
      <h1 className="mb-8 mt-6 font-[family-name:var(--font-display)] text-2xl font-bold tracking-tight sm:text-3xl">Notes</h1>
      {notes.length ? <Notes items={notes} /> : <p className="text-[color:var(--muted)]">No notes yet.</p>}
    </main>
  );
}

export default function Page() {
  return <Suspense fallback={<p className="p-10 text-[color:var(--muted)]">Loading…</p>}><Content /></Suspense>;
}
