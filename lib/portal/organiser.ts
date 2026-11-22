// ─────────────────────────────────────────────────────────────────────────────
// What an event organiser may see and do from the browser.
//
// Admins and RCs run every event. A community head runs only the events tagged
// with a community they lead, so every Firestore read they make has to carry
// that filter: the security rules refuse a query they cannot prove is limited
// to the head's own communities, they do not filter it for us.
// ─────────────────────────────────────────────────────────────────────────────
import { collection, doc, query, setDoc, where, type Query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getAllEventsGroupRef, getAllRegistrationsGroupRef } from '@/lib/portal/firebase/paths';
import { canUsePortalAdmin } from '@/lib/portal/permissions';
import type { UserProfile, UserRole } from '@/types/portal';

type Organiser = Pick<UserProfile, 'role' | 'communitySlugs'>;

/**
 * The communities this person's event screens are limited to: `null` when
 * they see every event, a list (possibly empty) for a community head.
 * Firestore's `in` filter takes at most 30 values; no head leads that many.
 */
export function organiserCommunities(user: Organiser | null | undefined): string[] | null {
  if (!user) return [];
  if (canUsePortalAdmin(user.role)) return null;
  if (user.role === 'COMMUNITY_HEAD') return (user.communitySlugs ?? []).slice(0, 30);
  return [];
}

/** Events this organiser manages, or `null` when they manage none. */
export function organiserEventsQuery(user: Organiser | null | undefined): Query | null {
  const slugs = organiserCommunities(user);
  if (slugs === null) return getAllEventsGroupRef();
  if (slugs.length === 0) return null;
  return query(getAllEventsGroupRef(), where('communitySlug', 'in', slugs));
}

/** Registrations this organiser may read, or `null` when they may read none. */
export function organiserRegistrationsQuery(user: Organiser | null | undefined): Query | null {
  const slugs = organiserCommunities(user);
  if (slugs === null) return getAllRegistrationsGroupRef();
  if (slugs.length === 0) return null;
  return query(getAllRegistrationsGroupRef(), where('communitySlug', 'in', slugs));
}

/**
 * Whether this role sends the house-wide notices that go out when an event is
 * published, removed or rescheduled. Heads do not (yet): broadcasting to the
 * whole house moves to a server-side announcements flow.
 */
export function canBroadcast(role: UserRole | undefined): boolean {
  return canUsePortalAdmin(role);
}

/**
 * Send one notification, best effort. The event change it describes has
 * already been saved, so a failed notice is logged rather than reported as a
 * failed save.
 */
export async function postNotice(
  role: UserRole | undefined,
  data: Record<string, unknown>
): Promise<void> {
  if (!canBroadcast(role)) return;
  try {
    const ref = doc(collection(db, 'notifications'));
    await setDoc(ref, { id: ref.id, read: false, createdAt: new Date().toISOString(), ...data });
  } catch (err) {
    console.error('Notification not sent:', err);
  }
}
