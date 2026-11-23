"use client";

import { useEffect, useState } from "react";

/** Formatting the event editor produces; everything else is unwrapped or dropped. */
const ALLOWED = new Set([
  "P", "BR", "STRONG", "B", "EM", "I", "U", "S", "UL", "OL", "LI", "A",
  "H1", "H2", "H3", "H4", "BLOCKQUOTE", "CODE", "PRE", "SPAN", "DIV", "HR",
]);
/** Removed with everything inside them. */
const DROP = new Set(["SCRIPT", "STYLE", "IFRAME", "OBJECT", "EMBED", "TEMPLATE", "NOSCRIPT", "SVG", "MATH", "FORM", "INPUT", "BUTTON", "TEXTAREA", "SELECT", "LINK", "META", "BASE"]);

/**
 * Cleans HTML written in the portal before it is shown to members: only plain
 * formatting survives, links keep a web or email address and open in a new
 * tab, and no attribute (style, onclick, src, …) gets through. Browser only.
 */
export function sanitizeHtml(html: string): string {
  const doc = new DOMParser().parseFromString(`<div>${html || ""}</div>`, "text/html");
  const root = doc.body.firstElementChild as HTMLElement;

  const clean = (node: Element) => {
    for (const child of Array.from(node.children)) {
      if (DROP.has(child.tagName)) {
        child.remove();
        continue;
      }
      clean(child);
      if (!ALLOWED.has(child.tagName)) {
        child.replaceWith(...Array.from(child.childNodes));
        continue;
      }
      const href = child.tagName === "A" ? child.getAttribute("href") ?? "" : "";
      for (const attr of Array.from(child.attributes)) child.removeAttribute(attr.name);
      if (child.tagName === "A") {
        if (/^(https?:|mailto:)/i.test(href.trim())) {
          child.setAttribute("href", href.trim());
          child.setAttribute("target", "_blank");
          child.setAttribute("rel", "noopener noreferrer");
        }
      }
    }
  };
  clean(root);
  return root.innerHTML;
}

/** The text alone, for the first render on the server. */
const plain = (html: string) =>
  (html || "")
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();

/**
 * Safe HTML for `dangerouslySetInnerHTML`: escaped plain text first (so the
 * server and the first browser render match), then the cleaned formatting.
 */
export function useSafeHtml(html: string | undefined | null): { __html: string } {
  const [out, setOut] = useState(() => escapeText(plain(html ?? "")));
  useEffect(() => {
    setOut(sanitizeHtml(html ?? ""));
  }, [html]);
  return { __html: out };
}

function escapeText(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
