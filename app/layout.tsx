import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Kalam, Mukta, Yatra_One } from "next/font/google";
import Providers from "./providers";
import { SITE_DESCRIPTION, SITE_NAME, SITE_TITLE, SITE_URL } from "@/lib/site";

/**
 * The site's own faces, self-hosted by Next.js and preloaded with the page, so
 * the title is set in Yatra One from the first paint rather than swapping in
 * after a trip to Google. They are exposed as CSS variables that kz.css and
 * globals.css read.
 */
const yatra = Yatra_One({ weight: "400", subsets: ["latin"], variable: "--font-yatra", display: "swap" });
const mukta = Mukta({ weight: ["300", "400", "500", "600", "700"], subsets: ["latin"], variable: "--font-mukta", display: "swap" });
const kalam = Kalam({ weight: ["300", "400", "700"], subsets: ["latin"], variable: "--font-kalam", display: "swap" });

/**
 * The remaining Google faces, used by older parts of the site and the portal.
 * Loaded here rather than with an @import in globals.css: Next.js 16's bundler
 * drops remote @imports from CSS.
 */
const GOOGLE_FONTS_URL =
  "https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;0,800;1,400;1,500&family=Inter:wght@400;500;600;700&family=Caveat:wght@400;500;600;700&family=Montserrat:wght@400;500;600;700;800&display=swap";


export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_TITLE,
    template: "%s | Kaziranga House",
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  authors: [{ name: SITE_NAME }],
  alternates: { canonical: "/" },
  robots: {
    index: true,
    follow: true,
    "max-image-preview": "large",
    "max-snippet": -1,
    "max-video-preview": -1,
  },
  icons: { icon: "/logo.png", apple: "/logo.png" },
  // The share picture comes from app/opengraph-image.tsx (and twitter-image),
  // which Next.js adds to every page with its size and alt text.
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    locale: "en_IN",
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
};

export const viewport: Viewport = {
  themeColor: "#1e5631",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-scroll-behavior="smooth" className={`${yatra.variable} ${mukta.variable} ${kalam.variable}`}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="stylesheet" href={GOOGLE_FONTS_URL} />
      </head>
      <body>
        <Providers>{children}</Providers>

        {/* Fallback for crawlers/bots that cannot execute JavaScript */}
        <noscript>
          <div
            style={{
              maxWidth: 800,
              margin: "40px auto",
              padding: 20,
              fontFamily: "sans-serif",
              color: "#333",
            }}
          >
            <h1>Kaziranga House — IIT Madras BS Degree</h1>
            <p>
              Welcome to the official website of <strong>Kaziranga House</strong>,
              one of the student houses at IIT Madras BS Degree programme.
            </p>
            <nav>
              <a href="/">Home</a> | <a href="/gallery">Meetups &amp; Gallery</a> |{" "}
              <a href="/events">Events</a> | <a href="/council">House Council</a> |{" "}
              <a href="/study">Study Zone</a> | <a href="/tak">Kaziranga Tak</a>
            </nav>
          </div>
        </noscript>
      </body>
    </html>
  );
}
