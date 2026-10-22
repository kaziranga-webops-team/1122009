"use client";

import KzHeader from "@/components/kz/KzHeader";
import KzFooter from "@/components/kz/KzFooter";
import SceneHero from "@/components/home/SceneHero";
import KzEvents from "@/components/home/KzEvents";
import KzCouncil from "@/components/home/KzCouncil";
import { AboutIntro, GrowPanel, JoinFinale, StartHere, WhatWeDo } from "@/components/home/sections";

/**
 * The illustrated homepage, ordered as a walkthrough for someone new:
 * who we are, the three steps in, what the house does, what's on, who runs
 * it, and the ways to stay in touch.
 *
 * The About section slides up over the hero on rounded corners, and the
 * colour blocks (council, footer) grow from inset cards to full width as
 * they arrive, so changes of colour read as chapters rather than cuts.
 */
export default function KzHome() {
  return (
    <div className="kz-font min-h-screen bg-[#f9fbe5] selection:bg-[#c6011f]/20 selection:text-[#002820]">
      <KzHeader overlay />
      <main>
        <SceneHero />
        <AboutIntro />
        <StartHere />
        <WhatWeDo />
        <KzEvents />
        <GrowPanel>
          <KzCouncil />
        </GrowPanel>
        <JoinFinale />
      </main>
      <GrowPanel>
        <KzFooter />
      </GrowPanel>
    </div>
  );
}
