import type { Metadata } from "next";
import Home from "@/components/pages/Home";

export const metadata: Metadata = {
  title: { absolute: "Kaziranga House — IIT Madras BS Degree" },
  description:
    "Official website of Kaziranga House, IIT Madras BS Degree. Explore meetups, events, study resources, house council, gallery, and creative content from 5,000+ members.",
  alternates: { canonical: "/" },
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Kaziranga House",
  description:
    "Kaziranga House is a student community at IIT Madras BS Degree programme with over 5,000 members. We organize meetups, events, and provide study resources.",
  url: "https://kaziranga-house.vercel.app",
  logo: "https://kaziranga-house.vercel.app/logo.png",
  sameAs: [
    "https://www.instagram.com/kaziranga_iitm/",
    "http://www.youtube.com/@KazirangaHouse",
    "https://www.linkedin.com/company/kaziranga-iitm",
    "https://linktr.ee/KazirangaHouseBS",
  ],
};

export default function Page() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
      />
      <Home />
    </>
  );
}
