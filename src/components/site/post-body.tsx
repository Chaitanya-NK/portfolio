"use client";
import { useEffect, useRef } from "react";

export function PostBody({ html, className = "" }: { html: string; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;

    root.querySelectorAll<HTMLElement>("pre").forEach((pre) => {
      if (pre.dataset.enhanced || pre.querySelector("code.language-mermaid")) return;
      pre.dataset.enhanced = "1";
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "code-copy";
      btn.textContent = "Copy";
      btn.setAttribute("aria-label", "Copy code to clipboard");
      btn.onclick = async () => {
        try {
          await navigator.clipboard.writeText(pre.querySelector("code")?.textContent ?? "");
          btn.textContent = "Copied!";
        } catch {
          btn.textContent = "Press Ctrl+C";
        }
        setTimeout(() => (btn.textContent = "Copy"), 1800);
      };
      pre.appendChild(btn);
    });

    const blocks = Array.from(root.querySelectorAll<HTMLElement>("pre > code.language-mermaid"));
    if (!blocks.length) return;
    let cancelled = false;
    (async () => {
      const mermaid = (await import("mermaid")).default;
      const dark = document.documentElement.getAttribute("data-theme") !== "light";
      mermaid.initialize({ startOnLoad: false, securityLevel: "strict", theme: dark ? "dark" : "default" });
      for (const [i, code] of blocks.entries()) {
        if (cancelled) return;
        const pre = code.parentElement;
        if (!pre || !pre.isConnected) continue;
        try {
          const { svg } = await mermaid.render(`mmd-${Date.now()}-${i}`, code.textContent ?? "");
          const box = document.createElement("div");
          box.className = "mermaid-box";
          box.innerHTML = svg;
          pre.replaceWith(box);
        } catch {
          pre.dataset.error = "1"; // leave the source text visible
        }
      }
    })();
    return () => { cancelled = true; };
  }, [html]);

  return <div ref={ref} className={`rich ${className}`} dangerouslySetInnerHTML={{ __html: html }} />;
}
