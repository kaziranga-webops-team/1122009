"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  BookOpen, 
  ExternalLink, 
  ClipboardList, 
  BarChart3, 
  Users, 
  FileText, 
  FileCheck,
  ArrowRight,
  GraduationCap,
  Cpu,
  Calendar,
  MessageSquare,
  Globe,
  Link as LinkIcon,
  Video,
  Mic,
  Loader2,
  type LucideIcon,
} from "lucide-react";
import { useContent } from "@/hooks/useData";
export type StudyLink = {
  id: string;
  label: string;
  url: string;
  description: string;
  icon: string;
  tag?: string;
  section: "portal" | "guide";
  dept: "ds" | "es" | "all";
};

// ─── Lucide Icon Resolver ────────────────────────────────────────────
// Maps the icon name string stored in Firebase to the actual Lucide component.
const ICON_MAP: Record<string, LucideIcon> = {
  BookOpen,
  ClipboardList,
  BarChart3,
  Calendar,
  MessageSquare,
  FileText,
  FileCheck,
  Users,
  ExternalLink,
  Globe,
  Cpu,
  GraduationCap,
  Link: LinkIcon,
  Video,
  Mic,
};

function resolveIcon(iconName?: string): LucideIcon {
  if (!iconName) return BookOpen;
  return ICON_MAP[iconName] || BookOpen;
}

// ─── Static community CTA (not part of the portal/guide schema) ─────
const COMMUNITY = {
  label: "Join Study Circle",
  url: "https://forms.gle/kKBmVCAu8UwtpcpN8",
  icon: Users,
  description: "Join the Kaziranga Study Group to connect with peers across houses. Collaborate on assignments, review course materials, and prepare for exams together.",
  badge: "COLLABORATION"
};

export default function StudySection() {
  const { data: content } = useContent();
  const studyData = content?.study;
  const [activeDept, setActiveDept] = useState<"ds" | "es">("ds");
  const [links, setLinks] = useState<StudyLink[]>([]);
  const [loadingLinks, setLoadingLinks] = useState(true);

  // Temporarily stubbed while admin portal is rebuilt
  useEffect(() => {
    setLinks([]);
    setLoadingLinks(false);
  }, []);

  // Derive portals (section === "portal") filtered by active dept
  const activePortals = useMemo(() => {
    return links
      .filter((l) => l.section === "portal")
      .filter((l) => l.dept === "all" || l.dept === activeDept);
  }, [links, activeDept]);

  // Derive guides (section === "guide") filtered by active dept
  const activeGuides = useMemo(() => {
    return links
      .filter((l) => l.section === "guide")
      .filter((l) => l.dept === "all" || l.dept === activeDept);
  }, [links, activeDept]);

  return (
    <section id="study" className="py-20 md:py-28 relative overflow-hidden font-sans">
      {/* Immersive organic nature background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#eae4ce] via-[#e8e2cc] to-[#f0ead4] dark:from-[#081e11] dark:via-[#05130b] dark:to-[#020a06] transition-colors duration-500" />
      
      {/* Glowing blur effects */}
      <div className="absolute top-10 left-10 w-[300px] h-[300px] bg-[#1e5631]/10 dark:bg-[#6fcf97]/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[400px] h-[400px] bg-amber-500/5 dark:bg-[#1e5631]/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Subtle organic background pattern */}
      <div className="absolute inset-0 opacity-[0.015] dark:opacity-[0.03] bg-[radial-gradient(#1e5631_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />

      <div className="container mx-auto px-4 md:px-6 relative z-10">
        {studyData?.sectionImage && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mb-12 rounded-2xl overflow-hidden shadow-lg max-w-3xl mx-auto border border-[#1e5631]/10 dark:border-emerald-500/10"
          >
            <img src={studyData.sectionImage} alt={studyData.sectionTitle} className="w-full h-48 md:h-64 object-cover" />
          </motion.div>
        )}

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#1e5631]/10 dark:bg-[#6fcf97]/15 text-[#1e5631] dark:text-[#6fcf97] border border-[#1e5631]/20 dark:border-[#6fcf97]/20 font-extrabold text-[10px] tracking-widest uppercase mb-4 shadow-sm">
            <GraduationCap size={14} className="animate-bounce" />
            <span>Academic Hub</span>
          </div>
          
          <h2 className="text-4xl md:text-5xl font-serif font-bold text-[#1a3a1a] dark:text-white mb-4 section-title tracking-tight">
            Study Zone
          </h2>

          {/* Premium Divider */}
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="w-12 h-[1px] bg-gradient-to-r from-transparent to-[#1e5631]/30 dark:to-[#6fcf97]/30" />
            <div className="w-2.5 h-2.5 rounded-full bg-[#1e5631] dark:bg-[#6fcf97] animate-pulse ring-4 ring-[#1e5631]/20 dark:ring-[#6fcf97]/20" />
            <div className="w-12 h-[1px] bg-gradient-to-l from-transparent to-[#1e5631]/30 dark:to-[#6fcf97]/30" />
          </div>

          <p className="text-base md:text-lg text-[#4a6741] dark:text-emerald-300/70 max-w-2xl mx-auto font-medium leading-relaxed">
            {studyData?.sectionSubtitle || "Quick access to all essential study resources for the IITM BS Degree."}
          </p>
        </motion.div>

        {/* Department Switcher — centered below description */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.45, delay: 0.1 }}
          className="flex justify-center mb-12"
        >
          <div className="flex p-1.5 rounded-2xl bg-white/70 dark:bg-[#0c2314]/80 border border-[#1e5631]/10 dark:border-white/10 shadow-sm">
            <button
              onClick={() => setActiveDept("ds")}
              className={`flex items-center gap-2 px-5 py-2 text-[10px] font-extrabold uppercase tracking-wider rounded-xl transition-all duration-300 ${
                activeDept === "ds"
                  ? "bg-[#1e5631] text-white shadow-md shadow-[#1e5631]/25 dark:bg-[#6fcf97] dark:text-[#081e11] dark:shadow-[#6fcf97]/25"
                  : "text-[#5c7a52] dark:text-[#6fcf97]/60 hover:bg-[#1e5631]/5 dark:hover:bg-white/5"
              }`}
            >
              <BookOpen size={12} />
              <span>Data Science (DS)</span>
            </button>
            <button
              onClick={() => setActiveDept("es")}
              className={`flex items-center gap-2 px-5 py-2 text-[10px] font-extrabold uppercase tracking-wider rounded-xl transition-all duration-300 ${
                activeDept === "es"
                  ? "bg-[#1e5631] text-white shadow-md shadow-[#1e5631]/25 dark:bg-[#6fcf97] dark:text-[#081e11] dark:shadow-[#6fcf97]/25"
                  : "text-[#5c7a52] dark:text-[#6fcf97]/60 hover:bg-[#1e5631]/5 dark:hover:bg-white/5"
              }`}
            >
              <Cpu size={12} />
              <span>Electronic Systems (ES)</span>
            </button>
          </div>
        </motion.div>

        {/* Content Layout Grid */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="max-w-5xl mx-auto space-y-8"
        >

          {/* Loading state */}
          {loadingLinks && (
            <div className="flex items-center justify-center py-16">
              <Loader2 size={28} className="animate-spin text-[#1e5631]/30 dark:text-[#6fcf97]/30" />
            </div>
          )}

          {/* Empty state — no links in Firebase yet */}
          {!loadingLinks && links.length === 0 && (
            <div className="text-center py-16">
              <GraduationCap size={40} className="mx-auto text-[#1e5631]/20 dark:text-[#6fcf97]/20 mb-4" />
              <p className="text-sm text-[#5c7a52] dark:text-emerald-300/50 font-medium">Study links are being set up. Check back soon!</p>
            </div>
          )}

          {/* Main content — only render when links are loaded */}
          {!loadingLinks && links.length > 0 && (
          <>
          {/* Top Row: Asymmetric split (Portals on Left / Handbooks on Right) */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            
            {/* Left Block: Core Portals - Spans 3/5 width */}
            <div className="lg:col-span-3 space-y-4">
              <h3 className="text-xs font-bold tracking-widest text-[#4a6741] dark:text-emerald-400/60 uppercase pl-1 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#1e5631] dark:bg-[#6fcf97]" />
                Core Academic Portals
              </h3>
              
              <div className="relative">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={`portals-${activeDept}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-1 gap-4"
                  >
                    {activePortals.map((portal) => {
                      const Icon = resolveIcon(portal.icon);
                      return (
                        <motion.a
                          key={portal.id || portal.label}
                          href={portal.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          initial={{ opacity: 0, y: 16 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, ease: "easeOut" }}
                          whileHover={{ 
                            y: -6,
                            transition: { duration: 0.2, ease: "easeOut" }
                          }}
                          className="group block relative p-5 rounded-2xl bg-white dark:bg-[#0c2314] border border-[#1e5631]/20 dark:border-[#1e5631]/40 hover:border-[#1e5631]/40 dark:hover:border-[#6fcf97]/40 shadow-[0_4px_24px_-4px_rgba(30,86,49,0.12)] dark:shadow-[0_4px_30px_-4px_rgba(0,0,0,0.3)] hover:shadow-[0_16px_36px_-12px_rgba(30,86,49,0.15)] dark:hover:shadow-[0_16px_36px_-12px_rgba(16,185,129,0.2)] transition-all duration-300"
                        >
                          {/* Premium Card Glow Overlay */}
                          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/0 via-emerald-500/0 to-emerald-500/[0.03] dark:to-emerald-400/[0.02] opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-2xl" />

                          <div className="relative z-10 flex items-start gap-4">
                            {/* Icon Container */}
                            <div className="relative w-12 h-12 flex items-center justify-center flex-shrink-0">
                              <div className="absolute inset-0 rounded-xl bg-[#1e5631]/5 dark:bg-[#6fcf97]/5 border border-[#1e5631]/10 dark:border-[#6fcf97]/10 group-hover:scale-110 group-hover:border-[#1e5631]/20 dark:group-hover:border-[#6fcf97]/20 transition-transform duration-300" />
                              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950 dark:to-emerald-900/40 flex items-center justify-center text-[#1e5631] dark:text-[#6fcf97] border border-emerald-500/10 dark:border-emerald-400/5 group-hover:from-[#1e5631] group-hover:to-[#2e8b57] dark:group-hover:from-[#6fcf97] dark:group-hover:to-[#3cb371] group-hover:text-white dark:group-hover:text-[#081e11] transition-all duration-300 shadow-sm">
                                <Icon size={18} className="group-hover:rotate-6 transition-transform duration-300" />
                              </div>
                            </div>

                            <div className="flex-grow min-w-0 pr-1">
                              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                                <span className="font-extrabold text-[15px] tracking-tight text-[#1a3a1a] dark:text-emerald-100 group-hover:text-[#1e5631] dark:group-hover:text-[#6fcf97] transition-colors leading-snug">
                                  {portal.label}
                                </span>
                                <span className="text-[9px] px-2 py-0.5 rounded-full font-extrabold tracking-wider bg-[#1e5631]/10 dark:bg-[#6fcf97]/10 text-[#1e5631] dark:text-[#6fcf97] border border-[#1e5631]/15 dark:border-[#6fcf97]/15">
                                  {portal.tag}
                                </span>
                              </div>
                              <p className="text-xs text-[#5c7a52] dark:text-emerald-300/50 leading-relaxed font-medium">
                                {portal.description}
                              </p>
                            </div>
                            
                            <div className="self-center p-1.5 rounded-lg text-emerald-600/35 dark:text-emerald-400/25 group-hover:text-[#1e5631] dark:group-hover:text-[#6fcf97] group-hover:translate-x-1 group-hover:-translate-y-0.5 transition-all duration-300">
                              <ExternalLink size={15} />
                            </div>
                          </div>
                        </motion.a>
                      );
                    })}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>

            {/* Right Block: Official Handbooks & Grading - Spans 2/5 width */}
            <div className="lg:col-span-2 space-y-5">
              <h3 className="text-xs font-bold tracking-widest text-[#4a6741] dark:text-emerald-400/60 uppercase pl-1 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                Guides & Policy Docs
              </h3>
              
              <div className="relative">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={`guides-${activeDept}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-4"
                  >
                    {activeGuides.map((guide) => {
                      const Icon = resolveIcon(guide.icon);
                      return (
                        <motion.a
                          key={guide.id || guide.label}
                          href={guide.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          initial={{ opacity: 0, y: 16 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, ease: "easeOut" }}
                          whileHover={{ 
                            y: -6,
                            transition: { duration: 0.2, ease: "easeOut" }
                          }}
                          className="group block relative p-6 rounded-2xl bg-white dark:bg-[#0c2314] border border-[#1e5631]/20 dark:border-[#1e5631]/40 hover:border-amber-500/30 dark:hover:border-amber-400/30 shadow-[0_4px_24px_-4px_rgba(30,86,49,0.12)] dark:shadow-[0_4px_30px_-4px_rgba(0,0,0,0.3)] hover:shadow-[0_16px_36px_-12px_rgba(217,119,6,0.15)] dark:hover:shadow-[0_16px_36px_-12px_rgba(217,119,6,0.1)] transition-all duration-300 min-h-[140px]"
                        >
                          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/0 via-amber-500/0 to-amber-500/[0.03] dark:to-amber-400/[0.02] opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-2xl" />

                          <div className="relative z-10 flex flex-col justify-between h-full">
                            <div>
                              {/* Icon Container */}
                              <div className="relative w-10 h-10 flex items-center justify-center flex-shrink-0 mb-4">
                                <div className="absolute inset-0 rounded-xl bg-amber-500/5 dark:bg-amber-400/5 border border-amber-500/10 dark:border-amber-400/10 group-hover:scale-110 group-hover:border-amber-500/20 transition-transform duration-300" />
                                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950 dark:to-amber-900/40 flex items-center justify-center text-amber-700 dark:text-amber-400 border border-amber-500/10 group-hover:from-amber-600 group-hover:to-amber-500 group-hover:text-white dark:group-hover:from-amber-500 dark:group-hover:to-amber-400 dark:group-hover:text-amber-950 transition-all duration-300 shadow-sm">
                                  <Icon size={16} className="group-hover:rotate-6 transition-transform duration-300" />
                                </div>
                              </div>

                              <span className="font-extrabold text-[15px] tracking-tight text-[#1a3a1a] dark:text-amber-100 group-hover:text-amber-800 dark:group-hover:text-amber-300 transition-colors leading-snug block mb-1.5">
                                {guide.label}
                              </span>
                              <p className="text-xs text-[#5c7a52] dark:text-emerald-300/50 leading-relaxed font-medium">
                                {guide.description}
                              </p>
                            </div>

                            <div className="flex items-center gap-1.5 mt-4 text-[10px] font-extrabold tracking-wider uppercase text-amber-700/60 dark:text-amber-400/50 group-hover:text-amber-800 dark:group-hover:text-amber-300 transition-colors">
                              <span>View Document</span>
                              <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
                            </div>
                          </div>
                        </motion.a>
                      );
                    })}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>

          </div>
          </>
          )}

          {/* Bottom Row: Study Circle Spotlight */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="w-full"
          >
            <a
              href={COMMUNITY.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group block relative p-8 md:p-10 rounded-3xl overflow-hidden border border-[#1e5631]/20 dark:border-[#1e5631]/30 hover:border-[#1e5631]/40 dark:hover:border-[#6fcf97]/40 bg-gradient-to-br from-white/70 via-[#f4f0e2]/30 to-[#1e5631]/5 dark:from-[#0c2516]/80 dark:via-[#07190f]/90 dark:to-[#040f09]/80 shadow-sm hover:shadow-[0_20px_50px_rgba(16,185,129,0.15)] dark:hover:shadow-[0_20px_50px_rgba(16,185,129,0.1)] transition-all duration-500 hover:scale-[1.005]"
            >
              {/* Corner Ambient Glow */}
              <div className="absolute right-0 bottom-0 w-80 h-80 bg-gradient-to-tl from-[#1e5631]/10 to-teal-500/0 dark:from-[#6fcf97]/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
              
              {/* Ghost icon */}
              <div className="absolute right-0 bottom-0 top-0 w-1/3 opacity-[0.03] dark:opacity-[0.05] pointer-events-none flex items-center justify-center">
                <COMMUNITY.icon size={260} className="text-[#1e5631] dark:text-[#6fcf97] group-hover:scale-105 transition-transform duration-700" />
              </div>

              <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div className="space-y-3 max-w-2xl">
                  {/* Pulsing Badge */}
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-[#1e5631]/10 dark:bg-[#6fcf97]/10 text-[#1e5631] dark:text-[#6fcf97] border border-[#1e5631]/20 dark:border-[#6fcf97]/20 font-black text-[9px] tracking-widest uppercase">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#1e5631] dark:bg-[#6fcf97] animate-ping" />
                    <span>{COMMUNITY.badge}</span>
                  </div>
                  
                  <h4 className="text-2xl font-serif font-bold text-[#1a3a1a] dark:text-emerald-100 group-hover:text-[#1e5631] dark:group-hover:text-[#6fcf97] transition-colors leading-snug">
                    {COMMUNITY.label}
                  </h4>
                  
                  <p className="text-xs md:text-[13px] text-[#4a6741] dark:text-emerald-300/70 leading-relaxed font-medium whitespace-pre-line">
                    {COMMUNITY.description}
                  </p>
                </div>

                <div className="flex-shrink-0">
                  <div className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-[#1e5631] dark:bg-[#6fcf97] text-white dark:text-[#081e11] font-extrabold text-sm shadow-md hover:bg-[#153e22] dark:hover:bg-[#5bbf83] hover:shadow-[0_0_20px_rgba(111,207,151,0.4)] group-hover:scale-[1.03] transition-all duration-300">
                    <span>Join Study Circle</span>
                    <ArrowRight size={16} className="group-hover:translate-x-1.5 transition-transform duration-300" />
                  </div>
                </div>
              </div>
            </a>
          </motion.div>

        </motion.div>
      </div>
    </section>
  );
}
