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

  // The Resource hub and Notes became one Study zone; old links still land.
  async redirects() {
    return [
      { source: "/hub", destination: "/study", permanent: true },
      { source: "/hub/:path*", destination: "/study/:path*", permanent: true },
      { source: "/resources", destination: "/study/notes", permanent: true },
    ];
  },

  // Ported from the old vercel.json: let crawlers index everything and serve
  // sitemap.xml with the right content type.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Robots-Tag", value: "all" },
          // Browser protections for every page. No Cross-Origin-Opener-Policy:
          // Google sign-in opens a pop-up that has to talk back to the page.
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Content-Security-Policy", value: "frame-ancestors 'self'; base-uri 'self'; object-src 'none'" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
        ],
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
