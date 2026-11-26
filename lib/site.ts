/**
 * The site's public address, used for share previews, the sitemap and
 * canonical links. Set NEXT_PUBLIC_SITE_URL to pin it (a custom domain, say);
 * otherwise Vercel's production domain is used, so links never point at an
 * address that does not exist.
 */
const vercelProduction = process.env.VERCEL_PROJECT_PRODUCTION_URL;

export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || (vercelProduction ? `https://${vercelProduction}` : "https://1122009.vercel.app")
).replace(/\/+$/, "");

export const SITE_NAME = "Kaziranga House";
export const SITE_TITLE = "Kaziranga House — IIT Madras BS Degree";
export const SITE_DESCRIPTION =
  "Kaziranga House is a student community at IIT Madras BS Degree. Explore meetups, events, study resources, house council, gallery, and Kaziranga Tak.";
