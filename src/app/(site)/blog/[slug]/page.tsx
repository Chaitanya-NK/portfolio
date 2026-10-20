import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { getPost, getSiteData } from "@/lib/site/data";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return { title: "Post not found" };
  return {
    title: post.seo_title || post.title,
    description: post.seo_description || post.excerpt || undefined,
    openGraph: { title: post.seo_title || post.title, images: post.cover_url ? [post.cover_url] : undefined },
  };
}

async function Article({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [post, { profile }] = await Promise.all([getPost(slug), getSiteData()]);
  if (!post) notFound();
  return (
    <div style={{ ["--accent" as string]: profile.theme?.accent || "#C6F432" }}>
      <article className="mx-auto w-[min(760px,92%)] py-12 sm:py-20">
        <Link href="/" className="text-sm text-[#9A9AAE] hover:text-white">← {profile.full_name || "Back to portfolio"}</Link>
        <h1 className="mt-6 font-[family-name:var(--font-display)] text-4xl font-bold leading-tight tracking-tight sm:text-5xl">{post.title}</h1>
        <p className="mt-3 text-sm text-[#9A9AAE]">
          {post.published_at ? format(new Date(post.published_at), "dd MMMM yyyy") : ""} · {post.reading_minutes} min read
        </p>
        {post.tags?.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {post.tags.map((t: string) => <span key={t} className="rounded-full border border-[#23232F] px-2.5 py-1 text-xs text-[#9A9AAE]">{t}</span>)}
          </div>
        )}
        {post.cover_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={post.cover_url} alt="" className="mt-8 w-full rounded-2xl object-cover" />
        )}
        <div className="rich mt-8 [&_a]:text-[var(--accent)] [&_h1]:text-3xl [&_h2]:text-2xl" dangerouslySetInnerHTML={{ __html: post.content_html }} />
      </article>
    </div>
  );
}

export default function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  return <Suspense fallback={<p className="p-10 text-[#9A9AAE]">Loading…</p>}><Article params={params} /></Suspense>;
}
