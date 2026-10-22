import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-[#0A0A0F] px-6 text-center text-[#F2F2F5]">
      <p className="font-mono text-sm uppercase tracking-widest text-[#C6F432]">Error 404</p>
      <h1 className="text-5xl font-bold tracking-tight sm:text-7xl">Page not found</h1>
      <p className="max-w-md text-[#9A9AAE]">The page you’re looking for doesn’t exist, or it has moved.</p>
      <Link href="/" className="inline-flex min-h-11 items-center rounded-full bg-[#C6F432] px-6 font-semibold text-[#0A0A0F]">Back to home</Link>
    </main>
  );
}
