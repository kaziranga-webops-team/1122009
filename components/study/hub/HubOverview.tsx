import Link from "next/link";
import type { ReactNode } from "react";
import { AppWindow, ArrowRight, ArrowUpRight } from "lucide-react";
import PageHero from "@/components/kz/PageHero";
import { PanelLink } from "@/components/study/hub/parts";
import { HUB_GROUPS, HUB_ITEMS, INTERNAL_QUICK_LINKS, QUICK_LINKS, getHubHref, type HubItem } from "@/lib/study/hub";

/** Panel links keep the hub underneath; everything else is a normal link. */
function HubLink({ href, className, children }: { href: string; className: string; children: ReactNode }) {
  return href.includes("?open=") ? (
    <PanelLink href={href} className={className}>
      {children}
    </PanelLink>
  ) : (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}

const box =
  "flex h-full items-center justify-between gap-2 rounded-2xl border border-[#1c130c]/10 bg-[#ebd9b2] px-4 py-3";

function QuickText({ title, description }: { title: string; description: string }) {
  return (
    <span className="min-w-0">
      <span className="block truncate text-[0.88rem] font-bold text-[#1c130c]">{title}</span>
      <span className="block truncate text-[0.75rem] text-[#5e4a35]">{description}</span>
    </span>
  );
}

function QuickLinks() {
  return (
    <section aria-label="Quick links">
      <ul className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5">
        {QUICK_LINKS.map((link) => (
          <li key={link.id}>
            {link.url ? (
              <a
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`${box} kz-focus group transition-colors hover:border-[#0f5e48]/40`}
              >
                <QuickText title={link.title} description={link.description} />
                <ArrowUpRight size={15} className="shrink-0 text-[#5e4a35] group-hover:text-[#0f5e48]" aria-hidden="true" />
                <span className="sr-only">(opens in a new tab)</span>
              </a>
            ) : (
              <div className={`${box} opacity-70`} aria-label={`${link.title}, link coming soon`}>
                <QuickText title={link.title} description={link.description} />
                <span className="shrink-0 text-[0.7rem] font-bold uppercase tracking-[0.1em] text-[#5e4a35]">Soon</span>
              </div>
            )}
          </li>
        ))}
        {INTERNAL_QUICK_LINKS.map((link) => (
          <li key={link.title}>
            <HubLink href={link.href} className={`${box} kz-focus group transition-colors hover:border-[#0f5e48]/40`}>
              <QuickText title={link.title} description={link.description} />
              <ArrowRight size={15} className="shrink-0 text-[#5e4a35] transition-transform group-hover:translate-x-0.5 group-hover:text-[#0f5e48]" aria-hidden="true" />
            </HubLink>
          </li>
        ))}
      </ul>
    </section>
  );
}

const ACTION_LABEL: Record<HubItem["opens"], string> = { panel: "View", page: "Open", link: "Go to notes" };

function HubCard({ item }: { item: HubItem }) {
  const Icon = item.icon;
  return (
    <HubLink
      href={getHubHref(item)}
      className="kz-focus group relative flex h-full flex-col overflow-hidden rounded-[1.5rem] border border-[#1c130c]/10 bg-[#ebd9b2] p-6 transition-[transform,box-shadow,border-color] duration-500 [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-1.5 hover:border-[#0f5e48]/30 hover:shadow-[0_26px_44px_-30px_rgba(28,19,12,0.6)]"
    >
      <div className="flex items-start justify-between gap-3">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#0f5e48] text-[#f5e9cf] transition-transform duration-500 [transition-timing-function:cubic-bezier(0.34,1.6,0.64,1)] group-hover:-rotate-6 group-hover:scale-105">
          <Icon size={22} aria-hidden="true" />
        </span>
        {item.comingSoon && (
          <span className="rounded-full bg-[#e3a936]/25 px-2.5 py-1 text-[0.68rem] font-bold uppercase tracking-[0.08em] text-[#9c5d14]">Coming soon</span>
        )}
      </div>
      <h3 className="kz-serif mt-5 text-[1.4rem] leading-tight">{item.title}</h3>
      <p className="kz-body mt-1.5 flex-1 text-[#5e4a35]">{item.summary}</p>
      <span className="mt-5 inline-flex items-center gap-2 text-[0.88rem] font-bold text-[#0f5e48]">
        {ACTION_LABEL[item.opens]}
        {item.opens === "panel" ? (
          <AppWindow size={15} className="opacity-70" aria-hidden="true" />
        ) : (
          <ArrowRight size={16} className="transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true" />
        )}
      </span>
    </HubLink>
  );
}

export default function HubOverview() {
  return (
    <>
      <PageHero ground="cobalt" title={["Resource hub"]} />
      <div className="mx-auto max-w-[90rem] space-y-12 px-5 pb-24 pt-12 sm:px-8 md:px-12 md:pb-32">
        <QuickLinks />
        {HUB_GROUPS.map((group) => (
          <section key={group.id} aria-labelledby={`group-${group.id}`} className="space-y-4">
            <div>
              <h2 id={`group-${group.id}`} className="kz-serif text-[clamp(1.6rem,2.6vw,2.2rem)]">
                {group.title}
              </h2>
              <p className="kz-body mt-1 text-[#5e4a35]">{group.description}</p>
            </div>
            <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {HUB_ITEMS.filter((i) => i.group === group.id).map((item) => (
                <li key={item.slug}>
                  <HubCard item={item} />
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </>
  );
}
