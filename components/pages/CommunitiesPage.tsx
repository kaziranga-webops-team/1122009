"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import KzHeader from "@/components/kz/KzHeader";
import KzFooter from "@/components/kz/KzFooter";
import { Segmented } from "@/components/kz/PageHero";
import CommunityPatch from "@/components/communities/CommunityPatch";
import { fetchEvents, getCachedEvents } from "@/lib/api";
import { COMMUNITIES, GROUPS, type Community, type CommunityGroup } from "@/lib/communities";
import { toEvents } from "@/lib/events";

const SOFT = [0.22, 1, 0.36, 1] as const;

function CommunityCard({ c, events, index }: { c: Community; events: number; index: number }) {
  const reduce = useReducedMotion();
  return (
    <motion.li
      layout={!reduce}
      initial={reduce ? false : { opacity: 0, y: 26 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.15 } }}
      transition={{ duration: 0.5, delay: Math.min(index, 12) * 0.04, ease: SOFT }}
      className="group relative flex flex-col overflow-hidden rounded-[1.5rem] border border-[#002820]/10 bg-[#eef1dc] p-6 transition-[transform,box-shadow,border-color] duration-500 [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-1.5 hover:border-[#006255]/30 hover:shadow-[0_26px_44px_-30px_rgba(0,40,32,0.6)] md:p-7"
    >
      {/* a soft wash of the community's own colour behind its patch */}
      <span aria-hidden="true" className="absolute -right-14 -top-14 h-44 w-44 rounded-full opacity-35 transition-transform duration-700 group-hover:scale-125" style={{ background: c.bg }} />
      <span className="relative inline-block self-start transition-transform duration-500 [transition-timing-function:cubic-bezier(0.34,1.6,0.64,1)] group-hover:-rotate-[10deg] group-hover:scale-105">
        <CommunityPatch c={c} size={84} />
      </span>
      <span className="relative mt-6 text-[0.7rem] font-bold uppercase tracking-[0.14em] text-[#006255]">{c.focus}</span>
      <h3 className="kz-serif relative mt-1.5 text-[1.55rem] leading-tight">{c.name}</h3>
      <p className="kz-body relative mt-2 flex-1 text-[#3f5a52]">{c.line}</p>
      {events > 0 ? (
        <Link
          href={`/events?community=${c.slug}`}
          className="kz-focus relative mt-6 inline-flex items-center gap-2 self-start rounded-full text-[0.88rem] font-bold text-[#006255] after:absolute after:inset-0"
        >
          {events === 1 ? "See its event" : `See its ${events} events`}
          <ArrowRight size={16} className="transition-transform duration-300 group-hover:translate-x-1" />
        </Link>
      ) : (
        <span className="relative mt-6 text-[0.85rem] font-semibold text-[#3f5a52]/80">First event coming soon</span>
      )}
    </motion.li>
  );
}

export default function CommunitiesPage() {
  const [group, setGroup] = useState<"all" | CommunityGroup>("all");
  const [rows, setRows] = useState(() => getCachedEvents() || []);

  useEffect(() => {
    let alive = true;
    fetchEvents()
      .then((r) => alive && setRows(r))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  const eventCounts = useMemo(() => {
    const m = new Map<string, number>();
    for (const e of toEvents(rows)) if (e.community) m.set(e.community.slug, (m.get(e.community.slug) ?? 0) + 1);
    return m;
  }, [rows]);

  const shown = group === "all" ? COMMUNITIES : COMMUNITIES.filter((c) => c.group === group);

  return (
    <div className="kz-font kz-paper min-h-screen bg-[#f9fbe5] text-[#002820] selection:bg-[#c10021]/20">
      <KzHeader />
      <main className="pt-[var(--kz-header-h)]">
        <section className="mx-auto max-w-[90rem] px-5 pb-6 pt-8 sm:px-8 md:px-12 md:pt-12">
          <h1 className="kz-serif flex flex-wrap items-baseline gap-x-4 text-[clamp(2.4rem,5vw,4rem)] leading-none">
            Communities
            <span className="-rotate-3 text-[clamp(1.2rem,2vw,1.6rem)] font-normal text-[#8a6522] [font-family:Caveat,cursive]">
              {COMMUNITIES.length} ways to find your people
            </span>
          </h1>
        </section>

        <section className="relative mx-auto max-w-[90rem] px-5 sm:px-8 md:px-12">
          <Segmented
            id="community-group"
            value={group}
            onChange={setGroup}
            options={[
              { label: "All", value: "all", count: COMMUNITIES.length },
              ...GROUPS.map((g) => ({ label: g.label, value: g.value, count: COMMUNITIES.filter((c) => c.group === g.value).length })),
            ]}
          />
        </section>

        <section className="mx-auto max-w-[90rem] px-5 pb-24 pt-8 sm:px-8 md:px-12 md:pb-32">
          <motion.ul layout className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            <AnimatePresence mode="popLayout">
              {shown.map((c, i) => (
                <CommunityCard key={c.slug} c={c} events={eventCounts.get(c.slug) ?? 0} index={i} />
              ))}
            </AnimatePresence>
          </motion.ul>
        </section>
      </main>
      <KzFooter />
    </div>
  );
}
