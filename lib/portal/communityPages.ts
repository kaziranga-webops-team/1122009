// ─────────────────────────────────────────────────────────────────────────────
// Community pages: the parts of each community's public card its heads edit.
//
// The fixed facts (name, colours, icon, group) stay in lib/communities.ts. The
// words and links a head keeps current live in Firestore at communities/{slug}
// and are laid over those defaults wherever a community is shown.
// ─────────────────────────────────────────────────────────────────────────────
import type { Community } from '@/lib/communities';

export interface CommunityPage {
  /** Short subject line, e.g. "Cybersecurity". */
  focus?: string;
  /** One or two sentences about the community. */
  line?: string;
  /** Where to join: a WhatsApp group or form link. */
  joinUrl?: string;
  instagramUrl?: string;
  updatedAt?: string;
  updatedBy?: string;
}

export const COMMUNITY_PAGE_LIMITS = { focus: 40, line: 220 } as const;

/** The community as it should be shown: saved edits over the built-in defaults. */
export function withPage<T extends Community>(c: T, page?: CommunityPage | null): T & { joinUrl?: string; instagramUrl?: string } {
  if (!page) return c;
  return {
    ...c,
    focus: page.focus || c.focus,
    line: page.line || c.line,
    joinUrl: page.joinUrl || undefined,
    instagramUrl: page.instagramUrl || undefined,
  };
}

/** https only; anything else is dropped rather than rendered as a link. */
export function cleanHttpsUrl(v: unknown): string {
  if (typeof v !== 'string' || !v.trim()) return '';
  try {
    const u = new URL(v.trim());
    return u.protocol === 'https:' ? u.toString() : '';
  } catch {
    return '';
  }
}
