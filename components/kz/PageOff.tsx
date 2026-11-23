"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import KzHeader from "@/components/kz/KzHeader";
import KzFooter from "@/components/kz/KzFooter";

/** What a page switched off in the portal shows instead. */
export default function PageOff() {
  return (
    <div className="kz-font kz-paper flex min-h-screen flex-col bg-[#f5e9cf] text-[#1c130c]">
      <KzHeader />
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-start justify-center px-5 pb-20 pt-[calc(var(--kz-header-h)+3rem)]">
        <h1 className="kz-serif text-[clamp(2rem,5vw,3rem)] leading-tight">This page is not available right now</h1>
        <p className="kz-lead mt-3 text-[#5e4a35]">The house has taken it down for a while. Everything else is where it was.</p>
        <Link href="/" className="kz-btn kz-btn--forest kz-focus mt-8">
          Go to the home page <ArrowRight size={16} />
        </Link>
      </main>
      <KzFooter />
    </div>
  );
}
