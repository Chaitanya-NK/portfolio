import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { getAllPosts, getSiteData } from "@/lib/site/data";
import { BlogIndex } from "@/components/site/blog-index";

export const metadata: Metadata = { title: "Blog", description: "Articles and notes." };

async function Content() {
  const [posts, { profile }] = await Promise.all([getAllPosts(), getSiteData()]);
  return (
    <div style={{ ["--accent" as string]: profile.theme?.accent || "#C6F432" }}>
      <main className="mx-auto w-[min(92%,70rem)] py-10 sm:py-16">
        <Link href="/" className="text-sm text-[color:var(--muted)] hover:text-[color:var(--fg)]">← {profile.full_name || "Back to portfolio"}</Link>
        <h1 className="mb-8 mt-6 font-[family-name:var(--font-display)] text-4xl font-bold tracking-tight sm:text-6xl">Blog</h1>
        <BlogIndex posts={posts} />
      </main>
    </div>
  );
}

export default function Page() {
  return <Suspense fallback={<p className="p-10 text-[color:var(--muted)]">Loading…</p>}><Content /></Suspense>;
}
