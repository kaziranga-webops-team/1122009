// ─────────────────────────────────────────────────────────────────────────────
// /api/portal/announcements — post, pin and remove announcements.
//
// Members read announcements straight from Firestore; every write comes through
// here so the author, audience and pinning rules are checked on the server and
// each change lands in the audit log.
// ─────────────────────────────────────────────────────────────────────────────
import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/portal/firebase/admin';
import { ApiError, requireUser, writeAudit } from '@/lib/portal/apiAuth';
import {
  ANNOUNCEMENT_LIMITS,
  canPin,
  canPostTo,
  canRemoveAnnouncement,
  isSafeLink,
  type Announcement,
  type AnnouncementAudience,
} from '@/lib/portal/announcements';
import { communityBySlug } from '@/lib/communities';
import { REGIONS } from '@/lib/portal/regions';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const AUDIENCES: AnnouncementAudience[] = ['HOUSE', 'REGION', 'COMMUNITY'];

const str = (v: unknown) => (typeof v === 'string' ? v.trim() : '');

function fail(e: unknown, what: string) {
  if (e instanceof ApiError) return e.response;
  console.error(`[announcements] ${what}`, e);
  return NextResponse.json({ error: `Could not ${what}.` }, { status: 500 });
}

export async function POST(req: Request) {
  try {
    const user = await requireUser(req);
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;

    const title = str(body.title);
    const text = str(body.body);
    const linkUrl = str(body.linkUrl);
    const audience = body.audience as AnnouncementAudience;
    const region = audience === 'REGION' ? str(body.region) : null;
    const communitySlug = audience === 'COMMUNITY' ? str(body.communitySlug) : null;

    if (title.length < 3 || title.length > ANNOUNCEMENT_LIMITS.title) {
      throw new ApiError(400, `Give it a title of 3 to ${ANNOUNCEMENT_LIMITS.title} characters.`);
    }
    if (!text || text.length > ANNOUNCEMENT_LIMITS.body) {
      throw new ApiError(400, `Write a message of up to ${ANNOUNCEMENT_LIMITS.body} characters.`);
    }
    if (linkUrl && !isSafeLink(linkUrl)) {
      throw new ApiError(400, 'Links must be a portal path (starting with /) or an https:// address.');
    }
    if (!AUDIENCES.includes(audience)) throw new ApiError(400, 'Choose who this is for.');
    if (audience === 'REGION' && !(REGIONS as readonly string[]).includes(region || '')) {
      throw new ApiError(400, 'Choose a region.');
    }
    if (audience === 'COMMUNITY' && !communityBySlug(communitySlug || '')) {
      throw new ApiError(400, 'Choose a community.');
    }
    if (!canPostTo(user, { audience, region, communitySlug })) {
      throw new ApiError(403, 'You cannot post to that audience.');
    }
    const pinned = body.pinned === true;
    if (pinned && !canPin(user.role)) throw new ApiError(403, 'Only admins can pin announcements.');

    const ref = adminDb!.collection('announcements').doc();
    const doc: Announcement = {
      id: ref.id,
      title,
      body: text,
      linkUrl: linkUrl || null,
      audience,
      region,
      communitySlug,
      pinned,
      authorUid: user.uid,
      authorName: user.name || user.email,
      authorRole: user.role,
      createdAt: new Date().toISOString(),
    };
    await ref.set(doc);

    // House-wide posts also light the bell for everyone.
    if (audience === 'HOUSE') {
      const n = adminDb!.collection('notifications').doc();
      await n.set({
        id: n.id,
        userId: 'GLOBAL',
        isGlobal: true,
        title,
        message: text.length > 180 ? `${text.slice(0, 177)}…` : text,
        type: 'INFO',
        linkUrl: linkUrl || '/dashboard',
        read: false,
        createdAt: doc.createdAt,
      });
    }

    await writeAudit({
      actor: user,
      action: 'ANNOUNCEMENT_POSTED',
      target: title,
      metadata: { id: ref.id, audience, region, communitySlug, pinned },
    });
    return NextResponse.json({ id: ref.id });
  } catch (e) {
    return fail(e, 'post the announcement');
  }
}

export async function PATCH(req: Request) {
  try {
    const user = await requireUser(req);
    const body = (await req.json().catch(() => ({}))) as { id?: unknown; pinned?: unknown };
    if (!canPin(user.role)) throw new ApiError(403, 'Only admins can pin announcements.');
    const id = str(body.id);
    if (!id) throw new ApiError(400, 'Missing announcement id.');
    const ref = adminDb!.collection('announcements').doc(id);
    const snap = await ref.get();
    if (!snap.exists) throw new ApiError(404, 'That announcement no longer exists.');
    const pinned = body.pinned === true;
    await ref.update({ pinned });
    await writeAudit({ actor: user, action: pinned ? 'ANNOUNCEMENT_PINNED' : 'ANNOUNCEMENT_UNPINNED', target: String(snap.get('title') || id), metadata: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return fail(e, 'update the announcement');
  }
}

export async function DELETE(req: Request) {
  try {
    const user = await requireUser(req);
    const id = new URL(req.url).searchParams.get('id') || '';
    if (!id) throw new ApiError(400, 'Missing announcement id.');
    const ref = adminDb!.collection('announcements').doc(id);
    const snap = await ref.get();
    if (!snap.exists) throw new ApiError(404, 'That announcement no longer exists.');
    const a = snap.data() as Announcement;
    if (!canRemoveAnnouncement(user, a)) throw new ApiError(403, 'You can only remove your own announcements.');
    await ref.delete();
    await writeAudit({ actor: user, action: 'ANNOUNCEMENT_REMOVED', target: a.title, metadata: { id, audience: a.audience } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return fail(e, 'remove the announcement');
  }
}
