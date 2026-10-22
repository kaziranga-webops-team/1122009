/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // The app uses plain <img> tags (not next/image), but allow common remote
  // image hosts in case next/image is adopted later.
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "drive.google.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },

  // Ported from the old vercel.json: let crawlers index everything and serve
  // sitemap.xml with the right content type.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [{ key: "X-Robots-Tag", value: "all" }],
      },
      {
        source: "/sitemap.xml",
        headers: [
          { key: "Content-Type", value: "application/xml; charset=utf-8" },
          {
            key: "Cache-Control",
            value: "public, max-age=86400, s-maxage=86400",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
