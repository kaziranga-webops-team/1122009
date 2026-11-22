'use client';

import React from 'react';
import Link from 'next/link';
import { Trophy, Calendar, MapPin, ArrowUpRight, Award, Medal } from 'lucide-react';
import { EventItem } from '@/types/portal';
import { Card } from '@/components/portal/ui/Card';
import { Badge } from '@/components/portal/ui/Badge';
import { formatDate } from '@/lib/portal/utils/formatDate';
import { getOptimizedImageUrl } from '@/lib/portal/utils/imageFormatter';
import { DEFAULT_MAIN_EVENT_ID } from '@/lib/portal/firebase/paths';

interface ResultCardProps {
  event: EventItem;
  className?: string;
}

const FALLBACK_COVER =
  'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800&auto=format&fit=crop&q=80';

export const ResultCard: React.FC<ResultCardProps> = ({ event, className }) => {
  const href = `/dashboard/events/${event.mainEventId || DEFAULT_MAIN_EVENT_ID}/subevents/${event.slug || event.id}`;
  const category = Array.isArray(event.category)
    ? event.category.join(' · ')
    : event.category;

  const hasPodium = Boolean(
    event.winner || event.runnerUp1 || event.runnerUp2 || event.honourableMentions
  );

  return (
    <Card
      as="article"
      hoverable
      elevation={1}
      className={`flex flex-col h-full group border border-hairline hover:border-hairline-strong transition-all ${
        className || ''
      }`}
    >
      {/* Cover image header */}
      <div className="relative aspect-[16/9] w-full bg-stage overflow-hidden shrink-0">
        <img
          src={getOptimizedImageUrl(event.coverImageUrl) || FALLBACK_COVER}
          alt=""
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-700 ease-editorial group-hover:scale-[1.04]"
          onError={(e) => {
            e.currentTarget.src = FALLBACK_COVER;
          }}
        />
        <div
          className="absolute inset-0 bg-linear-to-t from-stage via-stage/40 to-stage/10"
          aria-hidden
        />

        {/* Top Badges */}
        <div className="absolute top-3 inset-x-3 flex items-start justify-between gap-2 z-10">
          {category && (
            <span className="px-2.5 py-1 rounded-md bg-stage/85 backdrop-blur-md border border-white/15 text-[0.625rem] font-display font-bold uppercase tracking-wider text-white/90 truncate max-w-[65%]">
              {category}
            </span>
          )}

          <Badge tone="warn" solid size="sm" className="shrink-0 flex items-center gap-1 shadow-xs">
            <Trophy className="w-3 h-3 text-amber-200" aria-hidden />
            <span>Results Out</span>
          </Badge>
        </div>

        {/* Bottom concluded date badge */}
        <div className="absolute bottom-3 inset-x-3 z-10 flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-surface-raised/90 backdrop-blur-md border border-hairline text-ink text-[0.6875rem] font-mono font-medium">
            <Calendar className="w-3 h-3 text-ink-faint" />
            <span>Concluded {formatDate(event.endDateTime || event.startDateTime, false)}</span>
          </span>
        </div>
      </div>

      {/* Main card body */}
      <div className="flex-1 flex flex-col p-5 gap-4 justify-between">
        <div className="space-y-3">
          <h3 className="font-display font-extrabold text-body text-ink leading-snug clamp-2">
            <Link
              href={href}
              className="after:absolute after:inset-0 after:content-[''] hover:text-brand transition-colors"
            >
              {event.name}
            </Link>
          </h3>

          {/* Podium / Results showcase */}
          {hasPodium ? (
            <div className="p-3.5 rounded-xl bg-surface-sunken border border-hairline space-y-2.5">
              <span className="text-[0.625rem] font-bold uppercase tracking-wider text-ink-faint flex items-center gap-1.5">
                <Medal className="w-3.5 h-3.5 text-signal-warn" />
                Tournament Outcomes
              </span>

              <div className="space-y-1.5 text-caption">
                {event.winner && (
                  <div className="flex items-start gap-2">
                    <span className="text-base leading-none select-none">🥇</span>
                    <div className="min-w-0">
                      <span className="text-[0.625rem] uppercase font-bold text-signal-warn block leading-tight">
                        Winner
                      </span>
                      <span className="font-bold text-ink truncate block">
                        {event.winner}
                      </span>
                    </div>
                  </div>
                )}

                {event.runnerUp1 && (
                  <div className="flex items-start gap-2 pt-1 border-t border-hairline/60">
                    <span className="text-base leading-none select-none">🥈</span>
                    <div className="min-w-0">
                      <span className="text-[0.625rem] uppercase font-bold text-ink-faint block leading-tight">
                        1st Runner-up
                      </span>
                      <span className="font-semibold text-ink truncate block">
                        {event.runnerUp1}
                      </span>
                    </div>
                  </div>
                )}

                {event.runnerUp2 && (
                  <div className="flex items-start gap-2 pt-1 border-t border-hairline/60">
                    <span className="text-base leading-none select-none">🥉</span>
                    <div className="min-w-0">
                      <span className="text-[0.625rem] uppercase font-bold text-ink-faint block leading-tight">
                        2nd Runner-up
                      </span>
                      <span className="font-semibold text-ink truncate block">
                        {event.runnerUp2}
                      </span>
                    </div>
                  </div>
                )}

                {event.honourableMentions && (
                  <div className="flex items-start gap-2 pt-1 border-t border-hairline/60">
                    <span className="text-base leading-none select-none">🎖️</span>
                    <div className="min-w-0">
                      <span className="text-[0.625rem] uppercase font-bold text-ink-faint block leading-tight">
                        Honourable Mention
                      </span>
                      <span className="font-medium text-ink-muted truncate block">
                        {event.honourableMentions}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="p-3.5 rounded-xl bg-surface-sunken border border-hairline flex items-center gap-3">
              <Award className="w-5 h-5 text-signal-warn shrink-0" />
              <div className="min-w-0">
                <span className="text-caption font-semibold text-ink block">
                  Event Completed
                </span>
                <span className="text-micro text-ink-muted block truncate">
                  Scorecards and winner rankings verified by organizers.
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Card footer */}
        <div className="relative z-10 pt-3 border-t border-hairline flex items-center justify-between text-caption">
          {event.venue ? (
            <span className="flex items-center gap-1.5 text-ink-faint text-micro truncate max-w-[65%]">
              <MapPin className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{event.venue}</span>
            </span>
          ) : (
            <span />
          )}

          <Link
            href={href}
            className="inline-flex items-center gap-1 text-caption font-display font-bold text-ink-muted hover:text-brand transition-colors shrink-0"
          >
            Details
            <ArrowUpRight className="w-3.5 h-3.5" aria-hidden />
          </Link>
        </div>
      </div>
    </Card>
  );
};
