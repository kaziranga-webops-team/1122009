
import ReelSection from "@/components/ReelSection";
import Footer from "@/components/Footer";
import ScrollReveal from "@/components/ScrollReveal";
import { useSEO } from "@/hooks/useSEO";
import { useMemo } from "react";

export default function TakPage() {
  const jsonLd = useMemo(() => ({
    "@type": "WebPage",
    "name": "Kaziranga Tak — Short Videos & Creative Content",
    "description": "Watch short-form video reels and creative content from Kaziranga House members at IIT Madras BS Degree.",
    "isPartOf": { "@type": "WebSite", "name": "Kaziranga House", "url": "https://kaziranga-house.vercel.app" },
  }), []);

  useSEO({
    title: "Kaziranga Tak — Short Videos & Reels",
    description: "Watch short-form video reels, creative content, and behind-the-scenes moments from Kaziranga House members at IIT Madras BS Degree.",
    path: "/tak",
    jsonLd,
  });

  return (
    <div className="min-h-screen flex flex-col selection:bg-[#1e5631]/30 selection:text-white bg-[#050505]">

      <main className="flex-grow">
        <ScrollReveal delay={0}>
          <ReelSection />
        </ScrollReveal>
      </main>
      <ScrollReveal delay={0} distance={24}>
        <Footer />
      </ScrollReveal>
    </div>
  );
}
