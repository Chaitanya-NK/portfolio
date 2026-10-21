import { Suspense } from "react";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { Library } from "./library";

async function Loader() {
  await connection();
  const supabase = await createClient();
  const bucket = supabase.storage.from("media");
  const opts = { limit: 500, sortBy: { column: "created_at", order: "desc" as const } };

  const { data: root } = await bucket.list("", opts);
  const folders = (root ?? []).filter((x) => !x.id).map((x) => x.name);

  const files: { path: string; name: string; folder: string; url: string; size: number; at: string }[] = [];
  const add = (folder: string, list: any[] | null) =>
    (list ?? [])
      .filter((x) => x.id && x.name !== ".emptyFolderPlaceholder")
      .forEach((x) => {
        const path = folder ? `${folder}/${x.name}` : x.name;
        files.push({
          path, name: x.name, folder: folder || "root",
          url: bucket.getPublicUrl(path).data.publicUrl,
          size: x.metadata?.size ?? 0, at: x.created_at ?? "",
        });
      });
  add("", root);
  for (const f of folders) add(f, (await bucket.list(f, opts)).data);

  const [profile, tools, exps, projects, tests, posts, items] = await Promise.all([
    supabase.from("profile").select("avatar_url,resume_url"),
    supabase.from("tools").select("icon_url"),
    supabase.from("experiences").select("logo_url"),
    supabase.from("projects").select("cover_url"),
    supabase.from("testimonials").select("avatar_url"),
    supabase.from("posts").select("cover_url,content_html"),
    supabase.from("section_items").select("data"),
  ]);
  const haystack = JSON.stringify([
    profile.data, tools.data, exps.data, projects.data, tests.data, posts.data, items.data,
  ]);

  const out = files
    .sort((a, b) => b.at.localeCompare(a.at))
    .map((f) => ({ ...f, used: haystack.includes(f.path) }));
  return <Library initial={out} />;
}

export default function Page() {
  return (
    <div>
      <h1 className="mb-1 text-2xl font-semibold">Media library</h1>
      <p className="mb-6 text-sm text-neutral-600">
        Every uploaded file. Files marked “In use” appear somewhere on your site, so deleting them would break an image or link.
      </p>
      <Suspense fallback={<p>Loading…</p>}><Loader /></Suspense>
    </div>
  );
}
