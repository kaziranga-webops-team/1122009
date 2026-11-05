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
] as const;

export type ContentResource = (typeof CONTENT_RESOURCES)[number];

export type Action = 'read' | 'create' | 'update' | 'delete';

export interface PermissionContext {
  /**
   * For `council_members`, the row being written. An RC may edit the row that
   * describes them and no other, so the caller passes the row's id alongside
   * the id their own profile is linked to.
   */
  rowId?: string | null;
  ownRowId?: string | null;
}

const ADMIN_ROLES: UserRole[] = ['ADMIN', 'SUPER_ADMIN'];

/**
 * May `role` perform `action` on `resource`?
 *
 * - ADMIN / SUPER_ADMIN — everything.
 * - RC — full control of events, plus editing their own council row. Regional
 *   coordinators run events and maintain their own public profile; they have
 *   no reason to edit the gallery, the council roster or another person's row.
 * - USER — reads only. The public content is public; nothing here is secret.
 */
export function can(
  role: UserRole | undefined,
  resource: ContentResource,
  action: Action,
  ctx: PermissionContext = {}
): boolean {
  if (!role) return false;
  if (action === 'read') return true;
  if (ADMIN_ROLES.includes(role)) return true;

  if (role === 'RC') {
    if (resource === 'events') return true;

    // Own row only, and never create or delete a council entry — who sits on
    // the council is the admins' call, not the coordinator's.
    if (resource === 'council_members' && action === 'update') {
      const { rowId, ownRowId } = ctx;
      return Boolean(rowId && ownRowId && rowId === ownRowId);
    }
  }

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

export const ROLE_LABELS: Record<UserRole, string> = {
  USER: 'Member',
  RC: 'Regional Coordinator',
  ADMIN: 'Admin',
  SUPER_ADMIN: 'Super Admin',
};
