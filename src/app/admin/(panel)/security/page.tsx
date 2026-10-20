import { MfaSetup } from "./mfa-setup";

export default function Page() {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold">Security</h1>
      <MfaSetup />
    </div>
  );
}
