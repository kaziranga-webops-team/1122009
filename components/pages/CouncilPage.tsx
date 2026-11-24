"use client";

import { useEffect, useMemo, useState, type CSSProperties, type MouseEvent } from "react";
import { Mail, MessageCircle, Phone } from "lucide-react";
import KzHeader from "@/components/kz/KzHeader";
import KzFooter from "@/components/kz/KzFooter";
import PageHero from "@/components/kz/PageHero";
import { Burst, ChapterTitle, Gamosa, Postmark } from "@/components/kz/Motifs";
import CommunityPatch from "@/components/communities/CommunityPatch";
import { toMember, type Member } from "@/components/home/KzCouncil";
import { REGION_THEMES, regionImage } from "@/components/portal/home/RegionArt";
import { fetchCouncil, getCachedCouncil, type CouncilRow } from "@/lib/api";
import type { Community } from "@/lib/communities";
import type { Region } from "@/lib/portal/regions";
import {
  TEAM_ORDER,
  TIERS,
  communityFromRole,
  regionFromRole,
  teamOf,
  tenureLabel,
  tenureOf,
  tenures,
  tierOf,
  type Tier,
} from "@/lib/council";

type Person = Member & { tier: Tier; team: string; tenure: string; region: Region | null; community: Community | null };

function toPeople(rows: CouncilRow[]): Person[] {
  return rows
    .map((r, i) => ({
      ...toMember(r, i),
      tier: tierOf(r),
      team: teamOf(String(r["Council Type"] || "")),
      tenure: tenureOf(r),
      region: regionFromRole(String(r.Role || "")),
      community: communityFromRole(String(r.Role || ""), String(r["Council Type"] || "")),
    }))
    .filter((p) => p.name);
}

/** One person across years: by email when there is one, else by name. */
const identity = (p: Person) => (p.email || p.name).trim().toLowerCase();
const firstName = (p: Person) => p.name.split(" ")[0];

/** The colours each team's cards are printed in, from the poster-shop palette. */
const TEAM_INKS = [
  { bg: "#f6b51e", ink: "#1c130c", label: "#c8102e" },
  { bg: "#e2387a", ink: "#fff", label: "#fff3c4" },
  { bg: "#2343b8", ink: "#f5e9cf", label: "#f6b51e" },
  { bg: "#0f5e48", ink: "#f5e9cf", label: "#f6b51e" },
  { bg: "#c8102e", ink: "#fff", label: "#f6b51e" },
  { bg: "#1d2a5b", ink: "#f5e9cf", label: "#f2c66b" },
];

function Photo({ p, className = "", sizeText = "text-[3rem]" }: { p: Person; className?: string; sizeText?: string }) {
  const [broken, setBroken] = useState(false);
  return p.image && !broken ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={p.image} alt={`${p.name}, ${p.role}`} loading="lazy" decoding="async" onError={() => setBroken(true)} className={`h-full w-full object-cover ${className}`} />
  ) : (
    <span aria-label={p.name} className={`grid h-full w-full place-items-center bg-[#1c130c] font-[family-name:var(--kz-f-display)] text-[#e3a936] ${sizeText} ${className}`}>
      {p.name.charAt(0)}
    </span>
  );
}

const digits = (phone: string) => phone.replace(/[^\d+]/g, "");
/** WhatsApp wants the country code; a bare 10-digit number is Indian. */
const whatsapp = (phone: string) => {
  let d = phone.replace(/\D/g, "");
  if (d.length === 10) d = `91${d}`;
  return `https://wa.me/${d}`;
};

const hasContact = (p: Person) => Boolean(p.phone || p.email);
/** Links on the back act on their own and do not turn the card back over. */
const keep = (e: MouseEvent<HTMLElement>) => e.stopPropagation();

/**
 * The photo that turns over to show how to reach the person: their number,
 * a call button, WhatsApp and email. The whole card turns it (the card's own
 * click), the photo is the button for keyboards, and only the face in view
 * can be tabbed to.
 */
function FlipPhoto({
  p,
  open,
  className = "",
  photoClass = "",
  sizeText,
  compact = false,
}: {
  p: Person;
  open: boolean;
  className?: string;
  photoClass?: string;
  sizeText?: string;
  compact?: boolean;
}) {
  const contact = hasContact(p);
  const row = `kz-focus kz-signboard flex items-center gap-2 py-2 pl-3 pr-6 text-left font-semibold transition-transform hover:translate-x-1 ${compact ? "text-[0.74rem]" : "text-[0.84rem]"}`;
  const front = (
    <>
      <Photo p={p} sizeText={sizeText} className={photoClass} />
      {contact && (
        <span
          aria-hidden
          className={`absolute right-2 top-2 grid place-items-center rounded-full bg-[#f6b51e] text-[#1c130c] shadow-[0_4px_10px_-4px_rgba(0,0,0,0.6)] transition-transform duration-300 group-hover:scale-110 ${compact ? "h-7 w-7" : "h-8 w-8"}`}
        >
          {p.phone ? <Phone size={compact ? 12 : 14} /> : <Mail size={compact ? 12 : 14} />}
        </span>
      )}
    </>
  );
  return (
    <div className={`kz-flip ${className}`} data-flipped={open}>
      <div className="kz-flip-inner">
        {contact ? (
          <button type="button" className="kz-flip-face kz-focus block w-full cursor-pointer text-left" inert={open} aria-label={`Show how to reach ${p.name}`}>
            {front}
          </button>
        ) : (
          <div className="kz-flip-face">{front}</div>
        )}
        {contact && (
          <div
            className={`kz-flip-face kz-flip-face--back kz-jaali flex cursor-pointer flex-col justify-center bg-[#0a3b2f] text-left text-[#f5e9cf] ${compact ? "gap-1.5 p-2.5" : "gap-2.5 p-4"}`}
            inert={!open}
            role="group"
            aria-label={`How to reach ${p.name}`}
          >
            <p className={`kz-label text-[#f6b51e] ${compact ? "text-[0.6rem]" : ""}`}>Reach {firstName(p)}</p>
            {p.phone && (
              <p className={`kz-sign tracking-[0.06em] ${compact ? "text-[0.9rem]" : "text-[1.25rem]"}`} onClick={keep}>
                {p.phone}
              </p>
            )}
            <div className={`flex flex-col ${compact ? "mt-1 gap-1.5" : "mt-2 gap-2"}`}>
              {p.phone && (
                <a href={`tel:${digits(p.phone)}`} onClick={keep} className={`${row} bg-[#f6b51e] text-[#1c130c]`}>
                  <Phone size={13} className="shrink-0" /> Call
                </a>
              )}
              {p.phone && (
                <a href={whatsapp(p.phone)} target="_blank" rel="noopener noreferrer" onClick={keep} className={`${row} bg-[#25d366] text-[#0b1a10]`}>
                  <MessageCircle size={13} className="shrink-0" /> WhatsApp
                </a>
              )}
              {p.email && (
                <a href={`mailto:${p.email}`} onClick={keep} className={`${row} bg-[#e2387a] text-white`}>
                  <Mail size={13} className="shrink-0" /> Email
                </a>
              )}
            </div>
            {/* no handler: the click reaches the card, which turns it back */}
            <button type="button" className={`kz-focus mt-auto self-start underline underline-offset-4 opacity-80 hover:opacity-100 ${compact ? "text-[0.72rem]" : "text-[0.82rem]"}`}>
              Back to photo
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/** Props for a card that turns over when clicked, if there is a way to reach the person. */
function flipCard(p: Person, setOpen: (f: (v: boolean) => boolean) => void) {
  return hasContact(p) ? { onClick: () => setOpen((v) => !v), "data-flip": "" } : {};
}

/* ─── The four kinds of card ─────────────────────────────────────── */

/** House leadership: a film-poster lead, the portrait cut out over a sunburst. */
function LeadCard({ p, index }: { p: Person; index: number }) {
  const [open, setOpen] = useState(false);
  return (
    <li {...flipCard(p, setOpen)} className={`group relative flex flex-col items-center text-center ${hasContact(p) ? "cursor-pointer" : ""}`}>
      <div className="relative w-full max-w-[18rem]">
        <Burst className="absolute -inset-[14%] h-[128%] w-[128%] opacity-90 transition-transform duration-[1.2s] group-hover:rotate-[24deg]" rays={28} />
        <div className="kz-cutout relative transition-transform duration-500 group-hover:!rotate-0" style={{ rotate: `${index % 2 ? 2 : -2}deg` }}>
          <FlipPhoto p={p} open={open} className="aspect-[4/5]" sizeText="text-[5rem]" />
        </div>
      </div>
      <p className="kz-label mt-8 text-[#f6b51e]">{p.role}</p>
      <h3 className="kz-serif mt-2 text-[clamp(1.7rem,2.4vw,2.2rem)] text-[#f5e9cf]">{p.name}</h3>
      {p.tagline && <p className="mt-2 max-w-[22rem] text-[0.98rem] leading-relaxed text-[#f5e9cf]/80">“{p.tagline}”</p>}
    </li>
  );
}

/**
 * A regional coordinator: their portrait fills the card, and their city's
 * poster sits on it as a round medallion, so you see who it is and where.
 */
function RegionCard({ p }: { p: Person }) {
  const region = p.region;
  const theme = region ? REGION_THEMES[region] : null;
  const city = region ?? p.role.replace(/^rc\s+/i, "");
  const [open, setOpen] = useState(false);
  return (
    <li {...flipCard(p, setOpen)} className="group relative flex flex-col bg-[#fffaf0] p-3 [&[data-flip]]:cursor-pointer shadow-[0_14px_28px_-18px_rgba(28,19,12,0.55)] transition-[transform,box-shadow] duration-300 hover:-translate-y-1 hover:shadow-[6px_6px_0_#1c130c]">
      <div className="relative">
        <FlipPhoto p={p} open={open} className="aspect-[4/5] bg-[#1c130c]" sizeText="text-[5rem]" photoClass="transition-transform duration-700 group-hover:scale-[1.03]" />
        {/* the city medallion, half on the photo and half on the paper */}
        {region && (
          <span
            className="absolute -bottom-11 right-3 h-[5.5rem] w-[5.5rem] overflow-hidden rounded-full border-[5px] border-[#fffaf0] shadow-[0_10px_20px_-10px_rgba(28,19,12,0.7)] transition-transform duration-500 group-hover:rotate-[-6deg] sm:h-24 sm:w-24"
            style={{ background: theme?.sky }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={regionImage(region, 640)} alt="" loading="lazy" className="h-full w-full scale-[1.35] object-cover" style={{ objectPosition: theme?.focus }} />
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col px-1 pt-4">
        <p className="kz-label pr-24 text-[#c8102e]">RC · {city}</p>
        <h3 className="kz-serif mt-2 pr-20 text-[1.45rem] leading-tight">{p.name}</h3>
        {p.tagline && <p className="mt-2 line-clamp-2 text-[0.92rem] leading-snug text-[#5e4a35]">“{p.tagline}”</p>}
        <div className="mt-auto flex items-end justify-between gap-2 pt-4">
          {theme && <span className="kz-label text-[#5e4a35]/80">{theme.landmark}</span>}
        </div>
      </div>
    </li>
  );
}

/** A community head: printed in their community's own colours, its patch on the photo. */
function HeadCard({ p }: { p: Person }) {
  const c = p.community;
  const bg = c?.bg ?? "#1c130c";
  const ink = c?.ink ?? "#f5e9cf";
  const [open, setOpen] = useState(false);
  return (
    <li
      {...flipCard(p, setOpen)}
      className="kz-halftone group relative flex flex-col [&[data-flip]]:cursor-pointer p-3 outline-2 -outline-offset-[7px] outline-current transition-[transform,box-shadow] duration-300 hover:-translate-y-1 hover:rotate-[-0.6deg] hover:shadow-[6px_6px_0_#1c130c] sm:p-4"
      style={{ background: bg, color: ink, ["--dot" as string]: "rgba(0,0,0,0.14)" } as CSSProperties}
    >
      <div className="kz-cutout relative">
        <FlipPhoto p={p} open={open} className="aspect-square" compact />
        {c && <CommunityPatch c={c} size={52} className="absolute -bottom-4 -right-3 ring-4 ring-[#fffaf0]" />}
      </div>
      <p className="kz-label mt-5 opacity-85">{c ? `Head · ${c.name}` : p.role}</p>
      <h3 className="kz-serif mt-1.5 text-[1.25rem] leading-tight sm:text-[1.4rem]">{p.name}</h3>
      {c && <p className="mt-1 text-[0.85rem] opacity-80">{c.focus}</p>}
    </li>
  );
}

/** A team member: a small cut-out on the team's colour. */
function TeamCard({ p, inks }: { p: Person; inks: (typeof TEAM_INKS)[number] }) {
  const [open, setOpen] = useState(false);
  return (
    <li
      {...flipCard(p, setOpen)}
      className="kz-halftone group relative flex flex-col [&[data-flip]]:cursor-pointer p-2.5 transition-[transform,box-shadow] duration-300 hover:-translate-y-1 hover:shadow-[5px_5px_0_#1c130c] sm:p-3"
      style={{ background: inks.bg, color: inks.ink, ["--dot" as string]: "rgba(0,0,0,0.12)" } as CSSProperties}
    >
      <div className="kz-cutout">
        <FlipPhoto p={p} open={open} className="aspect-[4/5]" compact />
      </div>
      <h3 className="kz-serif mt-3 text-[1.08rem] leading-tight sm:text-[1.2rem]">{p.name}</h3>
      <div className="mt-1 flex items-center justify-between gap-2">
        <p className="kz-label min-w-0 truncate" style={{ color: inks.label }}>
          {p.role}
        </p>
      </div>
    </li>
  );
}

/** Chapter opener: a numeral on a small sunburst, the title off-register. */
function ChapterHead({ n, id, title, line, dark = false }: { n: number; id: string; title: string; line?: string; dark?: boolean }) {
  return (
    <header className="mb-10 flex items-center gap-5 md:mb-12">
      <span className="relative grid h-16 w-16 shrink-0 place-items-center md:h-20 md:w-20">
        <Burst className="absolute inset-0 h-full w-full" rays={20} />
        <span className="kz-sign relative grid h-9 w-9 place-items-center rounded-full bg-[#1c130c] text-[1.1rem] text-[#f6b51e] md:h-11 md:w-11">{n}</span>
      </span>
      <div>
        <ChapterTitle as="h2" offset={dark ? "#e2387a" : "rgba(200,16,46,0.28)"} className={`text-[clamp(1.9rem,3.6vw,3rem)] ${dark ? "text-[#f6b51e]" : ""}`}>
          <span id={`${id}-title`}>{title}</span>
        </ChapterTitle>
        {line && <p className={`mt-1.5 text-[1rem] ${dark ? "text-[#f5e9cf]/75" : "text-[#5e4a35]"}`}>{line}</p>}
      </div>
    </header>
  );
}

export default function CouncilPage() {
  const [rows, setRows] = useState<CouncilRow[]>(() => getCachedCouncil() || []);
  const [loading, setLoading] = useState(rows.length === 0);
  const [error, setError] = useState(false);

  useEffect(() => {
    let alive = true;
    fetchCouncil()
      .then((r) => alive && setRows(r))
      .catch(() => alive && setError(true))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  const years = useMemo(() => tenures(rows), [rows]);
  const people = useMemo(() => toPeople(rows), [rows]);
  const [picked, setPicked] = useState<string | null>(null);
  const edition = picked ?? years[0] ?? "";
  const council = useMemo(() => people.filter((p) => p.tenure === edition), [people, edition]);

  const byTier = useMemo(() => {
    const m: Record<Tier, Person[]> = { leadership: [], rc: [], heads: [], teams: [] };
    for (const p of council) m[p.tier].push(p);
    return m;
  }, [council]);

  const teams = useMemo(() => {
    const names = [...TEAM_ORDER, ...Array.from(new Set(byTier.teams.map((p) => p.team))).filter((t) => !TEAM_ORDER.includes(t))];
    return names.map((t) => ({ name: t, people: byTier.teams.filter((p) => p.team === t) })).filter((t) => t.people.length);
  }, [byTier.teams]);

  const builders = useMemo(() => {
    const map = new Map<string, { p: Person; years: Set<string> }>();
    for (const p of people) {
      const key = identity(p);
      const entry = map.get(key) ?? { p, years: new Set<string>() };
      entry.years.add(p.tenure);
      if (p.tenure > entry.p.tenure) entry.p = p;
      map.set(key, entry);
    }
    return Array.from(map.values()).sort((a, b) => b.years.size - a.years.size || a.p.name.localeCompare(b.p.name));
  }, [people]);

  const tierInfo = (t: Tier) => TIERS.find((x) => x.id === t)!;
  const chapters = TIERS.filter((t) => byTier[t.id].length);
  const numberOf = (t: Tier) => chapters.findIndex((c) => c.id === t) + 1;

  const facts = [
    { n: council.length, label: "people" },
    { n: byTier.rc.length, label: byTier.rc.length === 1 ? "region" : "regions" },
    { n: byTier.heads.length, label: byTier.heads.length === 1 ? "community" : "communities" },
    { n: teams.length, label: teams.length === 1 ? "team" : "teams" },
  ].filter((f) => f.n > 0);

  const openEdition = (t: string) => {
    setPicked(t);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const wrap = "mx-auto max-w-[90rem] px-5 sm:px-8 md:px-12";

  return (
    <div className="kz-font kz-paper min-h-screen bg-[#f5e9cf] text-[#1c130c] selection:bg-[#c8102e]/20">
      <KzHeader />
      <main>
        <PageHero
          ground="red"
          title={edition ? ["The council", tenureLabel(edition)] : ["The council"]}
          intro="The people who build Kaziranga House: who leads it, who runs each region and community, and the teams behind every event."
          aside={
            edition ? (
              <span className="hidden md:block">
              <Postmark
                center={
                  <>
                    COUNCIL
                    <br />
                    {tenureLabel(edition)}
                  </>
                }
                bottom="ISSUED BY THE HOUSE"
                className="w-36 rotate-[-8deg]"
              />
              </span>
            ) : undefined
          }
        />

        {loading && !rows.length ? (
          <div className={`${wrap} pb-16`}>
            <div className="grid grid-cols-2 gap-5 md:grid-cols-4">
              {Array.from({ length: 8 }, (_, i) => (
                <div key={i} className="aspect-[4/5] animate-pulse bg-[#ebd9b2]" />
              ))}
            </div>
          </div>
        ) : error && !rows.length ? (
          <p className={`${wrap} pb-16 text-[1.05rem] text-[#5e4a35]`}>The council could not be loaded. Refresh the page to try again.</p>
        ) : (
          <>
            {/* ─── The billing: who's in this year's council, and where to jump ─── */}
            <div className={`${wrap} pb-12`}>
              <div className="flex flex-wrap items-center gap-x-8 gap-y-5">
                <dl className="flex flex-wrap gap-x-7 gap-y-3">
                  {facts.map((f) => (
                    <div key={f.label} className="flex items-baseline gap-2">
                      <dt className="sr-only">{f.label}</dt>
                      <dd className="kz-display text-[2.6rem] text-[#c8102e]">{f.n}</dd>
                      <span aria-hidden className="kz-label text-[#5e4a35]">
                        {f.label}
                      </span>
                    </div>
                  ))}
                </dl>
                <nav aria-label="Chapters" className="flex flex-wrap gap-2 md:ml-auto">
                  {chapters.map((c) => (
                    <a
                      key={c.id}
                      href={`#${c.id}`}
                      className="kz-focus kz-sign border-[1.5px] border-[#1c130c]/25 px-3 py-2 text-[0.74rem] uppercase tracking-[0.12em] transition-colors hover:border-[#1c130c] hover:bg-[#1c130c] hover:text-[#f5e9cf]"
                    >
                      {c.title}
                    </a>
                  ))}
                </nav>
              </div>
            </div>

            {/* ─── 1. House leadership: the leads, on a cobalt hoarding ─── */}
            {byTier.leadership.length > 0 && (
              <>
                <section
                  id="leadership"
                  aria-labelledby="leadership-title"
                  className="kz-halftone relative scroll-mt-16 overflow-x-clip bg-[#2343b8] py-16 text-[#f5e9cf] md:py-24"
                  style={{ ["--dot" as string]: "rgba(10,20,80,0.55)" } as CSSProperties}
                >
                  <div className={wrap}>
                    <ChapterHead n={numberOf("leadership")} id="leadership" title={tierInfo("leadership").title} line={tierInfo("leadership").line} dark />
                    <ul className="grid grid-cols-1 gap-x-10 gap-y-16 pt-6 min-[520px]:grid-cols-2 lg:grid-cols-3">
                      {byTier.leadership.map((p, i) => (
                        <LeadCard key={p.id} p={p} index={i} />
                      ))}
                    </ul>
                  </div>
                </section>
                <Gamosa />
              </>
            )}

            {/* ─── 2. Regional coordinators: one city poster each ─── */}
            {byTier.rc.length > 0 && (
              <section id="rc" aria-labelledby="rc-title" className={`${wrap} scroll-mt-16 py-16 md:py-24`}>
                <ChapterHead n={numberOf("rc")} id="rc" title={tierInfo("rc").title} line={tierInfo("rc").line} />
                <ul className="mx-auto grid max-w-sm grid-cols-1 gap-x-8 gap-y-10 min-[560px]:max-w-none min-[560px]:grid-cols-2 lg:grid-cols-3">
                  {byTier.rc.map((p) => (
                    <RegionCard key={p.id} p={p} />
                  ))}
                </ul>
              </section>
            )}

            {/* ─── 3. Community heads: in their communities' colours ─── */}
            {byTier.heads.length > 0 && (
              <section id="heads" aria-labelledby="heads-title" className="scroll-mt-16 bg-[#ebd9b2] py-16 md:py-24">
                <div className={wrap}>
                  <ChapterHead n={numberOf("heads")} id="heads" title={tierInfo("heads").title} line={tierInfo("heads").line} />
                  <ul className="grid grid-cols-2 gap-x-4 gap-y-6 sm:gap-x-6 md:grid-cols-3 xl:grid-cols-4">
                    {byTier.heads.map((p) => (
                      <HeadCard key={p.id} p={p} />
                    ))}
                  </ul>
                </div>
              </section>
            )}

            {/* ─── 4. The teams: each one printed in its own colour ─── */}
            {teams.length > 0 && (
              <section id="teams" aria-labelledby="teams-title" className={`${wrap} scroll-mt-16 py-16 md:py-24`}>
                <ChapterHead n={numberOf("teams")} id="teams" title={tierInfo("teams").title} line={tierInfo("teams").line} />
                <div className="space-y-14">
                  {teams.map((t, i) => {
                    const inks = TEAM_INKS[i % TEAM_INKS.length];
                    return (
                      <div key={t.name}>
                        <h3 className="mb-5 flex items-center gap-3">
                          <span className="kz-signboard kz-sign py-2 pl-3.5 pr-7 text-[0.8rem] uppercase tracking-[0.14em]" style={{ background: inks.bg, color: inks.ink }}>
                            {t.name}
                          </span>
                          <span className="kz-label text-[#5e4a35]">
                            {t.people.length} {t.people.length === 1 ? "person" : "people"}
                          </span>
                        </h3>
                        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4 2xl:grid-cols-5">
                          {t.people.map((p) => (
                            <TeamCard key={p.id} p={p} inks={inks} />
                          ))}
                        </ul>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}
          </>
        )}

        {/* ─── Every year's council, and everyone who has built the house ─── */}
        {builders.length > 0 && (
          <section aria-labelledby="editions" className="mt-4 rounded-t-[2rem] bg-[#1c130c] text-[#f5e9cf] md:rounded-t-[3rem]">
            <div className={`${wrap} py-16 md:py-24`}>
              <ChapterTitle as="h2" offset="#c8102e" className="text-[clamp(2.2rem,4vw,3.4rem)] text-[#f6b51e]">
                <span id="editions">Every council so far</span>
              </ChapterTitle>
              <p className="kz-lead mt-4 max-w-2xl text-[#f5e9cf]/80">Each year the house gets a new council. Pick a year to see who ran it.</p>

              <ul className="mt-10 flex flex-wrap gap-5">
                {years.map((y) => {
                  const count = people.filter((p) => p.tenure === y).length;
                  const open = y === edition;
                  return (
                    <li key={y}>
                      <button
                        type="button"
                        onClick={() => openEdition(y)}
                        aria-pressed={open}
                        className="kz-focus kz-stamp block w-40 text-left transition-transform duration-300 hover:-translate-y-1 hover:rotate-[-2deg]"
                        style={{ ["--stamp-bg" as string]: open ? "#f6b51e" : "#f5e9cf" } as CSSProperties}
                      >
                        <span className="kz-halftone block bg-[#c8102e] px-3 pb-3 pt-2 text-[#f5e9cf]" style={{ ["--dot" as string]: "rgba(0,0,0,0.18)" } as CSSProperties}>
                          <span className="kz-sign block text-[0.62rem] tracking-[0.14em]">COUNCIL</span>
                          <span className="kz-display mt-2 block text-[1.9rem]">{tenureLabel(y)}</span>
                        </span>
                        <span className="kz-sign mt-2 block text-[0.7rem] uppercase tracking-[0.12em] text-[#1c130c]">
                          {count} people{open ? " · showing" : ""}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>

              <h3 className="kz-serif mt-16 text-[clamp(1.7rem,3vw,2.4rem)]">Built by</h3>
              <p className="mt-2 text-[#f5e9cf]/70">
                {builders.length} people have served on the council.
                {builders.some((b) => b.years.size > 1) ? " Some came back for more than one year." : ""}
              </p>
              <ul className="mt-6 grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
                {builders.map(({ p, years: served }) => (
                  <li key={identity(p)} className="flex items-center gap-3 rounded-xl bg-[#f5e9cf]/[0.06] p-2 pr-3">
                    <span className="h-12 w-12 shrink-0 overflow-hidden rounded-full">
                      <Photo p={p} sizeText="text-[1.3rem]" />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-[0.95rem] font-semibold">{p.name}</span>
                      <span className="block truncate text-[0.8rem] text-[#f5e9cf]/60">
                        {served.size > 1 ? `${served.size} years` : tenureLabel(Array.from(served)[0])}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}
      </main>
      <KzFooter under="#1c130c" />
    </div>
  );
}
