"use client";
import { Suspense, useState } from "react";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { AdminNav } from "./admin-nav";
import { logout } from "@/app/admin/actions";

function Nav({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <Suspense fallback={<div className="h-96" />}>
      <AdminNav onNavigate={onNavigate} />
    </Suspense>
  );
}

function SignOut() {
  return (
    <form action={logout} className="mt-auto">
      <Button variant="outline" size="sm" className="w-full">Sign out</Button>
    </form>
  );
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="min-h-screen bg-neutral-100 text-neutral-900 lg:flex">
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between bg-[#14161A] px-4 lg:hidden">
        <strong className="text-white">Admin · Portfolio</strong>
        <Button
          variant="ghost" size="icon" aria-label="Open menu"
          className="text-white hover:bg-white/10 hover:text-white"
          onClick={() => setOpen(true)}
        >
          <Menu className="h-5 w-5" />
        </Button>
      </header>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="flex w-72 flex-col gap-4 overflow-y-auto border-0 bg-[#14161A] p-4 text-white">
          <SheetTitle className="sr-only">Menu</SheetTitle>
          <strong className="px-3 pt-2">Admin · Portfolio</strong>
          <Nav onNavigate={() => setOpen(false)} />
          <SignOut />
        </SheetContent>
      </Sheet>

      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col gap-6 overflow-y-auto bg-[#14161A] p-4 lg:flex">
        <strong className="px-3 pt-2 text-white">Admin · Portfolio</strong>
        <Nav />
        <SignOut />
      </aside>

      <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
    </div>
  );
}
