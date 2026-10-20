"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { label: "Dashboard", href: "/admin" },
  { label: "Profile & SEO", href: "/admin/profile" },
  { label: "Section builder", href: "/admin/sections" },
  { label: "Tools", href: "/admin/tools" }, { label: "Skills", href: "/admin/skills" }, { label: "Experience", href: "/admin/experience" },
  { label: "Education", href: "/admin/education" }, { label: "Achievements", href: "/admin/achievements" }, { label: "Projects", href: "/admin/projects" },
  { label: "Testimonials", href: "/admin/testimonials" }, { label: "Media library", href: "/admin/media" }, { label: "Inbox", href: "/admin/inbox" },
  { label: "Settings" },
];

export function AdminNav() {
  const path = usePathname();
  return (
    <nav className="flex flex-col gap-1">
      {items.map((i) => {
        if (!i.href)
          return (
            <span key={i.label} className="flex justify-between rounded-lg px-3 py-2 text-sm text-neutral-500">
              {i.label}<span className="text-[10px] uppercase">soon</span>
            </span>
          );
        const active = path === i.href;
        return (
          <Link
            key={i.label}
            href={i.href}
            className={`rounded-lg px-3 py-2 text-sm transition-colors ${
              active ? "bg-[#1E2040] text-white" : "text-neutral-300 hover:bg-white/5"
            }`}
          >
            {i.label}
          </Link>
        );
      })}
    </nav>
  );
}
