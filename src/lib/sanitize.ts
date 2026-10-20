import sanitizeHtml from "sanitize-html";

export function cleanHtml(html: string) {
  return sanitizeHtml(html, {
    allowedTags: [...sanitizeHtml.defaults.allowedTags, "img", "iframe", "input", "label", "colgroup", "col"],
    allowedAttributes: {
      a: ["href", "target", "rel"],
      img: ["src", "alt", "title", "width", "height", "loading"],
      iframe: ["src", "width", "height", "allow", "allowfullscreen", "frameborder"],
      input: ["type", "checked", "disabled"],
      ul: ["data-type"],
      li: ["data-type", "data-checked"],
      div: ["data-youtube-video"],
      td: ["colspan", "rowspan", "colwidth"],
      th: ["colspan", "rowspan", "colwidth"],
      mark: ["data-color", "style"],
      pre: ["class"],
      code: ["class"],
      span: ["class"],
      p: ["style"], h1: ["style"], h2: ["style"], h3: ["style"], h4: ["style"],
    },
    allowedStyles: {
      "*": {
        "text-align": [/^(left|right|center|justify)$/],
        "background-color": [/^#[0-9a-f]{3,8}$/i, /^rgba?\([\d\s.,%]+\)$/i],
      },
    },
    allowedSchemes: ["http", "https", "mailto", "tel"],
    allowedIframeHostnames: ["www.youtube.com", "www.youtube-nocookie.com", "youtube.com", "youtube-nocookie.com"],
    transformTags: {
      a: (tag, attribs) => ({
        tagName: "a",
        attribs: { ...attribs, rel: "noopener noreferrer nofollow", target: "_blank" },
      }),
    },
  });
}
