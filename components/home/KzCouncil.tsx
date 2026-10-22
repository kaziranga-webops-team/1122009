"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Award, Mail, Phone, User } from "lucide-react";
import { fetchCouncil, getCachedCouncil, toDirectImageUrl, type CouncilRow } from "@/lib/api";
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
    image: toDirectImageUrl(row["Image URL"] || ""),
  };
}

const ACCENT = "#96b4a5";

/**
 * A card that turns over: the photograph on the front, the detail on the back
 * over a blurred, darkened copy of the same photograph behind frosted glass.
 * Only the face in view is focusable, so tabbing never reaches a link that is
 * pointing away from the reader.
 */
function FlipCard({ member }: { member: Member }) {
  const [flipped, setFlipped] = useState(false);
  const [broken, setBroken] = useState(false);
  const hasPhoto = Boolean(member.image) && !broken;

  return (
    <div className="kz-flip aspect-[4/5] w-full" data-flipped={flipped}>
      <div className="kz-flip-inner">
        {/* ── Front ── */}
        <div
          role="button"
          tabIndex={flipped ? -1 : 0}
          aria-hidden={flipped}
          aria-label={`Show details for ${member.name}`}
          onClick={() => setFlipped(true)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setFlipped(true);
            }
          }}
          className="kz-flip-face group cursor-pointer rounded-2xl border-2 border-[#f9fbe5] bg-[#002820] shadow-[8px_8px_0_0_rgba(0,40,32,0.4)]"
        >
          {hasPhoto ? (
            <Image
              src={member.image}
              alt={member.name}
              fill
              sizes="(max-width: 768px) 90vw, 340px"
              className="object-cover"
              unoptimized
              onError={() => setBroken(true)}
            />
          ) : (
            <span className="grid h-full w-full place-items-center text-[#96b4a5]">
              <User size={48} />
            </span>
          )}

          <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/45 to-transparent p-5 pt-12">
            <span className="kz-h3 block text-[#96b4a5]">{member.role || "Council"}</span>
            <span className="mt-1 block truncate text-[1.1rem] font-bold text-white">{member.name}</span>
          </span>

          <span className="absolute right-3 top-3 rounded-full bg-black/55 px-2.5 py-1 text-[0.6rem] font-bold uppercase tracking-widest text-white opacity-0 backdrop-blur-sm transition-opacity duration-300 group-hover:opacity-100">
            View info
          </span>
        </div>

        {/* ── Back ── */}
        <div
          role="button"
          tabIndex={flipped ? 0 : -1}
          aria-hidden={!flipped}
          aria-label={`Hide details for ${member.name}`}
          onClick={() => setFlipped(false)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setFlipped(false);
            }
          }}
          className="kz-flip-face kz-flip-face--back cursor-pointer rounded-2xl border-2 border-[#f9fbe5]"
        >
          {/* The same photograph, blurred right down — it keeps the card the
              member's own colour without competing with the text. */}
          <span aria-hidden="true" className="absolute inset-0">
            {hasPhoto && (
              <Image
                src={member.image}
                alt=""
                fill
                sizes="340px"
                className="scale-110 object-cover blur-[15px] brightness-[0.25]"
                unoptimized
              />
            )}
            <span className="absolute inset-0 bg-[#00140f]/60 backdrop-blur-xl" />
          </span>

          <div className="relative flex h-full flex-col items-center justify-center gap-5 p-5 text-center text-white">
            <div className="flex w-full flex-col items-center">
              <h3 className="text-[1.2rem] font-bold leading-tight">{member.name}</h3>
              <span
                className="mt-2 inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[0.62rem] font-bold uppercase tracking-widest"
                style={{ color: ACCENT, borderColor: `${ACCENT}4d`, background: `${ACCENT}1a` }}
              >
                <Award size={11} />
                {member.role || "Council"}
              </span>
              {member.tagline && (
                <p className="mt-3 max-w-[16rem] text-[0.8rem] font-medium italic leading-relaxed text-white/80">
                  “{member.tagline}”
                </p>
              )}
            </div>

            <div className="flex w-full flex-col gap-2.5">
              {member.phone && (
                <a
                  href={`tel:${member.phone}`}
                  tabIndex={flipped ? 0 : -1}
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center justify-center gap-2.5 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-[0.78rem] font-medium text-white/90 transition-colors hover:border-white/20 hover:bg-white/10"
                >
                  <Phone size={13} style={{ color: ACCENT }} className="shrink-0" />
                  <span className="truncate">{member.phone}</span>
                </a>
              )}
              {member.email && (
                <a
                  href={`mailto:${member.email}`}
                  tabIndex={flipped ? 0 : -1}
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center justify-center gap-2.5 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-[0.78rem] font-medium text-white/90 transition-colors hover:border-white/20 hover:bg-white/10"
                >
                  <Mail size={13} style={{ color: ACCENT }} className="shrink-0" />
                  <span className="truncate">{member.email}</span>
                </a>
              )}
              <span className="mt-1 text-[0.6rem] font-medium tracking-widest text-white/40">
                Click card to flip back
              </span>
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
  const [members, setMembers] = useState<Member[]>(() => (getCachedCouncil() || []).map(toMember));

  useEffect(() => {
    let alive = true;
    fetchCouncil()
      .then((rows) => {
        if (alive) setMembers(rows.map(toMember));
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
    <section id="council" className="kz-font relative isolate overflow-hidden bg-[#c6011f] text-white">
      <span aria-hidden="true" className="absolute -right-24 -top-28 -z-10 h-[34rem] w-[34rem] rounded-full bg-white/10" />

      <SectionHead
        dark
        label="Student council"
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
        <Link href="/council" className="kz-btn kz-btn--white">
          Meet the whole council <ArrowRight size={18} />
        </Link>
      </div>
    </section>
  );
}
