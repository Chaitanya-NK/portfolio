import { ShieldCheck } from "lucide-react";
import { AuthShell } from "@/components/admin/auth-shell";
import { MfaVerify } from "./verify";

export default function Page() {
  return (
    <AuthShell icon={ShieldCheck} title="Two-step verification" subtitle="Confirm it’s you with the code from your authenticator app.">
      <MfaVerify />
    </AuthShell>
  );
}
