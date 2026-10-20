import { useEffect, useMemo } from "react";

import HeroSection from "@/components/HeroSection";
import AboutUsSection from "@/components/AboutUsSection";
import EventsSection from "@/components/EventsSection";
import CouncilSection from "@/components/CouncilSection";
import Footer from "@/components/Footer";
import ScrollReveal from "@/components/ScrollReveal";
import { useSEO } from "@/hooks/useSEO";

export default function Home() {
  const jsonLd = useMemo(() => ({
    "@type": "Organization",
    "name": "Kaziranga House",
    "description": "Kaziranga House is a student community at IIT Madras BS Degree programme with over 5,000 members. We organize meetups, events, and provide study resources.",
    "url": "https://kaziranga-house.vercel.app",
    "logo": "https://kaziranga-house.vercel.app/logo.png",
    "sameAs": [
      "https://www.instagram.com/kaziranga_iitm/",
      "http://www.youtube.com/@KazirangaHouse",
      "https://www.linkedin.com/company/kaziranga-iitm",
      "https://linktr.ee/KazirangaHouseBS"
    ]
  }), []);

  useSEO({
    title: "Kaziranga House — IIT Madras BS Degree",
    description: "Official website of Kaziranga House, IIT Madras BS Degree. Explore meetups, events, study resources, house council, gallery, and creative content from 5,000+ members.",
    path: "/",
    jsonLd,
  });

  useEffect(() => {
    const target = sessionStorage.getItem("scrollTarget");
    if (target) {
      sessionStorage.removeItem("scrollTarget");
      setTimeout(() => {
        const el = document.getElementById(target);
        if (el) {
          const navHeight = 90;
          const top = el.getBoundingClientRect().top + window.scrollY - navHeight;
          window.scrollTo({ top, behavior: "smooth" });
        }
      }, 100);
    }
  }, []);

  return (
    <div className="min-h-screen flex flex-col selection:bg-[#1e5631]/30 selection:text-white">

      <main className="flex-grow">
        {/* HERO & ABOUT WRAPPER — Confines the stack scroll effect */}
        <div className="relative z-10 bg-black">
          <HeroSection />

          {/* DARK ZONE — Hero seamlessly blends into About Us */}
          <ScrollReveal delay={0} className="relative z-20">
            <AboutUsSection />
          </ScrollReveal>
        </div>

        {/* CREAM ZONE — Council + Events share warm tone */}
        <ScrollReveal delay={0}>
          <CouncilSection />
        </ScrollReveal>

        <ScrollReveal delay={0}>
          <EventsSection />
        </ScrollReveal>
      </main>

      <ScrollReveal delay={0} distance={24}>
        <Footer />
      </ScrollReveal>
    </div>
  );
}
