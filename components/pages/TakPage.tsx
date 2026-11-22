"use client";

import ReelSection from "@/components/ReelSection";
import KzHeader from "@/components/kz/KzHeader";
import KzFooter from "@/components/kz/KzFooter";
import PageHero from "@/components/kz/PageHero";

export default function TakPage() {
  return (
    <div className="kz-font kz-paper min-h-screen bg-[#1c130c] text-[#f5e9cf] selection:bg-[#e2387a]/30">
      <KzHeader />
      <main>
        <PageHero ground="cobalt" title={["Kaziranga Tak"]} intro="Two members, a recorder, and endless group chat chaos. Catch every episode of the house podcast." />
        <ReelSection />
      </main>
      <KzFooter />
    </div>
  );
}
