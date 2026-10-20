"use server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { rateLimit } from "@/lib/rate-limit";

export async function login(formData: FormData) {
  if (!(await rateLimit("login", 8, 900))) redirect("/admin/login?error=limit");
  const email = String(formData.get("email") ?? "").trim();
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password: String(formData.get("password") ?? ""),
  });
  const admin = createAdminClient();
  if (error || !data.user) {
    await admin.from("audit_logs").insert({ action: "login_failed", entity: "auth", meta: { email: email.slice(0, 100) } });
    redirect("/admin/login?error=1");
  }
  await admin.from("audit_logs").insert({ actor: data.user.id, action: "login", entity: "auth" });
  redirect("/admin");
}

export async function logout() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) await createAdminClient().from("audit_logs").insert({ actor: user.id, action: "logout", entity: "auth" });
  await supabase.auth.signOut();
  redirect("/admin/login");
}
