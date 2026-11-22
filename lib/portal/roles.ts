// ─────────────────────────────────────────────────────────────────────────────
// Roles, and who may "view as" whom.
//
// Shared by browser and server. The browser keeps the role a person has chosen
// to view the portal as and sends it with every API call; the server accepts
// it only if this table allows it, so viewing as someone can only ever lower
// what you may do, never raise it.
// ─────────────────────────────────────────────────────────────────────────────
import type { UserRole } from '@/types/portal';

export const ALL_ROLES: UserRole[] = ['SUPER_ADMIN', 'ADMIN', 'RC', 'COMMUNITY_HEAD', 'USER'];

/** Roles each role may switch the portal into, besides its own. */
export const VIEW_AS_OPTIONS: Record<UserRole, UserRole[]> = {
  SUPER_ADMIN: ['ADMIN', 'RC', 'COMMUNITY_HEAD', 'USER'],
  ADMIN: ['RC', 'COMMUNITY_HEAD', 'USER'],
  RC: ['USER'],
  COMMUNITY_HEAD: ['USER'],
  USER: [],
};

export const VIEW_AS_HEADER = 'x-kz-view-as';
export const VIEW_AS_COMMUNITY_HEADER = 'x-kz-view-as-community';

export function canViewAs(realRole: UserRole, target: UserRole): boolean {
  return target === realRole || VIEW_AS_OPTIONS[realRole]?.includes(target) === true;
}

export interface RoleScope {
  role: UserRole;
  /** Communities this identity may run, when it is a COMMUNITY_HEAD. */
  communitySlugs: string[];
}

/**
 * The identity a request acts with. A real community head previewing as a
 * member loses their communities; an admin previewing as a community head is
 * given the one community they chose to preview, and no other.
 */
export function effectiveScope(
  real: RoleScope,
  requestedRole?: string | null,
  requestedCommunity?: string | null
): RoleScope {
  const role = requestedRole as UserRole | undefined;
  if (!role || !ALL_ROLES.includes(role) || !canViewAs(real.role, role) || role === real.role) {
    return real;
  }
  if (role === 'COMMUNITY_HEAD') {
    return { role, communitySlugs: requestedCommunity ? [requestedCommunity] : [] };
  }
  return { role, communitySlugs: [] };
}
