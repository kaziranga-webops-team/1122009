// PUT /api/portal/communities — a head (or an admin/RC) saves a community's
// public card: its focus line, description and links.
import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { adminDb } from '@/lib/portal/firebase/admin';
import { ApiError, requireUser, writeAudit } from '@/lib/portal/apiAuth';
import { canManageCommunity } from '@/lib/portal/permissions';
import { communityBySlug } from '@/lib/communities';
import { cleanHttpsUrl, COMMUNITY_PAGE_LIMITS } from '@/lib/portal/communityPages';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const str = (v: unknown) => (typeof v === 'string' ? v.trim() : '');

export async function PUT(req: Request) {
  try {
    const user = await requireUser(req);
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const slug = str(body.slug);
    const community = communityBySlug(slug);
    if (!community) throw new ApiError(400, 'Unknown community.');
    if (!canManageCommunity(user, slug)) throw new ApiError(403, `You do not run ${community.name}.`);

    const focus = str(body.focus);
    const line = str(body.line);
    if (focus.length > COMMUNITY_PAGE_LIMITS.focus) throw new ApiError(400, `Keep the focus under ${COMMUNITY_PAGE_LIMITS.focus} characters.`);
    if (line.length > COMMUNITY_PAGE_LIMITS.line) throw new ApiError(400, `Keep the description under ${COMMUNITY_PAGE_LIMITS.line} characters.`);

    const joinUrl = cleanHttpsUrl(body.joinUrl);
    const instagramUrl = cleanHttpsUrl(body.instagramUrl);
    if (str(body.joinUrl) && !joinUrl) throw new ApiError(400, 'The join link must start with https://');
    if (str(body.instagramUrl) && !instagramUrl) throw new ApiError(400, 'The Instagram link must start with https://');

    await adminDb!.collection('communities').doc(slug).set(
      { focus, line, joinUrl, instagramUrl, updatedAt: new Date().toISOString(), updatedBy: user.uid },
      { merge: true }
    );
    revalidatePath('/api/communities');
    await writeAudit({ actor: user, action: 'COMMUNITY_PAGE_UPDATED', target: community.name, metadata: { slug } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof ApiError) return e.response;
    console.error('[portal/communities]', e);
    return NextResponse.json({ error: 'Could not save the community page.' }, { status: 500 });
  }
}
