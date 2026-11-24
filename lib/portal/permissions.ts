// ─────────────────────────────────────────────────────────────────────────────
// One permission table, used by both sides.
//
// The client imports it to decide what to render; the server imports it to
// decide what to allow. Only the server's answer is a security boundary — the
// client's is a courtesy, so a button nobody may press is never shown. Any
// write path must call `can()` again after verifying the caller's ID token.
// ─────────────────────────────────────────────────────────────────────────────
import type { UserRole } from '@/types/portal';

/** The website content an admin-side user can act on. */
export const CONTENT_RESOURCES = [
  'events',
  'council_members',
  'gallery_items',
  'meetups',
  'episodes',
  'study_links',
  'revision_sessions',
  'academic_dates',
  'study_resources',
  'iitm_links',
  'course_channels',
  'site_images',
  'site_sections',
] as const;

export type ContentResource = (typeof CONTENT_RESOURCES)[number];

export type Action = 'read' | 'create' | 'update' | 'delete';

/** What a house admin may add, change and remove, besides events. */
const ADMIN_EDITS = new Set<ContentResource>([
  'meetups',
  'academic_dates',
  'study_links',
  'revision_sessions',
  'study_resources',
  'iitm_links',
  'course_channels',
]);

export interface PermissionContext {
  /**
   * For `council_members`, the row being written. An RC may edit the row that
   * describes them and no other, so the caller passes the row's id alongside
   * the id their own profile is linked to.
   */
  rowId?: string | null;
  ownRowId?: string | null;
}

/**
 * May `role` perform `action` on `resource`?
 *
 * The super admin changes everything on the public website. House admins run
 * the parts that change week to week: events, meetups and everything in the
 * Study zone (links, revision sessions, notes, the IITM corner, YouTube
 * channels and the academic calendar). Everyone can read it all.
 * `ctx` is kept for callers that pass a row, in case row-level editing
 * comes back.
 */
export function can(
  role: UserRole | undefined,
  resource: ContentResource,
  action: Action,
  _ctx: PermissionContext = {}
): boolean {
  if (!role) return false;
  if (action === 'read') return true;
  if (role === 'SUPER_ADMIN') return true;
  // Everyone who organises may add and edit the website's events and
  // sessions; removing one stays with the house admins.
  if (resource === 'events' && (role === 'ADMIN' || role === 'RC' || role === 'COMMUNITY_HEAD')) {
    return action !== 'delete' || role === 'ADMIN';
  }
  if (role === 'ADMIN' && ADMIN_EDITS.has(resource)) return true;
  return false;
}

/** Resources this role may write at all — drives what the sidebar offers. */
export function writableResources(role: UserRole | undefined): ContentResource[] {
  if (!role) return [];
  return CONTENT_RESOURCES.filter(
    (r) =>
      can(role, r, 'create') ||
      can(role, r, 'delete') ||
      // Ownership-scoped updates still mean the section is worth showing.
      can(role, r, 'update', { rowId: 'x', ownRowId: 'x' })
  );
}

/** Role-management and audit screens are the super admin's alone. */
export function canManageRoles(role: UserRole | undefined): boolean {
  return role === 'SUPER_ADMIN';
}

/** The event portal's own admin screens (registrations, portal events). */
export function canUsePortalAdmin(role: UserRole | undefined): boolean {
  return role === 'ADMIN' || role === 'SUPER_ADMIN' || role === 'RC';
}

/** Who may create and run events: the portal admins, plus community heads. */
export function canOrganiseEvents(role: UserRole | undefined): boolean {
  return canUsePortalAdmin(role) || role === 'COMMUNITY_HEAD';
}

/** The organiser screens a community head shares with the admins. */
const ORGANISER_PATHS = ['/admin/events', '/admin/registrations', '/admin/announcements', '/admin/community', '/admin/content'];

/** May this role open the given /admin path at all? */
export function canOpenAdminPath(role: UserRole | undefined, pathname: string): boolean {
  if (canUsePortalAdmin(role)) return true;
  if (role !== 'COMMUNITY_HEAD') return false;
  return ORGANISER_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

/**
 * May this identity run the given community's events, registrations, results
 * and page? Admins and RCs may run every community; a community head only
 * the ones they lead.
 */
export function canManageCommunity(
  scope: { role: UserRole | undefined; communitySlugs?: string[] },
  slug: string | null | undefined
): boolean {
  if (!slug) return false;
  if (canUsePortalAdmin(scope.role)) return true;
  return scope.role === 'COMMUNITY_HEAD' && (scope.communitySlugs ?? []).includes(slug);
}

export const ROLE_LABELS: Record<UserRole, string> = {
  USER: 'Member',
  COMMUNITY_HEAD: 'Community Head',
  RC: 'Regional Coordinator',
  ADMIN: 'Admin',
  SUPER_ADMIN: 'Super Admin',
};
