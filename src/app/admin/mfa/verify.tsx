"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { logout } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function MfaVerify() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const sb = createClient();
    const { data } = await sb.auth.mfa.listFactors();
    const factor = data?.totp?.[0];
    if (!factor) { setError("No authenticator is set up for this account."); setBusy(false); return; }
    const { error } = await sb.auth.mfa.challengeAndVerify({ factorId: factor.id, code: code.trim() });
    if (error) { setError("Invalid or expired code. Try again."); setBusy(false); return; }
    router.replace("/admin");
    router.refresh();
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader><CardTitle>Two-factor verification</CardTitle></CardHeader>
      <CardContent>
        <form onSubmit={submit} className="flex flex-col gap-3">
          <p className="text-sm text-neutral-600">Enter the 6-digit code from your authenticator app.</p>
          <Input
            inputMode="numeric" autoComplete="one-time-code" autoFocus maxLength={6} placeholder="123456"
            value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} aria-label="6-digit code"
            className="text-center text-xl tracking-[0.4em]"
          />
          {error && <p className="text-sm text-red-500">{error}</p>}
          <Button type="submit" disabled={busy || code.length !== 6}>{busy ? "Verifying…" : "Verify"}</Button>
        </form>
        <form action={logout} className="mt-3">
          <Button type="submit" variant="ghost" size="sm" className="w-full">Sign out</Button>
        </form>
      </CardContent>
    </Card>
  );
}
