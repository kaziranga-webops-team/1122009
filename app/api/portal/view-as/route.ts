// ─────────────────────────────────────────────────────────────────────────────
// POST /api/portal/view-as — records that someone switched the role they view
// the portal as. The switch itself lives in the browser and is enforced on
// every API call by requireUser(); this only keeps the audit trail honest.
// ─────────────────────────────────────────────────────────────────────────────
import { NextResponse } from 'next/server';
import { ApiError, requireUser, writeAudit } from '@/lib/portal/apiAuth';
import { canViewAs, ALL_ROLES } from '@/lib/portal/roles';
import { communityBySlug } from '@/lib/communities';
import type { UserRole } from '@/types/portal';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const user = await requireUser(req);
    const body = (await req.json().catch(() => ({}))) as { role?: unknown; community?: unknown };

    const role = body.role as UserRole;
    if (!ALL_ROLES.includes(role) || !canViewAs(user.realRole, role)) {
      throw new ApiError(403, 'Your role cannot switch to that view.');
    }

    const community = typeof body.community === 'string' ? communityBySlug(body.community) : undefined;
    if (role === 'COMMUNITY_HEAD' && user.realRole !== 'COMMUNITY_HEAD' && !community) {
      throw new ApiError(400, 'Choose a community to view as its head.');
    }

    const back = role === user.realRole;
    await writeAudit({
      actor: { ...user, role: user.realRole },
      action: back ? 'VIEW_AS_ENDED' : 'VIEW_AS_STARTED',
      target: back ? `Own role (${user.realRole})` : community ? `${role} of ${community.name}` : role,
      metadata: { role, community: community?.slug ?? null },
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof ApiError) return e.response;
    console.error('[view-as]', e);
    return NextResponse.json({ error: 'Could not record the switch.' }, { status: 500 });
  }
}
