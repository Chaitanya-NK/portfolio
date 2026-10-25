"use client";
import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

export function ThemeToggle() {
  const [dark, setDark] = useState(true);

  useEffect(() => {
    setDark(document.documentElement.getAttribute("data-theme") !== "light");
  }, []);

  function toggle() {
    const next = dark ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    try { localStorage.setItem("site-theme", next); } catch {}
    setDark(!dark);
  }

  return (
    <button
      type="button"
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      onClick={toggle}
      className="flex h-11 w-11 items-center justify-center rounded-full border border-[color:var(--line)] bg-[color:var(--surface)] text-[color:var(--fg)] shadow-lg transition-colors hover:border-[color:var(--accent-ink)]"
    >
      {dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </button>
  );
}
