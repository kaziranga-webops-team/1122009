'use client';

// ─────────────────────────────────────────────────────────────────────────────
// Browser-side calls to the admin content API.
//
// Every request carries a fresh Firebase ID token. Tokens last an hour, so
// getIdToken() is called per request rather than cached — the SDK returns the
// current one and refreshes it only when it is close to expiring.
// ─────────────────────────────────────────────────────────────────────────────
import { auth } from '@/lib/firebase';
import type { ContentResource } from '@/lib/portal/permissions';

export interface ContentRow extends Record<string, unknown> {
  id: string;
}

/** A failed call, carrying the server's own message and any field errors. */
export class ContentApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly fieldErrors?: Record<string, string[]>
  ) {
    super(message);
  }
}

async function authHeaders(): Promise<HeadersInit> {
  const user = auth?.currentUser;
  if (!user) throw new ContentApiError(401, 'You are signed out. Sign in again to continue.');
  const token = await user.getIdToken();
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
}

async function unwrap<T>(res: Response): Promise<T> {
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ContentApiError(
      res.status,
      (body as { error?: string }).error || `Request failed (${res.status})`,
      (body as { detail?: Record<string, string[]> }).detail
    );
  }
  return body as T;
}

const base = (resource: ContentResource) => `/api/admin/content/${resource}`;

export async function listContent(
  resource: ContentResource,
  opts: { q?: string; limit?: number; offset?: number } = {}
): Promise<{ rows: ContentRow[]; total: number }> {
  const params = new URLSearchParams();
  if (opts.q) params.set('q', opts.q);
  params.set('limit', String(opts.limit ?? 200));
  params.set('offset', String(opts.offset ?? 0));

  const res = await fetch(`${base(resource)}?${params}`, {
    headers: await authHeaders(),
    cache: 'no-store',
  });
  return unwrap(res);
}

export async function createContent(
  resource: ContentResource,
  data: Record<string, unknown>
): Promise<ContentRow> {
  const res = await fetch(base(resource), {
    method: 'POST',
    headers: await authHeaders(),
    body: JSON.stringify(data),
  });
  return (await unwrap<{ row: ContentRow }>(res)).row;
}

export async function updateContent(
  resource: ContentResource,
  id: string,
  data: Record<string, unknown>
): Promise<{ row: ContentRow; ignored: string[] }> {
  const res = await fetch(`${base(resource)}?id=${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: await authHeaders(),
    body: JSON.stringify(data),
  });
  return unwrap(res);
}

export async function deleteContent(resource: ContentResource, id: string): Promise<void> {
  const res = await fetch(`${base(resource)}?id=${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: await authHeaders(),
  });
  await unwrap(res);
}
