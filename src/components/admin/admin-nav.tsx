"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { label: "Dashboard", href: "/admin" },
  { label: "Profile & SEO", href: "/admin/profile" },
  { label: "Section builder", href: "/admin/sections" },
  { label: "Tools", href: "/admin/tools" },
  { label: "Skills", href: "/admin/skills" },
  { label: "Experience", href: "/admin/experience" },
  { label: "Education", href: "/admin/education" },
  { label: "Achievements", href: "/admin/achievements" },
  { label: "Projects", href: "/admin/projects" },
  { label: "Services", href: "/admin/services" },
  { label: "Testimonials", href: "/admin/testimonials" },
  { label: "Testimonial requests", href: "/admin/requests" },
  { label: "Blog posts", href: "/admin/blog" },
  { label: "Notes", href: "/admin/notes" },
  { label: "Media library", href: "/admin/media" },
  { label: "Inbox", href: "/admin/inbox" },
  { label: "Content checker", href: "/admin/checker" },
  { label: "Analytics", href: "/admin/analytics" },
  { label: "Audit log", href: "/admin/audit" },
  { label: "Backup & restore", href: "/admin/backup" },
  { label: "Security", href: "/admin/security" },
  { label: "Email signature", href: "/admin/signature" },
  { label: "Settings", href: "/admin/settings" },
];

export function AdminNav({ onNavigate }: { onNavigate?: () => void }) {
  const path = usePathname();
  return (
    <nav className="flex flex-col gap-1">
      {items.map((i) => {
        if (!i.href)
          return (
            <span key={i.label} className="flex justify-between rounded-lg px-3 py-2.5 text-sm text-neutral-500">
              {i.label}<span className="text-[10px] uppercase">soon</span>
            </span>
          );
        const active = i.href === "/admin" ? path === i.href : path.startsWith(i.href);
        return (
          <Link
            key={i.label}
            href={i.href}
            onClick={onNavigate}
            className={`rounded-lg px-3 py-2.5 text-sm transition-colors ${
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
