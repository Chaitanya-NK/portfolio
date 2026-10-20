import { Suspense } from "react";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { Library } from "./library";

async function Loader() {
  await connection();
  const supabase = await createClient();
  const bucket = supabase.storage.from("media");
  const opts = { limit: 200, sortBy: { column: "created_at", order: "desc" as const } };
  const { data: root } = await bucket.list("", opts);
  const folders = (root ?? []).filter((x) => !x.id).map((x) => x.name);
  const files: { path: string; name: string; folder: string; url: string; size: number; at: string }[] = [];
  const add = (folder: string, list: any[] | null) =>
    (list ?? []).filter((x) => x.id && x.name !== ".emptyFolderPlaceholder").forEach((x) => {
      const path = folder ? `${folder}/${x.name}` : x.name;
      files.push({ path, name: x.name, folder: folder || "root", url: bucket.getPublicUrl(path).data.publicUrl, size: x.metadata?.size ?? 0, at: x.created_at ?? "" });
    });
  add("", root);
  for (const f of folders) add(f, (await bucket.list(f, opts)).data);
  files.sort((a, b) => b.at.localeCompare(a.at));
  return <Library initial={files} />;
}
export default function Page() {
  return (
    <div>
      <h1 className="mb-1 text-2xl font-semibold">Media library</h1>
      <p className="mb-6 text-sm text-neutral-600">Every uploaded file. Deleting a file that is still in use will break that image on the site.</p>
      <Suspense fallback={<p>Loading…</p>}><Loader /></Suspense>
    </div>
  );
}
