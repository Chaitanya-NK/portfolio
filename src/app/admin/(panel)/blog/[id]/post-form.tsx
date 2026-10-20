"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileUpload } from "@/components/admin/file-upload";
import { DateTimePicker } from "@/components/admin/date-picker";
import { RichEditor } from "@/components/admin/rich-editor";
import { savePost } from "../actions";

type Post = Record<string, any>;
const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const countWords = (h: string) => h.replace(/<[^>]+>/g, " ").split(/\s+/).filter(Boolean).length;

function Box({ t, children }: { t: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border bg-white p-4">
      <h3 className="text-sm font-semibold">{t}</h3>
      {children}
    </div>
  );
}

export function PostForm({ post }: { post: Post | null }) {
  const router = useRouter();
  const [id, setId] = useState<string | null>(post?.id ?? null);
  const [title, setTitle] = useState(post?.title ?? "");
  const [slug, setSlug] = useState(post?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(!!post);
  const [excerpt, setExcerpt] = useState(post?.excerpt ?? "");
  const [cover, setCover] = useState(post?.cover_url ?? "");
  const [tags, setTags] = useState<string>((post?.tags ?? []).join(", "));
  const [status, setStatus] = useState<"draft" | "published">(post?.status ?? "draft");
  const [sched, setSched] = useState("");
  const [seoTitle, setSeoTitle] = useState(post?.seo_title ?? "");
  const [seoDesc, setSeoDesc] = useState(post?.seo_description ?? "");
  const [doc, setDoc] = useState<{ json: unknown; html: string }>({ json: post?.content_json ?? null, html: post?.content_html ?? "" });
  const [words, setWords] = useState(() => countWords(post?.content_html ?? ""));
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (post?.publish_at) setSched(format(new Date(post.publish_at), "yyyy-MM-dd'T'HH:mm"));
  }, [post?.publish_at]);

  const save = useCallback(async () => {
    if (!title.trim()) return toast.error("Add a title first");
    setBusy(true);
    const r = await savePost(id, {
      title, slug, excerpt, cover_url: cover, tags, status,
      content_json: doc.json, content_html: doc.html,
      publish_at: sched ? new Date(sched).toISOString() : "",
      seo_title: seoTitle, seo_description: seoDesc,
    });
    setBusy(false);
    if (!r.ok || !r.row) return toast.error(r.error ?? "Failed to save");
    setSlug(r.row.slug);
    setDirty(false);
    toast.success(status === "published" ? "Saved and published" : "Draft saved");
    if (!id) {
      setId(r.row.id);
      router.replace(`/admin/blog/${r.row.id}`);
    }
  }, [id, title, slug, excerpt, cover, tags, status, doc, sched, seoTitle, seoDesc, router]);

  const saveRef = useRef(save);
  useEffect(() => { saveRef.current = save; });
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") { e.preventDefault(); saveRef.current(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => { e.preventDefault(); };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const up = (fn: (v: string) => void) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    fn(e.target.value);
    setDirty(true);
  };

  return (
    <div className="max-w-6xl">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <Link href="/admin/blog" className="text-sm text-indigo-600 underline">← All posts</Link>
        <div className="flex items-center gap-3">
          {dirty && <span className="text-xs text-amber-600">Unsaved changes</span>}
          <Button onClick={save} disabled={busy}>{busy ? "Saving…" : status === "published" ? "Save & publish" : "Save draft"}</Button>
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="flex min-w-0 flex-col gap-4">
          <Input
            className="h-auto border-0 bg-transparent px-0 text-2xl font-bold sm:text-3xl shadow-none focus-visible:ring-0"
            placeholder="Post title" aria-label="Post title" value={title}
            onChange={(e) => { setTitle(e.target.value); if (!slugTouched) setSlug(slugify(e.target.value)); setDirty(true); }}
          />
          <Textarea rows={2} placeholder="Short excerpt shown on the blog list and in search results" value={excerpt} onChange={up(setExcerpt)} />
          <RichEditor
            initialJSON={post?.content_json} initialHTML={post?.content_html}
            onChange={(o) => { setDoc({ json: o.json, html: o.html }); setWords(o.words); setDirty(true); }}
          />
        </div>
        <div className="flex flex-col gap-4">
          <Box t="Publish">
            <Select value={status} onValueChange={(v) => { if (v != null) { setStatus(String(v) as "draft" | "published"); setDirty(true); } }}>
              <SelectTrigger aria-label="Status"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft (hidden)</SelectItem>
                <SelectItem value="published">Published</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex flex-col gap-1 text-sm font-medium">
              Schedule (optional)
              <DateTimePicker value={sched} onChange={(v) => { setSched(v); setDirty(true); }} />
              <span className="text-xs font-normal text-neutral-500">Published posts with a future date stay hidden until then.</span>
            </div>
            <p className="text-xs text-neutral-500">{words} words · {Math.max(1, Math.ceil(words / 200))} min read</p>
            <Button className="lg:hidden" onClick={save} disabled={busy}>{busy ? "Saving…" : "Save"}</Button>
          </Box>
          <Box t="Cover image">
            <FileUpload label="" folder="blog-covers" accept="image/*" defaultValue={cover} onChange={(u) => { setCover(u); setDirty(true); }} />
          </Box>
          <Box t="Tags">
            <Input placeholder="nextjs, supabase, devops" value={tags} onChange={up(setTags)} aria-label="Tags" />
          </Box>
          <Box t="URL and SEO">
            <label className="flex flex-col gap-1 text-sm font-medium">Slug
              <Input value={slug} onChange={(e) => { setSlug(slugify(e.target.value)); setSlugTouched(true); setDirty(true); }} />
            </label>
            <label className="flex flex-col gap-1 text-sm font-medium">SEO title
              <Input value={seoTitle} onChange={up(setSeoTitle)} placeholder={title} />
            </label>
            <label className="flex flex-col gap-1 text-sm font-medium">SEO description
              <Textarea rows={3} value={seoDesc} onChange={up(setSeoDesc)} placeholder={excerpt} />
            </label>
          </Box>
        </div>
      </div>
    </div>
  );
}
