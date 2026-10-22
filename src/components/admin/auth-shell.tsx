import Link from "next/link";
import { ArrowLeft, History, ShieldCheck, Zap } from "lucide-react";

const GRID = {
  backgroundImage:
    "linear-gradient(rgba(255,255,255,.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.05) 1px, transparent 1px)",
  backgroundSize: "3rem 3rem",
};

const points = [
  { icon: ShieldCheck, text: "Two-factor sign-in and rate-limited logins" },
  { icon: History, text: "Every change recorded in the audit log" },
  { icon: Zap, text: "Edits go live on your site instantly" },
];

export function AuthShell({
  icon: Icon, title, subtitle, children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <main className="grid min-h-dvh bg-neutral-50 text-neutral-900 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
      <aside className="relative hidden overflow-hidden bg-[#0A0A0F] p-12 text-[#F2F2F5] lg:flex lg:flex-col lg:justify-between">
        <div aria-hidden className="absolute inset-0" style={GRID} />
        <div aria-hidden className="absolute -left-32 -top-32 h-[28rem] w-[28rem] rounded-full bg-[#C6F432]/15 blur-3xl" />
        <div className="relative flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#C6F432] text-[#0A0A0F]"><ShieldCheck className="h-5 w-5" /></span>
          <span className="text-lg font-semibold tracking-tight">Portfolio Admin</span>
        </div>
        <div className="relative max-w-md">
          <h2 className="text-4xl font-bold leading-tight tracking-tight xl:text-5xl">
            Your portfolio,<br /><span className="text-[#C6F432]">under your control.</span>
          </h2>
          <ul className="mt-8 flex flex-col gap-4">
            {points.map(({ icon: P, text }) => (
              <li key={text} className="flex items-center gap-3 text-[#B9B9C8]">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5"><P className="h-4 w-4 text-[#C6F432]" /></span>
                {text}
              </li>
            ))}
          </ul>
        </div>
        <p className="relative text-sm text-[#7d7d90]">Private area. Authorised access only.</p>
      </aside>

      <section className="flex flex-col px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(1.5rem,env(safe-area-inset-top))] sm:px-8">
        <div className="flex items-center justify-between lg:justify-end">
          <span className="flex items-center gap-2 font-semibold lg:hidden">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0A0A0F] text-[#C6F432]"><ShieldCheck className="h-4 w-4" /></span>
            Portfolio Admin
          </span>
          <Link href="/" className="inline-flex min-h-11 items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-900">
            <ArrowLeft className="h-4 w-4" />Back to site
          </Link>
        </div>

        <div className="flex flex-1 items-center justify-center py-8">
          <div className="w-full max-w-sm">
            <span className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0A0A0F] text-[#C6F432]"><Icon className="h-6 w-6" /></span>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
            <p className="mt-2 text-sm text-neutral-500">{subtitle}</p>
            <div className="mt-8">{children}</div>
          </div>
        </div>
      </section>
    </main>
  );
}
