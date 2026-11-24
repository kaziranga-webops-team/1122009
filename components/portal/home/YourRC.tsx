'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Mail, MessageCircle, Phone } from 'lucide-react';
import { fetchCouncil, getCachedCouncil, toDirectImageUrl, type CouncilRow } from '@/lib/api';
import { currentCouncil, regionFromRole } from '@/lib/council';
import { toRegion } from '@/lib/portal/regions';
import { RegionArt } from './RegionArt';

interface RC {
  name: string;
  phone: string;
  email: string;
  image: string;
}

const digits = (p: string) => p.replace(/[^\d+]/g, '');
const whatsapp = (p: string) => {
  let d = p.replace(/\D/g, '');
  if (d.length === 10) d = `91${d}`;
  return `https://wa.me/${d}`;
};

/** This year's RCs for a region, from the public council list. */
function rcsFor(rows: CouncilRow[], region: string): RC[] {
  return currentCouncil(rows)
    .filter((r) => regionFromRole(String(r.Role || '')) === region)
    .map((r) => ({
      name: String(r.Name || '').trim(),
      phone: String(r.Phone || '').trim(),
      email: String(r.Email || '').trim(),
      image: toDirectImageUrl(String(r['Image URL'] || ''), 200),
    }))
    .filter((r) => r.name);
}

/** One of a contact card's quick actions: a coloured icon over its name, a big tap target. */
function QuickAction({
  href,
  label,
  icon: Icon,
  tint,
  aria,
  external = false,
}: {
  href: string;
  label: string;
  icon: React.ElementType;
  tint: string;
  aria: string;
  external?: boolean;
}) {
  return (
    <a
      href={href}
      aria-label={aria}
      {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      className="flex flex-col items-center justify-center gap-1.5 rounded-2xl bg-surface-sunken py-2.5 text-[0.75rem] font-semibold text-ink transition-transform duration-150 active:scale-95"
    >
      <span className="grid h-9 w-9 place-items-center rounded-full text-white" style={{ background: tint }}>
        <Icon className="h-[18px] w-[18px]" aria-hidden />
      </span>
      {label}
    </a>
  );
}

/**
 * The member's regional coordinator, with a way to reach them straight away.
 * A member who has not set a region is asked to, since that is what decides it.
 */
export const YourRC: React.FC<{ region?: string }> = ({ region: raw }) => {
  const region = toRegion(raw);
  const [rows, setRows] = useState<CouncilRow[]>(() => getCachedCouncil() || []);

  useEffect(() => {
    let live = true;
    fetchCouncil()
      .then((r) => live && setRows(r))
      .catch(() => {});
    return () => {
      live = false;
    };
  }, []);

  if (!region || region === 'Other') {
    return (
      <p className="flex flex-wrap items-center gap-x-2 rounded-xl border border-dashed border-hairline-strong px-4 py-2.5 text-[0.8125rem] text-ink-muted">
        <span className="font-semibold text-ink">Your regional coordinator:</span>
        <span>
          add your region in your{' '}
          <Link href="/dashboard/profile" className="font-semibold text-ink underline underline-offset-4">
            profile
          </Link>{' '}
          to see them.
        </span>
      </p>
    );
  }

  const rcs = rcsFor(rows, region);
  if (!rcs.length) return null;

  // A contact card, like a phone's: who your RC is, and three big quick
  // actions to reach them.
  return (
    <section
      aria-label={`Your regional coordinator in ${region}`}
      className="rounded-[22px] border border-hairline bg-surface-raised p-4 shadow-e-1 sm:p-5"
    >
      <ul className="divide-y divide-hairline">
        {rcs.map((rc) => (
          <li key={rc.name} className="flex flex-col gap-4 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:gap-6">
            <div className="flex min-w-0 flex-1 items-center gap-3.5">
              <span className="relative shrink-0">
                <span className="block h-16 w-16 overflow-hidden rounded-2xl bg-surface-sunken">
                  {rc.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={rc.image} alt="" loading="lazy" className="h-full w-full object-cover object-[50%_70%]" />
                  ) : (
                    <span className="grid h-full w-full place-items-center text-[1.4rem] font-bold text-ink-muted">{rc.name.charAt(0)}</span>
                  )}
                </span>
                {/* The region, as a small badge on the photo's corner. */}
                <span
                  className="absolute -bottom-1.5 -right-1.5 h-7 w-7 overflow-hidden rounded-full"
                  style={{ boxShadow: '0 0 0 2.5px rgb(var(--surface-raised))' }}
                  aria-hidden="true"
                >
                  <RegionArt region={region} sizes="28px" className="h-full w-full" />
                </span>
              </span>
              <span className="min-w-0">
                <span className="block text-[0.75rem] font-semibold text-brand">Your regional coordinator</span>
                <span className="block truncate font-display text-[1.125rem] font-bold leading-snug text-ink">{rc.name}</span>
                <span className="block text-[0.8125rem] text-ink-muted">{region}</span>
              </span>
            </div>

            {(rc.phone || rc.email) && (
              <div className="grid grid-cols-3 gap-2 sm:w-[17rem] sm:shrink-0">
                {rc.phone ? (
                  <QuickAction href={`tel:${digits(rc.phone)}`} label="Call" icon={Phone} tint="rgb(var(--brand))" aria={`Call ${rc.name}`} />
                ) : (
                  <span />
                )}
                {rc.phone ? (
                  <QuickAction href={whatsapp(rc.phone)} external label="WhatsApp" icon={MessageCircle} tint="#25d366" aria={`WhatsApp ${rc.name}`} />
                ) : (
                  <span />
                )}
                {rc.email ? (
                  <QuickAction href={`mailto:${rc.email}`} label="Email" icon={Mail} tint="#2343b8" aria={`Email ${rc.name}`} />
                ) : (
                  <span />
                )}
              </div>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
};
