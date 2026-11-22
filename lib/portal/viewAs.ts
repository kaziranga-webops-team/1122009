'use client';

// The role someone has chosen to view the portal as, kept for this browser tab
// only, so closing the tab always returns them to their own role.
import type { UserRole } from '@/types/portal';
import { VIEW_AS_COMMUNITY_HEADER, VIEW_AS_HEADER } from '@/lib/portal/roles';

export interface ViewAs {
  role: UserRole;
  community?: string | null;
}

const KEY = 'kz-view-as';

export function readViewAs(): ViewAs | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as ViewAs) : null;
  } catch {
    return null;
  }
}

export function writeViewAs(value: ViewAs | null): void {
  try {
    if (value) sessionStorage.setItem(KEY, JSON.stringify(value));
    else sessionStorage.removeItem(KEY);
  } catch {
    // Private mode or blocked storage: the switch still works until reload.
  }
}

/** Headers that tell the server which role this request should act with. */
export function viewAsHeaders(): Record<string, string> {
  const v = readViewAs();
  if (!v) return {};
  return {
    [VIEW_AS_HEADER]: v.role,
    ...(v.community ? { [VIEW_AS_COMMUNITY_HEADER]: v.community } : {}),
  };
}
