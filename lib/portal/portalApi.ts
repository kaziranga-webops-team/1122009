'use client';

// ─────────────────────────────────────────────────────────────────────────────
// Browser-side calls to the portal's own API (/api/portal/*). Each request
// carries a fresh ID token and any "view as" headers, like the content API.
// ─────────────────────────────────────────────────────────────────────────────
import { auth } from '@/lib/firebase';
import { viewAsHeaders } from '@/lib/portal/viewAs';
import type { Notice } from '@/lib/portal/notices';
import type { AnnouncementAudience } from '@/lib/portal/announcements';

export class PortalApiError extends Error {
  constructor(readonly status: number, message: string) {
    super(message);
  }
}

async function request<T>(path: string, method: string, body?: unknown): Promise<T> {
  const user = auth?.currentUser;
  if (!user) throw new PortalApiError(401, 'You are signed out. Sign in again to continue.');
  const token = await user.getIdToken();
  const res = await fetch(path, {
    method,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', ...viewAsHeaders() },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new PortalApiError(res.status, (data as { error?: string }).error || `Request failed (${res.status})`);
  return data as T;
}

/**
 * Ask the server to send a notice. Best effort: the change it describes is
 * already saved, so a failure is logged rather than shown as a failed action.
 */
export async function sendNotice(notice: Notice): Promise<void> {
  try {
    await request('/api/portal/notices', 'POST', notice);
  } catch (err) {
    console.warn(`[notice] ${notice.kind} not sent:`, err);
  }
}

export interface AnnouncementInput {
  title: string;
  body: string;
  linkUrl?: string;
  audience: AnnouncementAudience;
  region?: string | null;
  communitySlug?: string | null;
  pinned?: boolean;
}

export const postAnnouncement = (input: AnnouncementInput) =>
  request<{ id: string }>('/api/portal/announcements', 'POST', input);

export const setAnnouncementPinned = (id: string, pinned: boolean) =>
  request<{ ok: true }>('/api/portal/announcements', 'PATCH', { id, pinned });

export const removeAnnouncement = (id: string) =>
  request<{ ok: true }>(`/api/portal/announcements?id=${encodeURIComponent(id)}`, 'DELETE');

export interface CommunityPageInput {
  slug: string;
  focus: string;
  line: string;
  joinUrl: string;
  instagramUrl: string;
}

export const saveCommunityPage = (input: CommunityPageInput) =>
  request<{ ok: true }>('/api/portal/communities', 'PUT', input);
