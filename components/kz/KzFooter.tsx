"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { FaInstagram, FaLinkedinIn, FaWhatsapp, FaYoutube } from "react-icons/fa";
import { SiLinktree } from "react-icons/si";
import Ambient from "@/components/kz/Ambient";
import { JOIN_URL } from "@/components/kz/KzHeader";

const INSTAGRAM = "https://www.instagram.com/kaziranga_iitm/";

const SOCIALS = [
  { Icon: FaInstagram, href: INSTAGRAM, label: "Instagram" },
  { Icon: FaWhatsapp, href: JOIN_URL, label: "WhatsApp" },
  { Icon: FaYoutube, href: "http://www.youtube.com/@KazirangaHouse", label: "YouTube" },
  { Icon: FaLinkedinIn, href: "https://www.linkedin.com/company/kaziranga-iitm", label: "LinkedIn" },
  { Icon: SiLinktree, href: "https://linktr.ee/KazirangaHouseBS", label: "Linktree" },
];

const COLUMNS = [
  {
    heading: "The house",
    links: [
      { label: "Council", href: "/council" },
      { label: "Events", href: "/events" },
      { label: "Communities", href: "/communities" },
      { label: "Meetups", href: "/meetups" },
      { label: "Gallery", href: "/gallery" },
    ],
  },
  {
    heading: "Learn",
    links: [
      { label: "Study Zone", href: "/study" },
      { label: "Revision sessions", href: "/study" },
      { label: "Kaziranga Tak", href: "/tak" },
    ],
  },
];

/**
 * The close of the page.
 *
 * "Still have questions?" lives here rather than in a section of its own:
 * as a standalone block between the sunset band and the footer it was a third
 * ending in a row, and it floated on a strip of canopy art with no ground
 * under it. Asked right above the links that answer it, it has a job.
 */
export default function KzFooter() {
  return (
    <footer className="kz-font relative isolate overflow-hidden rounded-t-[2.25rem] bg-[#002820] text-[#f9fbe5] md:rounded-t-[3.5rem]">
      <Ambient birds={0} specks={24} seed={21} sky={[4, 94]} />

      <div className="relative border-b border-white/12 bg-[#00392e]">
        <div className="mx-auto flex max-w-[90rem] flex-col items-start gap-7 px-5 py-16 sm:px-8 md:flex-row md:items-end md:justify-between md:px-12 md:py-20">
          <div>
            <h2 className="kz-h2 text-[clamp(1.9rem,4vw,3.2rem)]">Still have questions?</h2>
            <p className="kz-lead mt-4 max-w-md text-white/70">
              Message the house on Instagram, or reach any council member directly from their card.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <a href={INSTAGRAM} target="_blank" rel="noopener noreferrer" className="kz-btn kz-btn--white">
              Message us on Instagram <ArrowRight size={18} />
            </a>
            <Link href="/council" className="kz-btn kz-btn--outline">
              Meet the council
            </Link>
          </div>
        </div>
      </div>

      <div className="relative mx-auto grid max-w-[90rem] gap-12 px-5 py-16 sm:px-8 md:grid-cols-[1.4fr_1fr_1fr] md:px-12 md:py-20">
        <div>
          <Link href="/" className="flex items-center gap-3">
            <Image src="/logo.png" alt="" width={40} height={40} className="h-10 w-10 rounded-full" />
            <span className="kz-wordmark text-[1.3rem]">kaziranga house</span>
          </Link>
          <p className="kz-body mt-6 max-w-sm text-white/70">
            Creators. Leaders. Dreamers. Together, we go Beyond Limits!
          </p>
          <ul className="mt-7 flex flex-wrap gap-3">
            {SOCIALS.map(({ Icon, href, label }) => (
              <li key={label}>
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  data-brand={label.toLowerCase()}
                  className="kz-social grid h-11 w-11 place-items-center rounded-full border border-white/25"
                >
                  <Icon size={17} />
                </a>
              </li>
            ))}
          </ul>
        </div>

        {COLUMNS.map((col) => (
          <nav key={col.heading}>
            <h2 className="kz-label text-white/45">{col.heading}</h2>
            <ul className="mt-5 space-y-3">
              {col.links.map((l) => (
                <li key={l.label}>
                  <Link href={l.href} className="kz-lead text-white/85 transition-colors hover:text-white">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>

      <div className="relative border-t border-white/12">
        <div className="mx-auto flex max-w-[90rem] flex-col gap-2 px-5 py-6 text-[0.8rem] text-white/55 sm:flex-row sm:items-center sm:justify-between sm:px-8 md:px-12">
          <p>© {new Date().getFullYear()} Kaziranga House. All rights reserved.</p>
          <p>IIT Madras BS Degree · Built by the house web team</p>
        </div>
      </div>
    </footer>
  );
}
