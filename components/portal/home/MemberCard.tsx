'use client';

import React, { useEffect, useState } from 'react';
import { fetchCouncil, getCachedCouncil } from '@/lib/api';
import { joinNames, rcsByRegion } from '@/lib/rcs';
import Link from 'next/link';
import { RegionArt, REGION_THEMES } from './RegionArt';
import { toRegion } from '@/lib/portal/regions';
import { ROLE_LABELS } from '@/lib/portal/permissions';
import { communityBySlug } from '@/lib/communities';
import type { UserProfile, UserRole } from '@/types/portal';

const PAPER = '#f5e9cf';
const INK = '#1c130c';
const DISPLAY = { fontFamily: 'var(--kz-f-display)', fontWeight: 400 } as const;

/** The roll number is the part of the institute email before the @. */
export function rollNumberOf(email?: string): string {
  return (email?.split('@')[0] || '').toUpperCase();
}

interface MemberCardProps {
  user: Pick<UserProfile, 'name' | 'email' | 'region' | 'avatarUrl' | 'communitySlugs'>;
  /** The account's own role, not a "view as" preview. */
  role: UserRole;
  tenure?: string;
}

const Portrait: React.FC<{ name: string; src?: string; className: string }> = ({ name, src, className }) =>
  src ? (
    <img src={src} alt="" referrerPolicy="no-referrer" className={`${className} object-cover`} />
  ) : (
    <span className={`${className} grid place-items-center bg-[#0f5e48] text-[#f5e9cf]`} style={DISPLAY}>
      {name.charAt(0).toUpperCase()}
    </span>
  );

/**
 * The member's house card, printed like a poster ticket: their region's
 * landmark on the left, who they are on the right. A slim strip on phones.
 */
export const MemberCard: React.FC<MemberCardProps> = ({ user, role, tenure = '2026–27' }) => {
  const region = toRegion(user.region);
  const art = region || 'Other';
  const theme = REGION_THEMES[art];
  const roll = rollNumberOf(user.email);
  const [rcs, setRcs] = useState(() => rcsByRegion(getCachedCouncil() || []));
  useEffect(() => {
    fetchCouncil()
      .then((rows) => setRcs(rcsByRegion(rows)))
      .catch(() => {});
  }, []);
  const myRcs = region ? rcs[region] ?? [] : [];
  const roleLabel = ROLE_LABELS[role] ?? 'Member';
  const communities = (user.communitySlugs ?? [])
    .map((s) => communityBySlug(s)?.name)
    .filter(Boolean)
    .join(', ');

  const regionLine = region ? (
    region
  ) : (
    <Link href="/dashboard/profile" className="underline underline-offset-2">
      Add your city
    </Link>
  );

  return (
    <article
      aria-label={`House card for ${user.name}`}
      className="rounded-[18px] overflow-hidden border-2"
      style={{ background: PAPER, color: INK, borderColor: INK, boxShadow: `4px 4px 0 ${INK}` }}
    >
      {/* ─── Phones: one compact strip ─── */}
      <div className="flex sm:hidden items-stretch h-[84px]">
        <div className="relative w-[84px] shrink-0 border-r-2" style={{ borderColor: INK }}>
          <RegionArt region={art} sizes="84px" className="absolute inset-0 w-full h-full" />
        </div>
        <div className="flex-1 min-w-0 flex items-center gap-3 px-3.5">
          <Portrait name={user.name} src={user.avatarUrl} className="w-11 h-11 rounded-lg shrink-0 border-2 border-white" />
          <div className="min-w-0">
            <p className="text-[1.0625rem] leading-tight truncate" style={DISPLAY}>
              {user.name}
            </p>
            <p className="text-[0.75rem] font-semibold opacity-75 truncate">
              {roleLabel} · {regionLine}
            </p>
            {roll && <p className="text-[0.6875rem] font-mono opacity-60 truncate mt-0.5">{roll}</p>}
          </div>
        </div>
      </div>

      {/* ─── Tablet and up: the full ticket ─── */}
      <div className="hidden sm:grid grid-cols-[minmax(0,42%)_minmax(0,1fr)] min-h-[184px]">
        <div className="relative border-r-2 border-dashed" style={{ borderColor: INK }}>
          <RegionArt region={art} sizes="(min-width: 1024px) 340px, 42vw" className="absolute inset-0 w-full h-full" />
          {/* The artwork leaves its sky empty; the city's name is printed there. */}
          <span
            className="absolute left-4 top-3 text-[1.875rem] leading-none"
            style={{ ...DISPLAY, color: theme.label, textShadow: `2px 2px 0 ${theme.accent}` }}
          >
            {region === 'Other' ? 'Kaziranga' : region || 'Your city'}
          </span>
        </div>

        <div className="flex flex-col p-5 gap-4 min-w-0">
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-[1.0625rem]" style={DISPLAY}>
              Kaziranga House
            </span>
            <span className="text-[0.75rem] font-semibold opacity-60 nums shrink-0">{tenure}</span>
          </div>

          <div className="flex items-center gap-3.5 min-w-0">
            <Portrait
              name={user.name}
              src={user.avatarUrl}
              className="w-16 h-16 rounded-xl shrink-0 border-[3px] border-white shadow-[0_6px_14px_-8px_rgba(28,19,12,0.6)]"
            />
            <div className="min-w-0">
              <p className="text-[1.5rem] leading-[1.1] truncate" style={DISPLAY}>
                {user.name}
              </p>
              <p className="text-[0.8125rem] font-semibold opacity-75 truncate">{roleLabel}</p>
            </div>
          </div>

          <dl className="mt-auto grid grid-cols-3 gap-3 pt-3 border-t border-dashed" style={{ borderColor: `${INK}55` }}>
            <div className="min-w-0">
              <dt className="text-[0.6875rem] opacity-60">Roll no.</dt>
              <dd className="text-[0.8125rem] font-mono font-semibold truncate">{roll || '—'}</dd>
            </div>
            <div className="min-w-0">
              <dt className="text-[0.6875rem] opacity-60">Region</dt>
              <dd className="text-[0.8125rem] font-semibold truncate">{regionLine}</dd>
            </div>
            <div className="min-w-0">
              <dt className="text-[0.6875rem] opacity-60">{communities ? 'Community' : myRcs.length > 1 ? 'Your RCs' : 'Your RC'}</dt>
              <dd className="text-[0.8125rem] font-semibold truncate" title={communities || joinNames(myRcs)}>
                {communities || joinNames(myRcs) || '—'}
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </article>
  );
};
