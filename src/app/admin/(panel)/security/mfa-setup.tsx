"use client";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

type Factor = { id: string; friendly_name?: string | null };

export function MfaSetup() {
  const router = useRouter();
  const [factors, setFactors] = useState<Factor[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [enroll, setEnroll] = useState<{ id: string; qr: string; secret: string } | null>(null);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState<Factor | null>(null);

  const refresh = useCallback(async () => {
    const { data } = await createClient().auth.mfa.listFactors();
    setFactors((data?.totp ?? []) as Factor[]);
    setLoaded(true);
  }, []);
  useEffect(() => { refresh(); }, [refresh]);

  async function start() {
    setBusy(true);
    const sb = createClient();
    const { data: all } = await sb.auth.mfa.listFactors();
    for (const f of (all?.all ?? []).filter((f) => f.status === "unverified"))
      await sb.auth.mfa.unenroll({ factorId: f.id });
    const { data, error } = await sb.auth.mfa.enroll({
      factorType: "totp",
      friendlyName: `Authenticator ${new Date().toISOString().slice(0, 10)}`,
    });
    setBusy(false);
    if (error || !data) return toast.error(error?.message ?? "Could not start setup");
    setEnroll({ id: data.id, qr: data.totp.qr_code, secret: data.totp.secret });
    setCode("");
  }

  async function verify() {
    if (!enroll) return;
    setBusy(true);
    const { error } = await createClient().auth.mfa.challengeAndVerify({ factorId: enroll.id, code: code.trim() });
    setBusy(false);
    if (error) return toast.error("Invalid code. Check your app and try again.");
    toast.success("Two-factor login is now on");
    setEnroll(null);
    await refresh();
    router.refresh();
  }

  async function remove(f: Factor) {
    const { error } = await createClient().auth.mfa.unenroll({ factorId: f.id });
    setConfirmRemove(null);
    if (error) return toast.error(error.message);
    toast.success("Two-factor login removed");
    await refresh();
    router.refresh();
  }

  if (!loaded) return <p className="text-sm">Loading…</p>;
  const on = factors.length > 0;

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <Card>
        <CardHeader><CardTitle>Two-factor authentication</CardTitle></CardHeader>
        <CardContent className="flex flex-col gap-4">
          <p className="text-sm text-neutral-600">
            {on
              ? "Enabled. You need a 6-digit code from your authenticator app every time you sign in, and the database refuses admin writes without it."
              : "Add an authenticator app (Google Authenticator, Microsoft Authenticator, Authy, 1Password) so a leaked password alone can’t open your admin."}
          </p>
          {on && factors.map((f) => (
            <div key={f.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3 text-sm">
              <span>{f.friendly_name ?? "Authenticator"}</span>
              <Button variant="outline" size="sm" onClick={() => setConfirmRemove(f)}>Remove</Button>
            </div>
          ))}
          {!on && !enroll && <Button className="w-fit" onClick={start} disabled={busy}>{busy ? "Starting…" : "Set up authenticator"}</Button>}
        </CardContent>
      </Card>

      {enroll && (
        <Card>
          <CardHeader><CardTitle>Scan and confirm</CardTitle></CardHeader>
          <CardContent className="flex flex-col gap-4">
            <ol className="list-decimal space-y-1 pl-5 text-sm text-neutral-600">
              <li>Open your authenticator app and add a new account.</li>
              <li>Scan this QR code, or type the secret key manually.</li>
              <li>Enter the 6-digit code it shows.</li>
            </ol>
            <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={enroll.qr} alt="QR code for your authenticator app" className="h-44 w-44 rounded-lg border bg-white p-2" />
              <div className="min-w-0 text-sm">
                <div className="mb-1 font-medium">Secret key</div>
                <code className="block break-all rounded bg-neutral-100 px-2 py-1">{enroll.secret}</code>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Input
                className="w-40 text-center text-lg tracking-[0.3em]" inputMode="numeric" maxLength={6} placeholder="123456"
                value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} aria-label="6-digit code"
              />
              <Button onClick={verify} disabled={busy || code.length !== 6}>{busy ? "Verifying…" : "Confirm"}</Button>
              <Button variant="ghost" onClick={() => setEnroll(null)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Dialog open={!!confirmRemove} onOpenChange={(o) => !o && setConfirmRemove(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Remove two-factor login?</DialogTitle></DialogHeader>
          <p className="text-sm text-neutral-600">Your admin will be protected by the password alone until you set it up again.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmRemove(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => confirmRemove && remove(confirmRemove)}>Remove</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
