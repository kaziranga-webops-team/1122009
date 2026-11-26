import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

/** Every crawler, AI crawlers included, may read the public site; the portal and its API stay out of results. */
export default function robots(): MetadataRoute.Robots {
  const disallow = ["/admin", "/super-admin", "/dashboard", "/api/", "/login", "/access-denied"];
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow },
      ...["GPTBot", "ChatGPT-User", "PerplexityBot", "Google-Extended", "Amazonbot", "ClaudeBot", "anthropic-ai"].map((userAgent) => ({ userAgent, allow: "/", disallow })),
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
