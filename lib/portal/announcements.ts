// ─────────────────────────────────────────────────────────────────────────────
// Announcements: short posts from the people who run the house, shown on the
// home page. Shared by the browser (what to offer) and the API (what to allow);
// only the API's answer is a security boundary.
//
// Who may post where:
// - Admins and RCs: the whole house, one region, or any community.
// - Community heads: the communities they lead.
// - Members: nowhere.
// Only admins pin. Authors and admins remove.
// ─────────────────────────────────────────────────────────────────────────────
import type { UserRole } from '@/types/portal';
import { REGIONS, toRegion } from '@/lib/portal/regions';

export type AnnouncementAudience = 'HOUSE' | 'REGION' | 'COMMUNITY';

export interface Announcement {
  id: string;
  title: string;
  body: string;
  /** An internal path ("/dashboard/events") or an https link. */
  linkUrl: string | null;
  audience: AnnouncementAudience;
  region: string | null;
  communitySlug: string | null;
  pinned: boolean;
  authorUid: string;
  authorName: string;
  authorRole: UserRole;
  createdAt: string;
}

export const ANNOUNCEMENT_LIMITS = { title: 120, body: 1000 } as const;

interface Scope {
  role: UserRole | undefined;
  communitySlugs?: string[];
}

const isAdmin = (role?: UserRole) => role === 'ADMIN' || role === 'SUPER_ADMIN';
const runsHouse = (role?: UserRole) => isAdmin(role) || role === 'RC';

/** Where this person may post: used to build the composer's choices. */
export function announceTargets(scope: Scope): {
  house: boolean;
  regions: readonly string[];
  /** `null` means every community. */
  communities: string[] | null;
} {
  if (runsHouse(scope.role)) return { house: true, regions: REGIONS, communities: null };
  if (scope.role === 'COMMUNITY_HEAD') return { house: false, regions: [], communities: scope.communitySlugs ?? [] };
  return { house: false, regions: [], communities: [] };
}

export function canAnnounce(scope: Scope): boolean {
  const t = announceTargets(scope);
  return t.house || t.communities === null || t.communities.length > 0;
}

export function canPostTo(
  scope: Scope,
  target: { audience: AnnouncementAudience; region?: string | null; communitySlug?: string | null }
): boolean {
  const t = announceTargets(scope);
  if (target.audience === 'HOUSE') return t.house;
  if (target.audience === 'REGION') return Boolean(target.region && t.regions.includes(target.region));
  if (target.audience === 'COMMUNITY') {
    if (!target.communitySlug) return false;
    return t.communities === null || t.communities.includes(target.communitySlug);
  }
  return false;
}

export const canPin = (role?: UserRole) => isAdmin(role);

export function canRemoveAnnouncement(user: { uid: string; role?: UserRole }, a: Pick<Announcement, 'authorUid'>) {
  return a.authorUid === user.uid || isAdmin(user.role);
}

/** Region posts reach that region's members; everything else reaches everyone. */
export function isForMember(a: Pick<Announcement, 'audience' | 'region'>, memberRegion?: string | null): boolean {
  if (a.audience !== 'REGION') return true;
  return Boolean(a.region) && a.region === toRegion(memberRegion);
}

/** Internal paths, or https links. Nothing else is ever rendered as a link. */
export function isSafeLink(url: string): boolean {
  if (url.startsWith('/') && !url.startsWith('//')) return true;
  try {
    return new URL(url).protocol === 'https:';
  } catch {
    return false;
  }
}
