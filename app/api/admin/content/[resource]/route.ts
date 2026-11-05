// ─────────────────────────────────────────────────────────────────────────────
// The admin panel's read/write endpoint for website content.
//
//   GET    ?limit&offset&q    list raw rows (with ids) for the editor
//   POST                      create a row
//   PATCH  ?id=…              update a row
//   DELETE ?id=…              delete a row
//
// Every verb verifies the caller's Firebase ID token, reads their role from
// Firestore, and re-checks `can()` on the server. The client's own permission
// checks only decide what to render; this is the boundary that actually holds.
// ─────────────────────────────────────────────────────────────────────────────
import { NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { ApiError, requireUser, writeAudit, type AuthedUser } from '@/lib/portal/apiAuth';
import { can, CONTENT_RESOURCES, type ContentResource } from '@/lib/portal/permissions';
import { restrictFields, schemaFor } from '@/lib/portal/contentSchema';

export const dynamic = 'force-dynamic';

const SUPABASE_URL = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').replace(/\/+$/, '');
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

/** Columns searched by the editor's search box, per resource. */
const SEARCH_COLUMNS: Record<ContentResource, string[]> = {
  events: ['title', 'category', 'speaker'],
  council_members: ['name', 'role', 'council_type'],
  gallery_items: ['student', 'category'],
  meetups: ['region', 'venue'],
  episodes: ['title', 'host'],
  study_links: ['degree'],
  revision_sessions: ['degree', 'level', 'exam_type'],
};

function parseResource(value: string): ContentResource {
  if (!(CONTENT_RESOURCES as readonly string[]).includes(value)) {
    throw new ApiError(404, `Unknown content type "${value}".`);
  }
  return value as ContentResource;
}

function assertConfigured() {
  if (!SUPABASE_URL || !SERVICE_KEY) {
    throw new ApiError(
      503,
      'Content database is not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.'
    );
  }
}

async function supabase(path: string, init: RequestInit = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...init,
    cache: 'no-store',
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
  });
  if (!res.ok) throw new ApiError(502, `Database rejected the request: ${await res.text()}`);
  return res;
}

/** The row as it stands, needed for ownership checks and audit detail. */
async function fetchRow(resource: ContentResource, id: string) {
  const res = await supabase(`${resource}?id=eq.${encodeURIComponent(id)}&select=*`);
  const rows = (await res.json()) as Record<string, unknown>[];
  if (!rows.length) throw new ApiError(404, 'That row no longer exists.');
  return rows[0];
}

function ownershipContext(resource: ContentResource, user: AuthedUser, rowId?: string) {
  return resource === 'council_members'
    ? { rowId: rowId ?? null, ownRowId: user.councilMemberId }
    : {};
}

function requireId(req: Request): string {
  const id = new URL(req.url).searchParams.get('id');
  if (!id) throw new ApiError(400, 'Missing ?id=');
  return id;
}

async function handle(fn: () => Promise<NextResponse>): Promise<NextResponse> {
  try {
    return await fn();
  } catch (e) {
    if (e instanceof ApiError) return e.response;
    console.error('[content api]', e);
    return NextResponse.json({ error: (e as Error).message || 'Unexpected error' }, { status: 500 });
  }
}

type Ctx = { params: Promise<{ resource: string }> };

// ─── GET: list ───────────────────────────────────────────────────────

export async function GET(req: Request, ctx: Ctx) {
  return handle(async () => {
    assertConfigured();
    const resource = parseResource((await ctx.params).resource);
    const user = await requireUser(req);
    if (!can(user.role, resource, 'read')) throw new ApiError(403, 'Not allowed.');

    const url = new URL(req.url);
    const limit = Math.min(Number(url.searchParams.get('limit')) || 200, 500);
    const offset = Number(url.searchParams.get('offset')) || 0;
    const q = (url.searchParams.get('q') || '').trim();

    const parts = [`select=*`, `order=sort_order.asc`, `limit=${limit}`, `offset=${offset}`];
    if (q) {
      const escaped = q.replace(/[,()*]/g, ' ');
      parts.push(`or=(${SEARCH_COLUMNS[resource].map((c) => `${c}.ilike.*${escaped}*`).join(',')})`);
    }

    const res = await supabase(`${resource}?${parts.join('&')}`, {
      headers: { Prefer: 'count=exact' },
    });
    const total = Number((res.headers.get('content-range') || '/0').split('/').pop()) || 0;

    return NextResponse.json({ rows: await res.json(), total, resource });
  });
}

// ─── POST: create ────────────────────────────────────────────────────

export async function POST(req: Request, ctx: Ctx) {
  return handle(async () => {
    assertConfigured();
    const resource = parseResource((await ctx.params).resource);
    const user = await requireUser(req);
    if (!can(user.role, resource, 'create', ownershipContext(resource, user))) {
      throw new ApiError(403, `You cannot create a ${resource.replace('_', ' ')}.`);
    }

    const parsed = schemaFor(resource).safeParse(await req.json());
    if (!parsed.success) {
      throw new ApiError(422, 'Some fields need fixing.', parsed.error.flatten().fieldErrors);
    }

    const res = await supabase(resource, {
      method: 'POST',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify(parsed.data),
    });
    const [row] = (await res.json()) as Record<string, unknown>[];

    revalidateTag(`content:${resource}`);
    await writeAudit({
      actor: user,
      action: 'CONTENT_CREATED',
      target: `${resource}/${row?.id}`,
      metadata: { resource, title: row?.title ?? row?.name ?? null },
    });

    return NextResponse.json({ row }, { status: 201 });
  });
}

// ─── PATCH: update ───────────────────────────────────────────────────

export async function PATCH(req: Request, ctx: Ctx) {
  return handle(async () => {
    assertConfigured();
    const resource = parseResource((await ctx.params).resource);
    const user = await requireUser(req);
    const id = requireId(req);

    // The ownership check needs the row, so it is read before the permission
    // test rather than after.
    const existing = await fetchRow(resource, id);
    if (!can(user.role, resource, 'update', ownershipContext(resource, user, id))) {
      throw new ApiError(403, 'You can only edit your own entry.');
    }

    const parsed = schemaFor(resource).partial().safeParse(await req.json());
    if (!parsed.success) {
      throw new ApiError(422, 'Some fields need fixing.', parsed.error.flatten().fieldErrors);
    }

    const { data, rejected } = restrictFields(user.role, resource, parsed.data);
    if (!Object.keys(data).length) {
      throw new ApiError(403, rejected.length ? `You cannot change: ${rejected.join(', ')}.` : 'Nothing to update.');
    }

    const res = await supabase(`${resource}?id=eq.${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify(data),
    });
    const [row] = (await res.json()) as Record<string, unknown>[];

    revalidateTag(`content:${resource}`);
    await writeAudit({
      actor: user,
      action: 'CONTENT_UPDATED',
      target: `${resource}/${id}`,
      metadata: { resource, changed: Object.keys(data), rejected, before: existing },
    });

    return NextResponse.json({ row, ignored: rejected });
  });
}

// ─── DELETE ──────────────────────────────────────────────────────────

export async function DELETE(req: Request, ctx: Ctx) {
  return handle(async () => {
    assertConfigured();
    const resource = parseResource((await ctx.params).resource);
    const user = await requireUser(req);
    const id = requireId(req);

    if (!can(user.role, resource, 'delete', ownershipContext(resource, user, id))) {
      throw new ApiError(403, `You cannot delete a ${resource.replace('_', ' ')}.`);
    }

    // Kept in the audit entry: a deleted row is otherwise unrecoverable.
    const existing = await fetchRow(resource, id);
    await supabase(`${resource}?id=eq.${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: { Prefer: 'return=minimal' },
    });

    revalidateTag(`content:${resource}`);
    await writeAudit({
      actor: user,
      action: 'CONTENT_DELETED',
      target: `${resource}/${id}`,
      metadata: { resource, deleted: existing },
    });

    return NextResponse.json({ ok: true });
  });
}
