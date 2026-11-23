// ─────────────────────────────────────────────────────────────────────────────
// What each member sees first. Events carry one or more categories (Technical,
// Cultural, Sports, or something else); a member's past registrations say
// which they lean towards, and open events in those categories come first.
// ─────────────────────────────────────────────────────────────────────────────
import type { EventItem, Registration } from '@/types/portal';

export const CATEGORIES = ['Technical', 'Cultural', 'Sports', 'Other'] as const;
export type Category = (typeof CATEGORIES)[number];

/** The house categories an event belongs to ("Sports", "Cultural · Music" → Cultural). */
export function categoriesOf(e: Pick<EventItem, 'category'>): Category[] {
  const raw = (Array.isArray(e.category) ? e.category : [e.category]).map((c) => String(c || '').toLowerCase());
  const out = new Set<Category>();
  for (const c of raw) {
    if (c.includes('tech')) out.add('Technical');
    else if (c.includes('cultur')) out.add('Cultural');
    else if (c.includes('sport')) out.add('Sports');
    else out.add('Other');
  }
  if (!out.size) out.add('Other');
  return Array.from(out);
}

/**
 * The categories a member has registered for, most first. Withdrawn and
 * rejected registrations do not count: they say little about taste.
 */
export function favouriteCategories(regs: Registration[], events: EventItem[]): Category[] {
  const byId = new Map(events.map((e) => [e.id, e]));
  const counts = new Map<Category, number>();
  for (const r of regs) {
    if (r.status !== 'CONFIRMED' && r.status !== 'WAITLISTED') continue;
    const e = byId.get(r.eventId);
    if (!e) continue;
    for (const c of categoriesOf(e)) counts.set(c, (counts.get(c) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .filter(([c]) => c !== 'Other')
    .sort((a, b) => b[1] - a[1])
    .map(([c]) => c);
}

/** Open events in the member's favourite categories first, then by closing date. */
export function rankForYou(events: EventItem[], favourites: Category[]): EventItem[] {
  const score = (e: EventItem) => {
    const cats = categoriesOf(e);
    const i = favourites.findIndex((f) => cats.includes(f));
    return i === -1 ? favourites.length : i;
  };
  const closes = (e: EventItem) => new Date(e.registrationDeadline || e.startDateTime).getTime() || Infinity;
  return [...events].sort((a, b) => score(a) - score(b) || closes(a) - closes(b));
}

/** Is this event in one of the member's favourite categories? */
export const isForYou = (e: EventItem, favourites: Category[]) =>
  favourites.length > 0 && categoriesOf(e).some((c) => favourites.includes(c));
