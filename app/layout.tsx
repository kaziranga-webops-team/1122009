import type { Metadata, Viewport } from "next";
import "./globals.css";
import Providers from "./providers";

/**
 * The Google-hosted faces (Yatra One, Mukta, Montserrat and the rest). Loaded
 * here rather than with an @import in globals.css: Next.js 16's bundler drops
 * remote @imports from CSS, so the fonts silently never downloaded.
 */
const GOOGLE_FONTS_URL =
  "https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;0,800;1,400;1,500&family=Inter:wght@400;500;600;700&family=Cinzel+Decorative:wght@400;700;900&family=Caveat:wght@400;500;600;700&family=Kalam:wght@300;400;700&family=Montserrat:wght@400;500;600;700;800&family=Mukta:wght@300;400;500;600;700&family=Yatra+One&display=swap";

const SITE_URL = "https://kaziranga-house.vercel.app";
const DESCRIPTION =
  "Kaziranga House is a student community at IIT Madras BS Degree. Explore meetups, events, study resources, house council, gallery, and Kaziranga Tak.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Kaziranga House — IIT Madras BS Degree",
    template: "%s | Kaziranga House",
  },
  description: DESCRIPTION,
  authors: [{ name: "Kaziranga House" }],
  alternates: { canonical: "/" },
  robots: {
    index: true,
    follow: true,
    "max-image-preview": "large",
    "max-snippet": -1,
    "max-video-preview": -1,
  },
  icons: { icon: "/logo.png", apple: "/logo.png" },
  openGraph: {
    type: "website",
    siteName: "Kaziranga House",
    title: "Kaziranga House — IIT Madras BS Degree",
    description: DESCRIPTION,
    url: SITE_URL,
    locale: "en_IN",
    images: [{ url: "/logo.png" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Kaziranga House — IIT Madras BS Degree",
    description: DESCRIPTION,
    images: ["/logo.png"],
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
    <html lang="en">
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
