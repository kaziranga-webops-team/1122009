"use client";

import { FaInstagram, FaWhatsapp, FaYoutube, FaLinkedin } from "react-icons/fa";
import { SiLinktree } from "react-icons/si";
import { useContent } from "@/hooks/useData";
import { motion } from "framer-motion";

export default function Footer() {
  const { data: content } = useContent();
  const site = content?.site;

  const socialLinks = [
    { icon: <FaInstagram size={20} />, url: "https://www.instagram.com/kaziranga_iitm/", label: "Instagram", color: "hover:bg-gradient-to-tr hover:from-orange-500 hover:via-pink-500 hover:to-purple-500" },
    { icon: <FaWhatsapp size={20} />, url: "https://forms.gle/Ac5Zxwn21cRMeEcy8", label: "WhatsApp", color: "hover:bg-green-500" },
    { icon: <FaYoutube size={20} />, url: "http://www.youtube.com/@KazirangaHouse", label: "YouTube", color: "hover:bg-red-600" },
    { icon: <FaLinkedin size={20} />, url: "https://www.linkedin.com/company/kaziranga-iitm", label: "LinkedIn", color: "hover:bg-blue-600" },
    { icon: <SiLinktree size={20} />, url: "https://linktr.ee/KazirangaHouseBS", label: "Linktree", color: "hover:bg-[#43E55E]" },
  ];

  return (
    <footer className="relative bg-[#05110a] text-white pt-16 pb-8 overflow-hidden">
      {/* Background glow meshes */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#2e8b57]/15 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-[#1e5631]/25 rounded-full blur-[150px] pointer-events-none" />

      {/* Huge Watermark */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full flex justify-center pointer-events-none opacity-[0.02] select-none z-0">
        <span aria-hidden="true" className="text-[12vw] font-black tracking-tighter text-white whitespace-nowrap font-sans">
          KAZIRANGA
        </span>
      </div>

      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <div className="max-w-4xl mx-auto flex flex-col items-center text-center">

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="w-14 h-14 rounded-2xl overflow-hidden border border-[#2e8b57]/40 bg-gradient-to-br from-white/10 to-transparent flex items-center justify-center p-1.5 mb-4 shadow-xl backdrop-blur-sm"
          >
            <img src="/logo.png" alt="Kaziranga NOW" className="w-full h-full object-contain filter drop-shadow-lg" />
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="font-serif font-bold text-3xl md:text-4xl tracking-tight text-[#e8f5e9] mb-2 drop-shadow-md"
          >
            {site?.name || "Kaziranga NOW"}
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-[#a5d6a7] text-base md:text-lg font-medium max-w-lg mb-6"
          >
            {site?.tagline || "Beyond Limit"}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-wrap items-center justify-center gap-3 mb-10 p-3 rounded-3xl bg-white/[0.02] border border-white/5 backdrop-blur-md"
          >
            {socialLinks.map((link) => (
              <a
                key={link.label}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`w-12 h-12 rounded-full bg-[#132a1c] border border-[#2e8b57]/30 flex items-center justify-center text-[#81c784] transition-all duration-300 hover:scale-110 hover:text-white hover:border-transparent hover:shadow-[0_0_15px_rgba(46,139,87,0.4)] ${link.color}`}
                aria-label={link.label}
              >
                {link.icon}
              </a>
            ))}
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="max-w-4xl mx-auto pt-6 flex flex-col md:flex-row justify-between items-center gap-3 text-xs md:text-sm font-medium relative"
        >
          {/* Custom line gradient */}
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#2e8b57]/50 to-transparent" />

          <div className="text-[#a5d6a7]/70">
            © {new Date().getFullYear()} {site?.house || "Kaziranga NOW"}. All rights reserved.
          </div>
          <div className="text-[#a5d6a7]/50 flex items-center gap-2">
            {site?.program || "IIT Madras BS Degree"}
            <span className="w-1 h-1 rounded-full bg-[#2e8b57]"></span>
            {site?.footerNote || "Built with intention for the wild ones."}
          </div>
        </motion.div>
      </div>
    </footer>
  );
}
