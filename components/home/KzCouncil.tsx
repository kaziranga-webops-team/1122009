"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Mail, Phone, User } from "lucide-react";
import { fetchCouncil, getCachedCouncil, toDirectImageUrl, type CouncilRow } from "@/lib/api";
import { currentCouncil } from "@/lib/council";
import { SectionHead } from "@/components/home/sections";

type Member = {
  id: string;
  name: string;
  role: string;
  tagline: string;
  phone: string;
  email: string;
  image: string;
};

/**
 * The homepage shows the three house-wide roles only. Regional coordinators
 * are a long list that belongs on /council, not in the middle of the home page.
 */
const HOME_ROLES = ["house secretary", "deputy secretary", "web admin"];

const rankOf = (role: string) => HOME_ROLES.findIndex((r) => role.toLowerCase().includes(r));

function toMember(row: CouncilRow, i: number): Member {
  return {
    id: `council-${i}`,
    name: (row.Name || "").trim(),
    role: (row.Role || "").trim(),
    tagline: (row.Tagline || "").trim(),
    phone: (row.Phone || row["Phone "] || row[" Phone"] || "").trim(),
    email: (row.Email || row["Email "] || row[" Email"] || "").trim(),
    image: toDirectImageUrl(row["Image URL"] || "", 800),
  };
}


/**
 * A council member as a postage stamp that turns over: the portrait on the
 * front with their role and name printed under it, and the way to reach them
 * on the back. Only the face in view is focusable, so tabbing never reaches
 * a link that is pointing away from the reader.
 */
function FlipCard({ member }: { member: Member }) {
  const [flipped, setFlipped] = useState(false);
  const [broken, setBroken] = useState(false);
  const hasPhoto = Boolean(member.image) && !broken;
  const turn = (next: boolean) => (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setFlipped(next);
    }
  };

  return (
    <div className="kz-flip aspect-[4/5.4] w-full" data-flipped={flipped}>
      <div className="kz-flip-inner">
        {/* ── Front: the stamp ── */}
        <div
          role="button"
          tabIndex={flipped ? -1 : 0}
          aria-hidden={flipped}
          aria-label={`Show details for ${member.name}`}
          onClick={() => setFlipped(true)}
          onKeyDown={turn(true)}
          className="kz-flip-face kz-stamp group flex cursor-pointer flex-col"
          style={{ ["--stamp-bg" as string]: "#f5e9cf" }}
        >
          <span className="relative block min-h-0 flex-1 overflow-hidden bg-[#1c130c]">
            {hasPhoto ? (
              <Image
                src={member.image}
                alt={member.name}
                fill
                sizes="(max-width: 768px) 90vw, 340px"
                className="object-cover transition-transform duration-700 group-hover:scale-105"
                unoptimized
                onError={() => setBroken(true)}
              />
            ) : (
              <span className="grid h-full w-full place-items-center text-[#e3a936]">
                <User size={48} />
              </span>
            )}
            <span className="kz-sign absolute left-2 top-1.5 text-[0.66rem] tracking-[0.14em] text-white [text-shadow:0_1px_2px_rgba(0,0,0,0.7)]">INDIA</span>
            <span className="kz-sign absolute right-2 top-1.5 bg-[#f6b51e] px-1.5 py-0.5 text-[0.62rem] uppercase tracking-[0.1em] text-[#1c130c] opacity-0 transition-opacity duration-300 group-hover:opacity-100">
              Contact
            </span>
          </span>
          <span className="block px-1 pb-0.5 pt-3 text-[#1c130c]">
            <span className="kz-sign block truncate text-[0.7rem] uppercase tracking-[0.12em] text-[#c8102e]">{member.role || "Council"}</span>
            <span className="kz-serif mt-1 block truncate text-[1.3rem] leading-tight">{member.name}</span>
          </span>
        </div>

        {/* ── Back: how to reach them ── */}
        <div
          role="button"
          tabIndex={flipped ? 0 : -1}
          aria-hidden={!flipped}
          aria-label={`Hide details for ${member.name}`}
          onClick={() => setFlipped(false)}
          onKeyDown={turn(false)}
          className="kz-flip-face kz-flip-face--back kz-stamp cursor-pointer"
          style={{ ["--stamp-bg" as string]: "#0a3b2f" }}
        >
          <div className="kz-jaali flex h-full flex-col items-center justify-center gap-5 p-4 text-center text-[#f5e9cf]">
            <div className="flex w-full flex-col items-center">
              <h3 className="kz-serif text-[1.35rem] leading-tight text-[#f6b51e]">{member.name}</h3>
              <span className="kz-sign mt-2 text-[0.68rem] uppercase tracking-[0.14em] text-[#f5e9cf]/75">{member.role || "Council"}</span>
              {member.tagline && <p className="mt-3 max-w-[16rem] text-[0.88rem] leading-relaxed text-[#f5e9cf]/85">“{member.tagline}”</p>}
            </div>

            <div className="flex w-full flex-col gap-2">
              {member.phone && (
                <a
                  href={`tel:${member.phone}`}
                  tabIndex={flipped ? 0 : -1}
                  onClick={(e) => e.stopPropagation()}
                  className="kz-signboard flex items-center gap-2.5 bg-[#f6b51e] py-2.5 pl-3.5 pr-7 text-left text-[0.82rem] font-semibold text-[#1c130c] transition-transform hover:translate-x-1"
                >
                  <Phone size={13} className="shrink-0" />
                  <span className="truncate">{member.phone}</span>
                </a>
              )}
              {member.email && (
                <a
                  href={`mailto:${member.email}`}
                  tabIndex={flipped ? 0 : -1}
                  onClick={(e) => e.stopPropagation()}
                  className="kz-signboard flex items-center gap-2.5 bg-[#e2387a] py-2.5 pl-3.5 pr-7 text-left text-[0.82rem] font-semibold text-white transition-transform hover:translate-x-1"
                >
                  <Mail size={13} className="shrink-0" />
                  <span className="truncate">{member.email}</span>
                </a>
              )}
              <span className="kz-sign mt-1 text-[0.62rem] uppercase tracking-[0.14em] text-[#f5e9cf]/45">Tap to turn back</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export { FlipCard, toMember };
export type { Member };

export default function KzCouncil() {
  const [members, setMembers] = useState<Member[]>(() => currentCouncil(getCachedCouncil() || []).map(toMember));

  useEffect(() => {
    let alive = true;
    fetchCouncil()
      .then((rows) => {
        if (alive) setMembers(currentCouncil(rows).map(toMember));
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  const shown = members
    .filter((m) => m.name && rankOf(m.role) >= 0)
    .sort((a, b) => rankOf(a.role) - rankOf(b.role));

  return (
    <section id="council" className="kz-font kz-jaali relative isolate overflow-hidden bg-[#0a3b2f] text-[#f5e9cf]">
      

      <SectionHead
        dark
        title={["Meet the people", "behind the house"]}
        intro="The students leading culture, events and community within Kaziranga House. Tap a card for contact details."
      />

      {shown.length > 0 && (
        <div className="mx-auto grid max-w-[64rem] grid-cols-1 gap-6 px-5 sm:grid-cols-3 sm:px-8 md:px-12">
          {shown.map((m) => (
            <FlipCard key={m.id} member={m} />
          ))}
        </div>
      )}

      <div className="flex justify-center px-5 pb-20 pt-14 md:pb-28">
        <Link href="/council" className="kz-btn kz-focus bg-[#f6b51e] text-[#1c130c]">
          Meet the whole council <ArrowRight size={18} />
        </Link>
      </div>
    </section>
  );
}
