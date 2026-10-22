"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, ArrowUpRight } from "lucide-react";
import { useContent } from "@/hooks/useData";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { FaInstagram, FaWhatsapp, FaYoutube, FaLinkedin } from "react-icons/fa";
import { SiLinktree } from "react-icons/si";

export default function Navbar() {
  const { data: content } = useContent();
  const site = content?.site;
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchString = searchParams.toString();

  const scrollTo = (id: string) => {
    if (pathname !== "/") {
      sessionStorage.setItem("scrollTarget", id);
      router.push("/");
    } else {
      const el = document.getElementById(id);
      if (!el) return;
      const navHeight = 90;
      const top = el.getBoundingClientRect().top + window.scrollY - navHeight;
      window.scrollTo({ top, behavior: "smooth" });
    }
    setMenuOpen(false);
  };

  const navLinks: { label: string; path?: string; id?: string; type: "route" | "scroll" }[] = [
    { label: "Council", path: "/council", type: "route" },
    { label: "Events", path: "/events", type: "route" },
    { label: "Meetups", path: "/gallery?tab=meetups", type: "route" },
    { label: "Gallery", path: "/gallery?tab=images", type: "route" },
    { label: "Study Zone", path: "/study", type: "route" },
    { label: "Kaziranga Tak", path: "/tak", type: "route" },
  ];

  const socialLinks = [
    { icon: <FaInstagram size={18} />, url: "https://www.instagram.com/kaziranga_iitm/", label: "Instagram" },
    { icon: <FaWhatsapp size={18} />, url: "https://forms.gle/Ac5Zxwn21cRMeEcy8", label: "WhatsApp" },
    { icon: <FaYoutube size={18} />, url: "http://www.youtube.com/@KazirangaHouse", label: "YouTube" },
    { icon: <FaLinkedin size={18} />, url: "https://www.linkedin.com/company/kaziranga-iitm", label: "LinkedIn" },
    { icon: <SiLinktree size={18} />, url: "https://linktr.ee/KazirangaHouseBS", label: "Linktree" },
  ];

  const isHeroTransparent = pathname === "/" && !scrolled;

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 w-full transition-all duration-500 py-4 px-6 md:px-12 flex items-center justify-between border-b
          ${menuOpen 
            ? "bg-[#172b1e] border-white/5" 
            : isHeroTransparent
              ? "bg-transparent border-transparent"
              : "bg-[#172b1e]/95 backdrop-blur-md border-white/5 shadow-[0_4px_30px_rgba(0,0,0,0.5)]"
          }`}
      >
        {/* Brand Logo & Name */}
        <button
          data-testid="button-nav-home"
          onClick={() => {
            scrollTo("hero");
            setMenuOpen(false);
          }}
          className="flex items-center gap-4 group cursor-pointer z-50"
        >
          <div className={`w-9 h-9 rounded-full overflow-hidden flex-shrink-0 border transition-all duration-300 ${menuOpen || !isHeroTransparent ? "border-white/10 group-hover:border-white/30 group-hover:shadow-[0_0_15px_rgba(111,207,151,0.2)]" : "border-black/10 group-hover:border-black/30 group-hover:shadow-[0_0_15px_rgba(0,0,0,0.1)]"}`}>
            <img
              src="/logo.png"
              alt="Kaziranga House"
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            />
          </div>
          <span 
            className={`font-serif font-semibold text-base md:text-lg tracking-[0.2em] uppercase transition-colors duration-300 whitespace-nowrap ${menuOpen || !isHeroTransparent ? 'text-[#f5f0e1]' : 'text-black/90'}`}
          >
            {site?.name || "Kaziranga House"}
          </span>
        </button>

        {/* Menu Toggle Trigger (Harvard Style) */}
        <button
          data-testid="button-mobile-menu"
          className={`flex items-center gap-2 py-2.5 px-5 rounded-full border transition-all duration-300 cursor-pointer z-50 ${
            menuOpen || !isHeroTransparent 
              ? "text-[#f5f0e1] hover:text-white border-white/15 hover:border-white/40 hover:bg-white/5" 
              : "text-black/90 hover:text-black border-black/15 hover:border-black/40 hover:bg-black/5"
          }`}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          {menuOpen ? (
            <>
              <span className="text-xs font-bold uppercase tracking-[0.2em]">Close</span>
              <X size={18} />
            </>
          ) : (
            <>
              <span className="text-xs font-bold uppercase tracking-[0.2em]">Menu</span>
              <Menu size={18} />
            </>
          )}
        </button>
      </header>

      {/* Full-Screen Mega Menu Overlay (Harvard Style) */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: "-100%" }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: "-100%" }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 z-40 bg-[#172b1e] flex flex-col justify-start pt-28 md:pt-36 pb-16 px-6 md:px-16 overflow-y-auto"
          >
            <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-12 md:gap-16 my-auto">
              
              {/* Left Column: Navigation Links (Serif, Big, Stacked) */}
              <div className="lg:col-span-7 flex flex-col gap-6 md:gap-8">
                <nav className="flex flex-col gap-2">
                  {navLinks.map((link, i) => {
                    const isActive = (() => {
                      if (link.type !== "route") return false;
                      const linkPath = link.path!.split("?")[0];
                      if (pathname !== linkPath) return false;

                      if (pathname === "/gallery") {
                        const searchParams = new URLSearchParams(searchString);
                        const currentTab = searchParams.get("tab") || "meetups";
                        const linkUrl = new URL(link.path!, "http://dummy.com");
                        const linkTab = linkUrl.searchParams.get("tab");
                        return currentTab === linkTab;
                      }
                      return true;
                    })();

                    return (
                      <motion.div
                        key={link.label}
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 + 0.15 }}
                        className="overflow-hidden"
                      >
                        <Link
                          href={link.path!}
                          onClick={() => setMenuOpen(false)}
                          className={`group flex items-center justify-between py-2 text-2xl md:text-4xl font-serif font-bold border-b border-white/5 transition-all duration-300
                            ${isActive ? "text-white" : "text-[#f5f0e1]/80 hover:text-white"}`}
                        >
                          <span className="relative">
                            {link.label}
                            <span className="absolute -bottom-2 left-0 w-0 h-[3px] bg-white transition-all duration-300 group-hover:w-full"></span>
                          </span>
                          <ArrowUpRight 
                            size={24} 
                            className="opacity-0 group-hover:opacity-100 group-hover:translate-x-1 group-hover:-translate-y-1 transition-all duration-300 text-white" 
                          />
                        </Link>
                      </motion.div>
                    );
                  })}
                </nav>
              </div>

              {/* Right Column: Featured Call to Action (Editorial Style) */}
              <div className="lg:col-span-5 flex flex-col gap-6 md:gap-8">
                
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35 }}
                  className="bg-[#0A0A0A] rounded-3xl border border-white/5 p-8 flex flex-col justify-between h-full min-h-[280px] shadow-[0_10px_30px_rgba(0,0,0,0.5)]"
                >
                  <div>
                    <h3 className="font-serif font-bold text-xl md:text-2xl text-[#f5f0e1] mb-3">
                      Join the Forest
                    </h3>
                    <p className="text-sm text-[#f5f0e1]/70 leading-relaxed mb-6">
                      Become part of Kaziranga House. Connect, learn, and grow with a community of creators, leaders, and dreamers pushing beyond limits.
                    </p>
                  </div>
                  
                  <a
                    href="https://forms.gle/Ac5Zxwn21cRMeEcy8"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full text-center py-4 bg-[#1e5631] hover:bg-[#174726] border border-[#d4a853]/20 hover:border-[#d4a853]/40 text-[#f5f0e1] font-bold text-sm tracking-wider uppercase rounded-xl shadow-[0_4px_20px_rgba(30,86,49,0.25)] transition-all duration-300"
                  >
                    Apply Now
                  </a>
                </motion.div>
              </div>

            </div>

            {/* Bottom Footer Area inside Menu */}
            <div className="max-w-7xl mx-auto w-full mt-auto pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#f5f0e1]/40">
              <span>© {new Date().getFullYear()} Kaziranga House. All rights reserved.</span>
              <div className="flex flex-wrap items-center justify-center gap-4 md:gap-6">
                {socialLinks.map((link) => (
                  <a 
                    key={link.label} 
                    href={link.url} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="flex items-center gap-2 hover:text-white transition-colors" 
                    aria-label={link.label}
                  >
                    {link.icon}
                    <span className="hidden sm:inline font-medium uppercase tracking-wider">{link.label}</span>
                  </a>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
