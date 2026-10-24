import { createLowlight, common } from "lowlight";
import { toHtml } from "hast-util-to-html";

const lowlight = createLowlight(common);

const unescape = (s: string) =>
  s.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;|&#x27;/g, "'").replace(/&amp;/g, "&");

// turns saved <pre><code> blocks into highlighted ones; runs on the server at render time,
// so existing posts get highlighting without re-saving
export function highlightCode(html: string): string {
  return html.replace(
    /<pre([^>]*)><code(?: class="([^"]*)")?>([\s\S]*?)<\/code><\/pre>/g,
    (whole, preAttrs: string, cls: string | undefined, body: string) => {
      const lang = cls?.match(/language-([\w+#-]+)/)?.[1];
      if (lang === "mermaid") return whole; // drawn in the browser
      try {
        const code = unescape(body);
        const tree = lang && lowlight.registered(lang) ? lowlight.highlight(lang, code) : lowlight.highlightAuto(code);
        return `<pre${preAttrs}${lang ? ` data-lang="${lang}"` : ""}><code class="hljs">${toHtml(tree)}</code></pre>`;
      } catch {
        return whole;
      }
    }
  );
}
