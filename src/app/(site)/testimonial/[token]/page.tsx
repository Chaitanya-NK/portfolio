import { Suspense } from "react";
import type { Metadata } from "next";
import { connection } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSiteData } from "@/lib/site/data";
import { TestimonialForm } from "./form";

export const metadata: Metadata = { title: "Share a testimonial", robots: { index: false, follow: false } };

async function Body({ params }: { params: Promise<{ token: string }> }) {
  await connection();
  const { token } = await params;
  const { profile } = await getSiteData();
  let valid = false;
  if (/^[A-Za-z0-9_-]{20,64}$/.test(token)) {
    const { data } = await createAdminClient().from("testimonial_requests").select("status,expires_at").eq("token", token).maybeSingle();
    valid = !!data && data.status === "open" && new Date(data.expires_at) > new Date();
  }
  return (
    <main className="mx-auto w-[min(92%,34rem)] py-12 sm:py-20">
      {valid ? (
        <>
          <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight sm:text-4xl">
            Share a few words about working with {profile.full_name?.split(" ")[0] ?? "me"}
          </h1>
          <p className="mb-8 mt-3 text-[color:var(--muted)]">It only takes a minute. Your testimonial is reviewed before anything is published.</p>
          <TestimonialForm token={token} />
        </>
      ) : (
        <div className="rounded-lg border border-[color:var(--line)] bg-[color:var(--surface)] p-8 text-center">
          <h1 className="text-2xl font-bold">This link isn’t available</h1>
          <p className="mt-2 text-[color:var(--muted)]">It may have expired or already been used. Please ask for a new one.</p>
        </div>
      )}
    </main>
  );
}

export default function Page({ params }: { params: Promise<{ token: string }> }) {
  return <Suspense fallback={<p className="p-10 text-[color:var(--muted)]">Loading…</p>}><Body params={params} /></Suspense>;
}
