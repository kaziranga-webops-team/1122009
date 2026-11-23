"use client";

import KzHeader from "@/components/kz/KzHeader";
import KzFooter from "@/components/kz/KzFooter";
import KzEvents from "@/components/home/KzEvents";
import KzCouncil from "@/components/home/KzCouncil";
import KzCommunities from "@/components/home/KzCommunities";
import { ChapterRail, ComeHome, Gatherings, PosterHero, PosterWall, TheLand, ThreeSteps } from "@/components/home/Story";
import { useHiddenSections } from "@/lib/siteSections";

/**
 * The homepage, told as a story for someone arriving for the first time:
 * the poster that says where we are, the floodplain we're named for, the
 * three steps in, what the house does, its communities and events, the
 * people who run it, and the way home.
 */
export default function KzHome() {
  // Sections switched off in the portal (Website → Sections) are left out.
  const hidden = useHiddenSections();
  const on = (name: string) => !hidden.has(`Home · ${name}`);
  return (
    <div className="kz-font kz-paper min-h-screen bg-[#f5e9cf] selection:bg-[#e2387a]/30 selection:text-[#1c130c]">
      <KzHeader ground="color" />
      <ChapterRail />
      <main>
        <PosterHero />
        {on("Named for a floodplain") && <TheLand />}
        {on("Three steps into the house") && <ThreeSteps />}
        {on("What the house does") && <Gatherings />}
        {on("Poster wall") && <PosterWall />}
        {on("Communities") && <KzCommunities />}
        {on("Lately in the house") && <KzEvents />}
        {on("Council") && <KzCouncil />}
        {on("Join the house") && <ComeHome />}
      </main>
      <KzFooter ask under="#1c130c" />
    </div>
  );
}
