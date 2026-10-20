import { Suspense } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { logout } from "../actions";
import { Button } from "@/components/ui/button";
import { AdminNav } from "@/components/admin/admin-nav";

async function Guard({ children }: { children: React.ReactNode }) {
  await connection();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");
  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (!isAdmin) redirect("/admin/login?error=1");
  return <>{children}</>;
}

export default function PanelLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-neutral-100 text-neutral-900">
      <aside className="sticky top-0 flex h-screen w-60 shrink-0 flex-col gap-6 bg-[#14161A] p-4">
        <strong className="px-3 pt-2 text-white">Admin · Portfolio</strong>
        <Suspense fallback={<div className="h-96" />}>
          <AdminNav />
        </Suspense>
        <form action={logout} className="mt-auto">
          <Button variant="outline" size="sm" className="w-full">Sign out</Button>
        </form>
      </aside>
      <main className="min-w-0 flex-1 p-8">
        <Suspense fallback={<p className="text-sm">Loading…</p>}>
          <Guard>{children}</Guard>
        </Suspense>
      </main>
    </div>
  );
}
