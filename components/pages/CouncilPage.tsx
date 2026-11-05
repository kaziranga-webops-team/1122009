"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { AlertTriangle, Award, Calendar, Crown, Globe, Megaphone, Palette, PenTool, Users, Video } from "lucide-react";
import KzHeader from "@/components/kz/KzHeader";
import KzFooter from "@/components/kz/KzFooter";
import PageHero, { Segmented } from "@/components/kz/PageHero";
import { RHINO_SRC } from "@/components/kz/Scene";
import { FlipCard, toMember, type Member } from "@/components/home/KzCouncil";
import { RevealWords } from "@/components/home/sections";
import { fetchCouncil, getCachedCouncil, type CouncilRow } from "@/lib/api";

type CouncilMember = Member & { type: string };

const UPPER = "Upper House Council";
const LOWER = "Lower House Council";

const TEAM_ORDER = [
  UPPER,
  LOWER,
  "PR and Outreach Team",
  "Graphic Team",
  "Event Management Team",
  "Content Team",
  "Multimedia Team",
  "WebOps Team",
];

/** Sheet "Council Type" values are free text; fold them into the known teams. */
function teamOf(rawType: string): string {
  const type = rawType.toLowerCase().trim();
  if (type.includes("upper") || type.includes("executive")) return UPPER;
  if (type === "house" || type.includes("lower")) return LOWER;
  if (type.includes("web")) return "WebOps Team";
  if (type.includes("graphic") || type.includes("design")) return "Graphic Team";
  if (type.includes("pr") || type.includes("outreach") || type.includes("public relations")) return "PR and Outreach Team";
  if (type.includes("content")) return "Content Team";
  if (type.includes("video") || type.includes("edit") || type.includes("film") || type.includes("media")) return "Multimedia Team";
  if (type.includes("event") || type.includes("manage") || type.includes("plan")) return "Event Management Team";
  if (rawType.trim()) return rawType.trim().replace(/\b\w/g, (c) => c.toUpperCase());
  return "Other Team";
}

const toMembers = (rows: CouncilRow[]): CouncilMember[] =>
  rows.map((r, i) => ({ ...toMember(r, i), type: r["Council Type"]?.trim() || "" })).filter((m) => m.name);

type Category = "All" | "UHC" | "RC" | "Teams";

const CATEGORIES: { label: string; value: Category; icon: React.ReactNode }[] = [
  { label: "Everyone", value: "All", icon: <Award size={15} /> },
  { label: "Upper House", value: "UHC", icon: <Crown size={15} /> },
  { label: "Regional Coordinators", value: "RC", icon: <Users size={15} /> },
  { label: "Teams", value: "Teams", icon: <Globe size={15} /> },
];

const SUB_TEAMS = [
  { label: "All teams", value: "All", Icon: Globe },
  { label: "PR & Outreach", value: "PR and Outreach Team", Icon: Megaphone },
  { label: "Graphics", value: "Graphic Team", Icon: Palette },
  { label: "Event Management", value: "Event Management Team", Icon: Calendar },
  { label: "Content", value: "Content Team", Icon: PenTool },
  { label: "Multimedia", value: "Multimedia Team", Icon: Video },
  { label: "WebOps", value: "WebOps Team", Icon: Globe },
];

function teamMeta(name: string): { Icon: typeof Crown; tint: string; blurb: string } {
  const n = name.toLowerCase();
  if (n.includes("upper")) return { Icon: Crown, tint: "#eef1dc", blurb: "The house-wide roles that steer culture, events and community." };
  if (n.includes("lower")) return { Icon: Users, tint: "#eef1dc", blurb: "Regional coordinators who bring the house to every city." };
  if (n.includes("web")) return { Icon: Globe, tint: "#eef1dc", blurb: "The people who build and run this website." };
  if (n.includes("graphic")) return { Icon: Palette, tint: "#eef1dc", blurb: "Posters, stickers and everything the house looks like." };
  if (n.includes("content")) return { Icon: PenTool, tint: "#eef1dc", blurb: "Words for every post, announcement and story." };
  if (n.includes("pr")) return { Icon: Megaphone, tint: "#eef1dc", blurb: "Outreach, partnerships and getting the word out." };
  if (n.includes("multimedia")) return { Icon: Video, tint: "#eef1dc", blurb: "Reels, edits and Kaziranga Tak." };
  if (n.includes("event")) return { Icon: Calendar, tint: "#eef1dc", blurb: "Planning and running every session and contest." };
  return { Icon: Award, tint: "#eef1dc", blurb: "" };
}

const SOFT = [0.22, 1, 0.36, 1] as const;

function TeamBlock({ name, members, index }: { name: string; members: CouncilMember[]; index: number }) {
  const reduce = useReducedMotion();
  const { Icon, tint, blurb } = teamMeta(name);
  const upper = name === UPPER;

  return (
    <motion.section
      layout={!reduce}
      initial={reduce ? false : { opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20, transition: { duration: 0.2 } }}
      transition={{ duration: 0.6, delay: index * 0.05, ease: SOFT }}
      className={upper ? "relative isolate overflow-hidden rounded-[2.25rem] kz-jaali bg-[#00332a] px-5 py-12 text-[#f9fbe5] sm:px-10 md:rounded-[3rem] md:py-16" : "py-4"}
    >
      
      <div className="mb-8 flex flex-col gap-4 md:mb-10 md:flex-row md:items-end md:justify-between">
        <div className="flex items-center gap-4">
          <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl text-[#002820]" style={{ background: tint }}>
            <Icon size={24} />
          </span>
          <div>
            <RevealWords lines={[name]} className="kz-serif text-[clamp(1.6rem,3vw,2.3rem)]" />
            {blurb && <p className={`kz-body mt-1 ${upper ? "text-white/80" : "text-[#3f5a52]"}`}>{blurb}</p>}
          </div>
        </div>
        <span className={`kz-label ${upper ? "text-white/70" : "text-[#3f5a52]"}`}>
          {members.length} {members.length === 1 ? "member" : "members"}
        </span>
      </div>

      <div className={`grid grid-cols-1 gap-6 ${upper ? "mx-auto max-w-[64rem] sm:grid-cols-3" : "sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"}`}>
        {members.map((m, i) => (
          <motion.div
            key={m.id}
            initial={reduce ? false : { opacity: 0, y: 40, rotate: i % 2 ? 2 : -2 }}
            whileInView={{ opacity: 1, y: 0, rotate: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.7, delay: (i % 4) * 0.07, ease: SOFT }}
          >
            <FlipCard member={m} />
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
}

export default function CouncilPage() {
  const [members, setMembers] = useState<CouncilMember[]>(() => toMembers(getCachedCouncil() || []));
  const [loading, setLoading] = useState(() => !getCachedCouncil());
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useState<Category>("All");
  const [subTeam, setSubTeam] = useState("All");

  useEffect(() => {
    let alive = true;
    fetchCouncil()
      .then((rows) => alive && setMembers(toMembers(rows)))
      .catch((err) => alive && setError(err instanceof Error ? err.message : "Failed to load council"))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  const groups = useMemo(() => {
    const g: Record<string, CouncilMember[]> = {};
    for (const m of members) (g[teamOf(m.type)] ??= []).push(m);
    return g;
  }, [members]);

  const ordered = useMemo(
    () =>
      Object.keys(groups).sort((a, b) => {
        const ia = TEAM_ORDER.indexOf(a);
        const ib = TEAM_ORDER.indexOf(b);
        if (ia !== -1 && ib !== -1) return ia - ib;
        if (ia !== -1) return -1;
        if (ib !== -1) return 1;
        return a.localeCompare(b);
      }),
    [groups],
  );

  const shown = useMemo(() => {
    if (category === "UHC") return ordered.filter((n) => n === UPPER);
    if (category === "RC") return ordered.filter((n) => n === LOWER);
    if (category === "Teams") {
      const teams = ordered.filter((n) => n !== UPPER && n !== LOWER);
      return subTeam === "All" ? teams : teams.filter((n) => n === subTeam);
    }
    return ordered;
  }, [ordered, category, subTeam]);

  return (
    <div className="kz-font kz-paper min-h-screen bg-[#f9fbe5] text-[#002820] selection:bg-[#c10021]/20">
      <KzHeader />
      <main>
        <PageHero
          crumb="Council"
          label="Student council 2025–26"
          title={["The team behind", "the house"]}
          intro="The students leading culture, events and community. Tap any card to flip it over for their contact details."
          stickers={
            loading
              ? []
              : [
                  { value: String(members.length), label: "Council members" },
                  { value: String(ordered.length), label: "Teams" },
                  { value: String(groups[UPPER]?.length ?? 0), label: "Upper house" },
                ]
          }
        />

        <section className="relative mx-auto max-w-[90rem] px-5 sm:px-8 md:px-12">
          <Segmented
            id="council-cat"
            options={CATEGORIES}
            value={category}
            onChange={(v) => {
              setCategory(v);
              setSubTeam("All");
            }}
          />
          <AnimatePresence initial={false}>
            {category === "Teams" && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.4, ease: SOFT }}
                className="overflow-hidden"
              >
                <div className="flex flex-wrap gap-2 pt-4">
                  {SUB_TEAMS.map(({ label, value, Icon }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setSubTeam(value)}
                      className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-[0.85rem] font-semibold transition-all duration-300 ${
                        subTeam === value
                          ? "border-[#006255] bg-[#006255] text-white shadow-[0_10px_20px_-12px_rgba(0,98,85,0.8)]"
                          : "border-[#002820]/15 bg-transparent text-[#002820]/75 hover:border-[#002820]/35 hover:text-[#002820]"
                      }`}
                    >
                      <Icon size={14} /> {label}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        <div className="mx-auto max-w-[90rem] space-y-14 px-5 pb-24 pt-10 sm:px-8 md:space-y-20 md:px-12 md:pb-32">
          {loading && (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }, (_, i) => (
                <div key={i} className="aspect-[4/5] animate-pulse rounded-2xl bg-[#e6eedc]" />
              ))}
            </div>
          )}

          {error && !loading && (
            <div className="mx-auto flex max-w-md items-center gap-3 rounded-2xl border border-[#c10021]/25 bg-[#f9fbe5] p-5 text-[#8a0016]">
              <AlertTriangle size={20} className="shrink-0" />
              <span className="font-semibold">{error}</span>
            </div>
          )}

          {!loading && !error && (
            <AnimatePresence mode="popLayout">
              {shown.map((name, i) => (
                <TeamBlock key={`${category}-${subTeam}-${name}`} name={name} members={groups[name] || []} index={i} />
              ))}
            </AnimatePresence>
          )}

          {!loading && !error && shown.length === 0 && (
            <div className="mx-auto flex max-w-md flex-col items-center py-10 text-center">
              <Image src={RHINO_SRC} alt="" width={220} height={154} className="kz-float" />
              <h3 className="mt-6 text-[1.3rem] font-semibold">Council information is being updated</h3>
              <p className="kz-body mt-2 text-[#3f5a52]">Check back soon to meet the team.</p>
            </div>
          )}
        </div>
      </main>
      <KzFooter />
    </div>
  );
}
