
import StudySection from "@/components/StudySection";
import Footer from "@/components/Footer";
import ScrollReveal from "@/components/ScrollReveal";
import { useSEO } from "@/hooks/useSEO";
import { useMemo } from "react";

export default function StudyPage() {
  const jsonLd = useMemo(() => ({
    "@type": "WebPage",
    "name": "Study Zone — Kaziranga House",
    "description": "Academic resources, course planners, and discussion forums for IIT Madras BS Degree students in Data Science and Electronic Systems.",
    "isPartOf": { "@type": "WebSite", "name": "Kaziranga House", "url": "https://kaziranga-house.vercel.app" },
  }), []);

  useSEO({
    title: "Study Zone — Academic Resources & Course Planner",
    description: "Access curated study resources, course planners, and the Discourse forum for IIT Madras BS Degree students. Covers both Data Science and Electronic Systems programmes.",
    path: "/study",
    jsonLd,
  });

  return (
    <div className="min-h-screen flex flex-col selection:bg-[#1e5631]/30 selection:text-white">

      <main className="flex-grow">
        <ScrollReveal delay={0}>
          <StudySection />
        </ScrollReveal>
      </main>
      <ScrollReveal delay={0} distance={24}>
        <Footer />
      </ScrollReveal>
    </div>
  );
}
