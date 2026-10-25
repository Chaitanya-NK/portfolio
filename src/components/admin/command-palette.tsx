"use client";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Command, CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { searchAdmin, type Hit } from "@/app/admin/search-actions";
import { logout } from "@/app/admin/actions";

const PAGES: [string, string][] = [
  ["Dashboard", "/admin"], ["Profile & SEO", "/admin/profile"], ["Section builder", "/admin/sections"],
  ["Tools", "/admin/tools"], ["Skills", "/admin/skills"], ["Experience", "/admin/experience"],
  ["Education", "/admin/education"], ["Achievements", "/admin/achievements"], ["Projects", "/admin/projects"],
  ["Testimonials", "/admin/testimonials"], ["Testimonial requests", "/admin/requests"], ["Blog posts", "/admin/blog"],
  ["Media library", "/admin/media"], ["Inbox", "/admin/inbox"], ["Analytics", "/admin/analytics"],
  ["Content checker", "/admin/checker"], ["Services", "/admin/services"], ["Notes", "/admin/notes"], ["Email signature", "/admin/signature"], ["Backup & restore", "/admin/backup"], ["Audit log", "/admin/audit"], ["Security", "/admin/security"], ["Settings", "/admin/settings"],
];

export function SearchButton({ compact }: { compact?: boolean }) {
  const fire = () => window.dispatchEvent(new Event("open-palette"));
  if (compact)
    return (
      <button onClick={fire} aria-label="Search" className="ml-auto mr-1 flex h-10 w-10 items-center justify-center rounded-md text-white hover:bg-white/10">
        <Search className="h-5 w-5" />
      </button>
    );
  return (
    <button onClick={fire} className="mx-1 flex h-10 items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-neutral-400 hover:bg-white/10">
      <Search className="h-4 w-4" />Search…
      <kbd className="ml-auto rounded border border-white/15 px-1.5 py-0.5 text-[10px]">⌘K</kbd>
    </button>
  );
}

export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<Hit[]>([]);

  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setOpen((o) => !o); }
    };
    const ext = () => setOpen(true);
    window.addEventListener("keydown", key);
    window.addEventListener("open-palette", ext);
    return () => { window.removeEventListener("keydown", key); window.removeEventListener("open-palette", ext); };
  }, []);

  useEffect(() => {
    if (!open) { setQ(""); setHits([]); return; }
    const term = q.trim();
    if (term.length < 2) { setHits([]); return; }
    let live = true;
    const t = setTimeout(async () => { const r = await searchAdmin(term); if (live) setHits(r); }, 200);
    return () => { live = false; clearTimeout(t); };
  }, [q, open]);

  const go = useCallback((href: string) => { setOpen(false); router.push(href); }, [router]);
  const groups = [...new Set(hits.map((h) => h.kind))];

  return (
    <CommandDialog open={open} onOpenChange={setOpen} title="Search" description="Jump to a screen or find your content">
      <Command>
      <CommandInput placeholder="Search screens and content…" value={q} onValueChange={setQ} />
      <CommandList>
        <CommandEmpty>No results.</CommandEmpty>
        <CommandGroup heading="Go to">
          {PAGES.map(([label, href]) => (
            <CommandItem key={href} value={label} onSelect={() => go(href)}>{label}</CommandItem>
          ))}
        </CommandGroup>
        <CommandGroup heading="Actions">
          <CommandItem value="New blog post" onSelect={() => go("/admin/blog/new")}>New blog post</CommandItem>
          <CommandItem value="Create testimonial request link" onSelect={() => go("/admin/requests")}>Create testimonial request link</CommandItem>
          <CommandItem value="View live site" onSelect={() => { setOpen(false); window.open("/", "_blank"); }}>View live site</CommandItem>
          <CommandItem value="View resume" onSelect={() => { setOpen(false); window.open("/resume", "_blank"); }}>View resume</CommandItem>
          <CommandItem value="Sign out" onSelect={() => { setOpen(false); logout(); }}>Sign out</CommandItem>
        </CommandGroup>
        {groups.map((g) => (
          <CommandGroup key={g} heading={g}>
            {hits.filter((h) => h.kind === g).map((h) => (
              <CommandItem key={`${h.kind}-${h.id}`} value={`${h.kind}-${h.id}`} forceMount onSelect={() => go(h.href)}>
                {h.title}
                {h.sub && <span className="ml-auto text-xs text-muted-foreground">{h.sub}</span>}
              </CommandItem>
            ))}
          </CommandGroup>
        ))}
      </CommandList>
      </Command>
    </CommandDialog>
  );
}
