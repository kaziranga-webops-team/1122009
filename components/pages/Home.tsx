"use client";

import { useEffect, useMemo } from "react";

import HeroSection from "@/components/HeroSection";
import AboutUsSection from "@/components/AboutUsSection";
import EventsSection from "@/components/EventsSection";
import CouncilSection from "@/components/CouncilSection";
import Footer from "@/components/Footer";
import ScrollReveal from "@/components/ScrollReveal";

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
        {/* Wrapper matches About's green so no other shade ever shows between the two */}
        <div className="relative z-10 bg-[#172b1e]">
          <HeroSection />

          {/* Wavy top edge of the About zone, in About's own color. It overlaps the
              hero's bottom and scrolls up with About (kept outside ScrollReveal so it
              is always visible). */}
          <svg
            aria-hidden="true"
            className="pointer-events-none relative z-20 -mb-px -mt-[7vh] block h-[7vh] w-full lg:-mt-[13vh] lg:h-[13vh]"
            viewBox="0 0 1440 160"
            preserveAspectRatio="none"
          >
            {/* Soft layer: the same S-curve as the front wave, shifted up 18 units */}
            <path
              d="M0,78 C180,46 300,30 440,30 C640,30 800,88 1000,88 C1180,88 1320,56 1440,38 L1440,160 L0,160 Z"
              fill="#1e5631"
              fillOpacity="0.16"
            />
            <path
              d="M0,78 C180,46 300,30 440,30 C640,30 800,88 1000,88 C1180,88 1320,56 1440,38"
              fill="none"
              stroke="#1e5631"
              strokeOpacity="0.28"
              vectorEffect="non-scaling-stroke"
            />
            {/* Front wave in About's green: crest left, trough centre-right, rising at the edge */}
            <path
              d="M0,96 C180,64 300,48 440,48 C640,48 800,106 1000,106 C1180,106 1320,74 1440,56 L1440,160 L0,160 Z"
              fill="#172b1e"
            />
          </svg>

          {/* DARK ZONE — About Us */}
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
