'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown, Eye, Undo2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { ROLE_LABELS } from '@/lib/portal/permissions';
import { VIEW_AS_OPTIONS } from '@/lib/portal/roles';
import { COMMUNITIES, communityBySlug } from '@/lib/communities';
import type { UserRole } from '@/types/portal';
import { cn } from '@/lib/utils';

const HINTS: Record<UserRole, string> = {
  SUPER_ADMIN: 'Everything, including roles and access',
  ADMIN: 'Events, registrations and site content',
  RC: 'All events and registrations',
  COMMUNITY_HEAD: "One community's page, events and results",
  USER: 'What every member sees',
};

/**
 * "Viewing as" control for the top bar. Lists the roles the signed-in person
 * may switch the portal into — always lower than their own — and, for
 * Community Head, which community to preview. Hidden for plain members.
 */
export const ViewAsSwitcher: React.FC = () => {
  const { realRole, viewAs, setViewAs } = useAuth();
  const [open, setOpen] = useState(false);
  const [pickCommunity, setPickCommunity] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  useEffect(() => {
    if (!open) setPickCommunity(false);
  }, [open]);

  if (!realRole || VIEW_AS_OPTIONS[realRole].length === 0) return null;

  const current = viewAs?.role ?? realRole;
  const options: UserRole[] = [realRole, ...VIEW_AS_OPTIONS[realRole]];
  // A real community head previews as themselves; anyone else picks a community.
  const needsCommunity = realRole !== 'COMMUNITY_HEAD';

  const choose = async (role: UserRole, community?: string) => {
    if (role === 'COMMUNITY_HEAD' && needsCommunity && !community) {
      setPickCommunity(true);
      return;
    }
    await setViewAs(role, community ?? null);
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        title="Switch the role you view the portal as"
        aria-label={`Viewing as ${ROLE_LABELS[current]}. Switch role`}
        className={cn(
          'flex items-center gap-1.5 h-11 px-2.5 sm:px-3 rounded-xl border text-[0.8125rem] font-bold transition-colors',
          viewAs
            ? 'border-signal-warn/40 bg-signal-warn/10 text-signal-warn'
            : 'border-hairline text-ink-muted hover:text-ink hover:border-hairline-strong'
        )}
      >
        <Eye className="w-4 h-4 shrink-0" aria-hidden />
        <span className="hidden xl:inline">Viewing as</span>
        <span className="hidden sm:inline max-w-[9rem] truncate text-ink">{ROLE_LABELS[current]}</span>
        <ChevronDown className={cn('w-3.5 h-3.5 transition-transform', open && 'rotate-180')} aria-hidden />
      </button>

      {open && (
        <div
          role="menu"
          aria-label="View the portal as"
          className="fixed inset-x-3 top-[4.75rem] sm:absolute sm:inset-x-auto sm:right-0 sm:top-[calc(100%+0.5rem)] z-50 sm:w-[19rem] max-h-[70vh] overflow-y-auto rounded-2xl border border-hairline bg-surface-raised p-1.5 shadow-e-4"
        >
          {!pickCommunity ? (
            <>
              <p className="px-3 pb-1.5 pt-2 text-[0.75rem] text-ink-muted">
                Preview the portal as a lower role. Actions use that role&apos;s permissions.
              </p>
              {options.map((role) => {
                const active = role === current;
                const own = role === realRole;
                return (
                  <button
                    key={role}
                    type="button"
                    role="menuitemradio"
                    aria-checked={active}
                    onClick={() => choose(role)}
                    className={cn(
                      'w-full flex items-start gap-2.5 rounded-xl px-3 py-2.5 text-left transition-colors',
                      active ? 'bg-brand-soft' : 'hover:bg-surface-sunken'
                    )}
                  >
                    <span className="mt-0.5 w-4 shrink-0">{active && <Check className="w-4 h-4 text-brand" aria-hidden />}</span>
                    <span className="min-w-0">
                      <span className="block text-[0.875rem] font-bold text-ink">
                        {ROLE_LABELS[role]}
                        {own && <span className="ml-1.5 text-[0.75rem] font-semibold text-ink-muted">(you)</span>}
                      </span>
                      <span className="block text-[0.75rem] text-ink-muted">{HINTS[role]}</span>
                    </span>
                  </button>
                );
              })}
            </>
          ) : (
            <>
              <p className="px-3 pb-1.5 pt-2 text-[0.75rem] text-ink-muted">Which community do you want to preview?</p>
              <div className="max-h-72 overflow-y-auto" data-lenis-prevent>
                {COMMUNITIES.map((c) => (
                  <button
                    key={c.slug}
                    type="button"
                    role="menuitem"
                    onClick={() => choose('COMMUNITY_HEAD', c.slug)}
                    className="w-full rounded-xl px-3 py-2 text-left text-[0.875rem] font-semibold text-ink hover:bg-surface-sunken"
                  >
                    {c.name}
                    <span className="ml-1.5 text-[0.75rem] font-normal text-ink-muted">{c.focus}</span>
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setPickCommunity(false)}
                className="mt-1 w-full rounded-xl px-3 py-2 text-left text-[0.8125rem] text-ink-muted hover:bg-surface-sunken"
              >
                ← Back to roles
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};

/** Full-width notice while the portal is shown as another role, with the way back. */
export const ViewAsBanner: React.FC = () => {
  const { realRole, viewAs, setViewAs } = useAuth();
  if (!realRole || !viewAs) return null;

  const community = viewAs.community ? communityBySlug(viewAs.community) : undefined;

  return (
    <div role="status" className="bg-signal-warn/15 border-b border-signal-warn/30 px-[var(--gutter,1rem)] py-2">
      <div className="mx-auto flex max-w-[1680px] flex-wrap items-center justify-between gap-x-4 gap-y-1.5 px-3 sm:px-4">
        <p className="flex items-center gap-2 text-[0.8125rem] text-ink">
          <Eye className="w-4 h-4 shrink-0 text-signal-warn" aria-hidden />
          <span>
            You&apos;re viewing the portal as <strong>{ROLE_LABELS[viewAs.role]}</strong>
            {community && (
              <>
                {' '}
                of <strong>{community.name}</strong>
              </>
            )}
            . Actions use that role&apos;s permissions.
          </span>
        </p>
        <button
          type="button"
          onClick={() => setViewAs(realRole)}
          className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-[0.8125rem] font-bold text-ink bg-surface-raised border border-hairline hover:border-hairline-strong"
        >
          <Undo2 className="w-3.5 h-3.5" aria-hidden />
          Back to {ROLE_LABELS[realRole]}
        </button>
      </div>
    </div>
  );
};
