"use client";

import KzHeader from "@/components/kz/KzHeader";
import KzFooter from "@/components/kz/KzFooter";
import PageHero from "@/components/kz/PageHero";
import TakTV from "@/components/tak/TakTV";

export default function TakPage() {
  return (
    <div className="kz-font min-h-screen bg-[#1c130c] text-[#f5e9cf] selection:bg-[#e2387a]/30">
      <KzHeader ground="ink" />
      <main>
        <PageHero
          tone="ink"
          ground="rani"
          title={["Kaziranga Tak"]}
          intro="The house news show. Two reporters, one mic, and everything the group chat was talking about."
        />
        <TakTV />
      </main>
      <KzFooter />
    </div>
  );
}
