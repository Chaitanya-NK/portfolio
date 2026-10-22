import { Suspense } from "react";
import { Lock } from "lucide-react";
import { AuthShell } from "@/components/admin/auth-shell";
import { LoginForm } from "./login-form";

async function ErrorNote({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  if (!error) return null;
  return (
    <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
      {error === "limit"
        ? "Too many attempts. Please wait a few minutes and try again."
        : "That email or password is incorrect."}
    </p>
  );
}

export default function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  return (
    <AuthShell icon={Lock} title="Welcome back" subtitle="Sign in to manage your portfolio.">
      <LoginForm>
        <Suspense><ErrorNote searchParams={searchParams} /></Suspense>
      </LoginForm>
    </AuthShell>
  );
}
