import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getResumeVersion, getSiteData } from "@/lib/site/data";
import { applyVersion } from "@/lib/resume-version";
import { ResumeView } from "../resume-view";

// tailored versions are unlisted: no search engines
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const [v, { profile: p }] = await Promise.all([getResumeVersion(slug), getSiteData()]);
  return { title: `${p.full_name ?? "Resume"} - ${v?.title ?? "Resume"}`, robots: { index: false, follow: false } };
}

async function Body({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [v, d] = await Promise.all([getResumeVersion(slug), getSiteData()]);
  if (!v) notFound();
  return <ResumeView data={applyVersion(d, v)} label={`print:${slug}`} />;
}

export default function Page({ params }: { params: Promise<{ slug: string }> }) {
  return <Suspense fallback={<p className="p-10">Loading…</p>}><Body params={params} /></Suspense>;
}
