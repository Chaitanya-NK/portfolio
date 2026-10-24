import { Suspense } from "react";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { Inbox } from "./inbox";

async function Loader() {
  await connection();
  const supabase = await createClient();
  const [msgs, tpls, prof] = await Promise.all([
    supabase.from("messages").select("*, message_replies(id,subject,body,created_at)").order("created_at", { ascending: false }),
    supabase.from("reply_templates").select("id,title,subject,body").order("sort_order").order("created_at"),
    supabase.from("profile").select("full_name").eq("id", 1).maybeSingle(),
  ]);

  const messages = (msgs.data ?? []) as any[];
  const paths = messages.flatMap((m) => (m.attachments ?? []).map((a: any) => a.path)).filter(Boolean);
  const signed = new Map<string, string>();
  if (paths.length) {
    const { data } = await supabase.storage.from("attachments").createSignedUrls(paths, 3600);
    (data ?? []).forEach((x) => { if (x.path && x.signedUrl) signed.set(x.path, x.signedUrl); });
  }
  messages.forEach((m) => {
    m.attachments = (m.attachments ?? []).map((a: any) => ({ ...a, url: signed.get(a.path) ?? null }));
  });

  return <Inbox initial={messages} templates={tpls.data ?? []} myName={prof.data?.full_name ?? ""} />;
}

export default function Page() {
  return (
    <div>
      <h1 className="mb-4 text-2xl font-semibold">Inbox</h1>
      <Suspense fallback={<p>Loading…</p>}><Loader /></Suspense>
    </div>
  );
}
