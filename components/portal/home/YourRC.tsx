'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Mail, MessageCircle, Phone } from 'lucide-react';
import { fetchCouncil, getCachedCouncil, toDirectImageUrl, type CouncilRow } from '@/lib/api';
import { currentCouncil, regionFromRole } from '@/lib/council';
import { toRegion } from '@/lib/portal/regions';

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

  // A compact strip: who your RC is, and one tap to reach them.
  return (
    <section aria-label={`Your regional coordinator in ${region}`} className="rounded-xl border border-hairline bg-surface-raised px-3 py-2">
      <ul className="divide-y divide-hairline">
        {rcs.map((rc) => (
          <li key={rc.name} className="flex items-center gap-3 py-1.5">
            <span className="h-9 w-9 shrink-0 overflow-hidden rounded-full bg-surface-sunken">
              {rc.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={rc.image} alt="" loading="lazy" className="h-full w-full object-cover object-[50%_70%]" />
              ) : (
                <span className="grid h-full w-full place-items-center text-[0.875rem] font-bold text-ink-muted">{rc.name.charAt(0)}</span>
              )}
            </span>
            <p className="min-w-0 flex-1 text-[0.8125rem] leading-tight">
              <span className="block text-ink-muted">Your RC · {region}</span>
              <span className="block truncate font-semibold text-ink">{rc.name}</span>
            </p>
            {rc.phone && (
              <a href={`tel:${digits(rc.phone)}`} aria-label={`Call ${rc.name}`} title={rc.phone} className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-ink text-surface">
                <Phone className="h-4 w-4" aria-hidden />
              </a>
            )}
            {rc.phone && (
              <a href={whatsapp(rc.phone)} target="_blank" rel="noopener noreferrer" aria-label={`WhatsApp ${rc.name}`} className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#25d366] text-[#0b1a10]">
                <MessageCircle className="h-4 w-4" aria-hidden />
              </a>
            )}
            {rc.email && (
              <a href={`mailto:${rc.email}`} aria-label={`Email ${rc.name}`} className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-hairline text-ink-muted hover:text-ink">
                <Mail className="h-4 w-4" aria-hidden />
              </a>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
};
