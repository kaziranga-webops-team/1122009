"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import CommunityPatch from "@/components/communities/CommunityPatch";
import { SectionHead } from "@/components/home/sections";
import { vars } from "@/components/kz/util";
import { COMMUNITIES, type Community } from "@/lib/communities";

/** One sliding row of patches; it pauses while the pointer is over it. */
function Row({ items, reverse = false, d }: { items: Community[]; reverse?: boolean; d: string }) {
  const loop = [...items, ...items];
  return (
    <div className="group/row overflow-hidden py-3 [mask-image:linear-gradient(90deg,transparent,#000_6%,#000_94%,transparent)]">
      <ul className={`kz-marquee gap-4 group-hover/row:[animation-play-state:paused] ${reverse ? "kz-marquee--rev" : ""}`} style={vars({ "--d": d })}>
        {loop.map((c, i) => (
          <li key={`${c.slug}-${i}`} aria-hidden={i >= items.length} className="shrink-0">
            <Link
              href="/communities"
              tabIndex={i >= items.length ? -1 : 0}
              className="kz-focus group flex items-center gap-3 py-2 pl-2 pr-6 outline-2 -outline-offset-[5px] outline-current transition-transform duration-300 hover:-translate-y-1 hover:rotate-[-1.5deg]"
              style={{ background: c.bg, color: c.ink, outlineStyle: "solid" }}
            >
              <span className="transition-transform duration-500 [transition-timing-function:cubic-bezier(0.34,1.6,0.64,1)] group-hover:-rotate-12">
                <CommunityPatch c={c} size={52} />
              </span>
              <span>
                <span className="kz-serif block whitespace-nowrap text-[1.12rem] leading-tight">{c.name}</span>
                <span className="kz-sign block whitespace-nowrap text-[0.66rem] uppercase tracking-[0.12em] opacity-80">{c.focus}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Homepage: the house's communities as two rows of patches sliding in
 * opposite directions, and the way through to the full list.
 */
export default function KzCommunities() {
  const half = Math.ceil(COMMUNITIES.length / 2);
  return (
    <section id="communities" className="kz-font bg-[#f5e9cf] pb-20 text-[#1c130c] md:pb-28">
      <SectionHead
        title={["Find your", "people"]}
        intro={`${COMMUNITIES.length} communities inside the house — from chess and cybersecurity to dance, debate and robotics.`}
      />
      <Row items={COMMUNITIES.slice(0, half)} d="60s" />
      <Row items={COMMUNITIES.slice(half)} reverse d="70s" />
      <div className="mt-10 flex justify-center px-5">
        <Link href="/communities" className="kz-btn kz-btn--forest kz-focus group">
          See every community <ArrowRight size={18} className="transition-transform duration-300 group-hover:translate-x-1" />
        </Link>
      </div>
    </section>
  );
}
