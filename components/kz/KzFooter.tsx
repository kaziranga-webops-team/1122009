"use client";

import Link from "next/link";
import { isPageHidden, useHiddenSections } from "@/lib/siteSections";
import { ArrowRight } from "lucide-react";
import { FaInstagram, FaLinkedinIn, FaWhatsapp, FaYoutube } from "react-icons/fa";
import { SiLinktree } from "react-icons/si";
import { JOIN_URL } from "@/components/kz/KzHeader";
import { Postmark } from "@/components/kz/Motifs";
import { HERITAGE_CREDIT } from "@/lib/heritage";

const INSTAGRAM = "https://www.instagram.com/kaziranga_iitm/";

const SOCIALS = [
  { Icon: FaInstagram, href: INSTAGRAM, label: "Instagram", bg: "#e2387a", ink: "#fff" },
  { Icon: FaWhatsapp, href: JOIN_URL, label: "WhatsApp", bg: "#0f5e48", ink: "#f5e9cf" },
  { Icon: FaYoutube, href: "http://www.youtube.com/@KazirangaHouse", label: "YouTube", bg: "#c8102e", ink: "#fff" },
  { Icon: FaLinkedinIn, href: "https://www.linkedin.com/company/kaziranga-iitm", label: "LinkedIn", bg: "#2343b8", ink: "#f5e9cf" },
  { Icon: SiLinktree, href: "https://linktr.ee/KazirangaHouseBS", label: "Linktree", bg: "#f6b51e", ink: "#1c130c" },
];

/** The same three groups as the header, so the site is organised one way everywhere. */
const COLUMNS = [
  {
    heading: "The house",
    links: [
      { label: "Our story", href: "/#land" },
      { label: "Communities", href: "/communities" },
      { label: "Council", href: "/council" },
      { label: "Gallery", href: "/gallery" },
    ],
  },
  {
    heading: "Gatherings",
    links: [
      { label: "Meetups", href: "/meetups" },
      { label: "Events", href: "/events" },
      { label: "Kaziranga Tak", href: "/tak" },
    ],
  },
  {
    heading: "Learn",
    links: [
      { label: "Study zone", href: "/study" },
      { label: "Notes", href: "/study/notes" },
      { label: "GPA calculator", href: "/study/grade-calculator" },
      { label: "IITM corner", href: "/iitm" },
    ],
  },
];

/**
 * The close of every page: a rounded sheet with the house's name set huge and
 * hanging from its bar, the site's three groups and the ways to reach us.
 * The home page also opens it with the question most first-time visitors
 * still have (`ask`); other pages go straight to the footer.
 */
export default function KzFooter({ ask = false, under }: { ask?: boolean; under?: string }) {
  const hidden = useHiddenSections();
  // `under`: the colour of the section above, showing in the rounded corners.
  return (
    <div style={under ? { background: under } : undefined}>
    <footer className="kz-font relative overflow-hidden rounded-t-[2rem] bg-[#1c130c] text-[#f5e9cf] md:rounded-t-[3rem]">
      {ask && (
      <div className="kz-halftone bg-[#2343b8]" style={{ ["--dot" as string]: "rgba(10,20,80,0.55)" }}>
        <div className="mx-auto flex max-w-[90rem] flex-col items-start gap-7 px-5 py-14 sm:px-8 md:flex-row md:items-end md:justify-between md:px-12 md:py-16">
          <div>
            <h2 className="kz-h2 kz-offset text-[clamp(2.2rem,4.6vw,3.8rem)] text-[#f6b51e]" style={{ ["--offset" as string]: "#e2387a" }}>
              Still have questions?
            </h2>
            <p className="kz-lead mt-4 max-w-md text-[#f5e9cf]/85">Message the house on Instagram, or reach any council member directly from their card.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <a href={INSTAGRAM} target="_blank" rel="noopener noreferrer" className="kz-btn kz-focus bg-[#f6b51e] text-[#1c130c]">
              Message us on Instagram <ArrowRight size={16} />
            </a>
            <Link href="/council" className="kz-btn kz-btn--outline kz-focus">
              Meet the council
            </Link>
          </div>
        </div>
      </div>
      )}

      <div className="mx-auto max-w-[90rem] px-5 pt-16 sm:px-8 md:px-12 md:pt-20">
        <div className="flex items-start gap-6">
          <p aria-hidden="true" className="kz-display kz-hang min-w-0 flex-1 text-[clamp(3.6rem,13vw,12rem)] text-[#f5e9cf]" style={{ ["--hang-color" as string]: "#c8102e" }}>
            <span>Kaziranga</span>
          </p>
          {/* Only where there is room beside the name. The stamp sets its own
              display, so the wrapper is what hides it on smaller screens. */}
          <span className="hidden shrink-0 lg:block">
            <Postmark
              className="w-36 rotate-[-10deg] text-[0.95rem] xl:w-40"
              color="#f6b51e"
              top="BEYOND LIMITS"
              bottom="IIT MADRAS BS"
              center={
                <>
                  HOUSE
                  <br />
                  {new Date().getFullYear()}
                </>
              }
            />
          </span>
        </div>

        <div className="mt-10 grid grid-cols-2 gap-x-6 gap-y-10 pb-14 md:mt-12 md:grid-cols-[1.3fr_1fr_1fr_1fr] md:gap-12 md:pb-20">
          <div className="col-span-2 md:col-span-1">
            <p className="kz-lead max-w-sm text-[#f5e9cf]/75">Creators, leaders, dreamers — a student house of the IIT Madras BS degree, named for a floodplain in Assam.</p>
            <ul className="mt-7 flex flex-wrap gap-2">
              {SOCIALS.map(({ Icon, href, label, bg, ink }) => (
                <li key={label}>
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    className="kz-focus grid h-11 w-11 place-items-center transition-transform duration-300 hover:-translate-y-1 hover:rotate-[-6deg]"
                    style={{ background: bg, color: ink, clipPath: "polygon(6px 0, calc(100% - 6px) 0, 100% 6px, 100% calc(100% - 6px), calc(100% - 6px) 100%, 6px 100%, 0 calc(100% - 6px), 0 6px)" }}
                  >
                    <Icon size={17} />
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {COLUMNS.map((col) => (
            <nav key={col.heading} aria-label={col.heading}>
              <h2 className="kz-label text-[#f6b51e]">{col.heading}</h2>
              <ul className="mt-5 space-y-3">
                {col.links.filter((l) => !isPageHidden(hidden, l.href)).map((l) => (
                  <li key={l.label}>
                    <Link href={l.href} className="kz-focus text-[1.05rem] text-[#f5e9cf]/85 transition-colors hover:text-[#f6b51e]">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
      </div>

      <div className="border-t border-[#f5e9cf]/12">
        <div className="mx-auto flex max-w-[90rem] flex-col gap-2 px-5 py-6 text-[0.8rem] text-[#f5e9cf]/55 sm:px-8 md:flex-row md:items-center md:justify-between md:px-12">
          <p>© {new Date().getFullYear()} Kaziranga House · IIT Madras BS degree · Built by the house web team</p>
          <p>Historical artworks: {HERITAGE_CREDIT}</p>
        </div>
      </div>
    </footer>
    </div>
  );
}
