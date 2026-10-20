import { useEffect } from "react";

const SITE_URL = "https://kaziranga-house.vercel.app";
const SITE_NAME = "Kaziranga House";
const DEFAULT_IMAGE = `${SITE_URL}/logo.png`;

interface SEOConfig {
  title: string;
  description: string;
  path: string;
  image?: string;
  type?: string;
  jsonLd?: Record<string, unknown>;
}

/**
 * Manages all SEO-related <head> tags for a page.
 * Creates/updates meta tags on mount and cleans up on unmount
 * so each page has unique, crawlable metadata.
 */
export function useSEO({ title, description, path, image, type = "website", jsonLd }: SEOConfig) {
  useEffect(() => {
    const fullTitle = `${title} | ${SITE_NAME}`;
    const canonicalUrl = `${SITE_URL}${path}`;
    const ogImage = image || DEFAULT_IMAGE;

    // ── Document title ──────────────────────────────────────────
    const prevTitle = document.title;
    document.title = fullTitle;

    // ── Helper: create or update a <meta> tag ───────────────────
    const managedTags: HTMLElement[] = [];

    function setMeta(attr: string, key: string, content: string) {
      let el = document.querySelector(`meta[${attr}="${key}"]`) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(attr, key);
        document.head.appendChild(el);
        managedTags.push(el);
      }
      el.setAttribute("content", content);
    }

    function setLink(rel: string, href: string) {
      let el = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null;
      if (!el) {
        el = document.createElement("link");
        el.setAttribute("rel", rel);
        document.head.appendChild(el);
        managedTags.push(el);
      }
      el.setAttribute("href", href);
    }

    // ── Standard meta ───────────────────────────────────────────
    setMeta("name", "description", description);

    // ── Canonical ───────────────────────────────────────────────
    setLink("canonical", canonicalUrl);

    // ── Open Graph ──────────────────────────────────────────────
    setMeta("property", "og:title", fullTitle);
    setMeta("property", "og:description", description);
    setMeta("property", "og:url", canonicalUrl);
    setMeta("property", "og:image", ogImage);
    setMeta("property", "og:type", type);
    setMeta("property", "og:site_name", SITE_NAME);

    // ── Twitter Card ────────────────────────────────────────────
    setMeta("name", "twitter:title", fullTitle);
    setMeta("name", "twitter:description", description);
    setMeta("name", "twitter:image", ogImage);
    setMeta("name", "twitter:card", "summary_large_image");

    // ── JSON-LD Structured Data ─────────────────────────────────
    let ldScript: HTMLScriptElement | null = null;
    if (jsonLd) {
      ldScript = document.createElement("script");
      ldScript.type = "application/ld+json";
      ldScript.textContent = JSON.stringify({
        "@context": "https://schema.org",
        ...jsonLd,
      });
      document.head.appendChild(ldScript);
    }

    // ── Cleanup on unmount / page change ────────────────────────
    return () => {
      document.title = prevTitle;
      managedTags.forEach((tag) => tag.remove());
      if (ldScript) ldScript.remove();
    };
  }, [title, description, path, image, type, jsonLd]);
}
