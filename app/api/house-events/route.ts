import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/portal/firebase/admin';

export const revalidate = 300;

/**
 * The portal's events, for the public site: published and completed ones
 * only, and only what a card needs. Signing up still happens in the portal.
 * Cached for five minutes, so visitors never cost a database read each.
 */
export async function GET() {
  if (!adminDb) return NextResponse.json([]);
  try {
    const snap = await adminDb.collectionGroup('events').get();
    const rows = snap.docs
      .filter(
        (d) =>
          d.ref.path.startsWith('tenures/') &&
          ['PUBLISHED', 'COMPLETED'].includes(String(d.get('status'))) &&
          // Internal events are for the portal only.
          d.get('showOnWebsite') !== false
      )
      .map((d) => ({
        id: d.id,
        name: String(d.get('name') || ''),
        status: String(d.get('status')),
        category: d.get('category') ?? null,
        startDateTime: d.get('startDateTime') ?? null,
        registrationDeadline: d.get('registrationDeadline') ?? null,
        coverImageUrl: d.get('coverImageUrl') ?? null,
        // Plain text, trimmed: the card shows a few lines, the pop-up the rest.
        description: String(d.get('description') || '')
          .replace(/<\/(p|li|h\d)>/gi, '\n')
          .replace(/<br\s*\/?>/gi, '\n')
          .replace(/<[^>]*>/g, '')
          .replace(/&nbsp;/g, ' ')
          .replace(/&amp;/g, '&')
          .replace(/\n{3,}/g, '\n\n')
          .trim()
          .slice(0, 1200),
        winner: d.get('winner') ?? null,
        runnerUp1: d.get('runnerUp1') ?? null,
        runnerUp2: d.get('runnerUp2') ?? null,
        href: `/dashboard/events/${d.ref.parent.parent?.id}/subevents/${d.get('slug') || d.id}`,
      }))
      .filter((r) => r.name);
    return NextResponse.json(rows);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }
}
