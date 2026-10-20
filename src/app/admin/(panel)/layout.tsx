import { Suspense } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { logout } from "../actions";
import { Button } from "@/components/ui/button";

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
    <div className="min-h-screen">
      <header className="flex items-center justify-between border-b px-6 py-3">
        <strong>Admin</strong>
        <form action={logout}>
          <Button variant="outline" size="sm">Sign out</Button>
        </form>
      </header>
      <div className="p-6">
        <Suspense fallback={<p className="text-sm">Loading…</p>}>
          <Guard>{children}</Guard>
        </Suspense>
      </div>
    </div>
  );
}
