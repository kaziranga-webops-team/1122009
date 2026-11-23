// ─────────────────────────────────────────────────────────────────────────────
// POST /api/portal/notices — notifications addressed to other people.
//
// The browser says what happened (see lib/portal/notices.ts). This route reads
// the records itself, checks the caller's part in it — the event's organiser,
// the invitee, the team member — and writes the notifications with the Admin
// SDK. Titles, messages and recipients never come from the request.
//
// Notices that could be sent twice (a retried request, two tabs) use fixed
// document ids, so the second write lands on the first.
// ─────────────────────────────────────────────────────────────────────────────
import { NextResponse } from 'next/server';
import type { DocumentReference, Firestore } from 'firebase-admin/firestore';
import { adminDb } from '@/lib/portal/firebase/admin';
import { ApiError, requireUser, writeAudit, type AuthedUser } from '@/lib/portal/apiAuth';
import { canManageCommunity, canUsePortalAdmin } from '@/lib/portal/permissions';
import type { EventPath, Notice } from '@/lib/portal/notices';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const SEGMENT = /^[A-Za-z0-9_-]{1,128}$/;

function eventRef(db: Firestore, p: EventPath | undefined): DocumentReference {
  if (!p || ![p.tenureId, p.mainEventId, p.eventId].every((s) => typeof s === 'string' && SEGMENT.test(s))) {
    throw new ApiError(400, 'Invalid event reference.');
  }
  if (p.subEventId && !SEGMENT.test(p.subEventId)) throw new ApiError(400, 'Invalid event reference.');
  const ev = db.doc(`tenures/${p.tenureId}/mainEvents/${p.mainEventId}/events/${p.eventId}`);
  return p.subEventId ? ev.collection('subEvents').doc(p.subEventId) : ev;
}

async function loadEvent(db: Firestore, p: EventPath | undefined) {
  const ref = eventRef(db, p);
  const snap = await ref.get();
  if (!snap.exists) throw new ApiError(404, 'That event no longer exists.');
  return { ref, data: snap.data() as Record<string, unknown> };
}

/** Admins and RCs organise every event; a head only their communities'. */
function assertOrganiser(user: AuthedUser, event: Record<string, unknown>) {
  const slug = typeof event.communitySlug === 'string' ? event.communitySlug : null;
  if (canUsePortalAdmin(user.role) || canManageCommunity(user, slug)) return;
  throw new ApiError(403, 'Only the organisers of this event can send that.');
}

const eventLink = (p: EventPath) => `/dashboard/events/${p.mainEventId}/subevents/${p.eventId}`;

interface NoticeDoc {
  userId: string;
  title: string;
  message: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'EVENT';
  linkUrl?: string;
  isGlobal?: boolean;
}

async function write(db: Firestore, all: (NoticeDoc & { id?: string })[]) {
  const now = new Date().toISOString();
  // A notice with a fixed id is sent once: if it already exists, leave it (and
  // its read state and time) alone rather than sending it again.
  const fixed = all.filter((n) => n.id).map((n) => db.collection('notifications').doc(n.id!));
  const existing = new Set(
    fixed.length ? (await db.getAll(...fixed)).filter((s) => s.exists).map((s) => s.id) : []
  );
  const notices = all.filter((n) => !n.id || !existing.has(n.id));
  // Firestore batches hold 500 writes.
  for (let i = 0; i < notices.length; i += 450) {
    const batch = db.batch();
    for (const n of notices.slice(i, i + 450)) {
      const ref = n.id ? db.collection('notifications').doc(n.id) : db.collection('notifications').doc();
      batch.set(ref, { ...n, id: ref.id, isGlobal: n.isGlobal ?? n.userId === 'GLOBAL', read: false, createdAt: now });
    }
    await batch.commit();
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireUser(req);
    const db = adminDb!;
    const n = (await req.json().catch(() => ({}))) as Notice;

    switch (n.kind) {
      case 'EVENT_STATUS': {
        const { data } = await loadEvent(db, n.event);
        assertOrganiser(user, data);
        const name = String(data.name || 'An event');
        // Taking an event down is a staff action: the organiser sees it on
        // screen, and members are not told about events they will no longer see.
        if (n.change === 'REMOVED') break;
        const copy = {
          PUBLISHED: { title: 'New event', message: `${name} is open for sign-ups.`, type: 'EVENT' as const },
          REPUBLISHED: { title: 'Event reopened', message: `${name} is open for sign-ups again.`, type: 'EVENT' as const },
        }[n.change];
        if (!copy) throw new ApiError(400, 'Unknown status change.');
        await write(db, [{ userId: 'GLOBAL', ...copy, linkUrl: eventLink(n.event) }]);
        await writeAudit({ actor: user, action: `NOTICE_EVENT_${n.change}`, target: name });
        break;
      }

      case 'EVENT_DELETED': {
        // As with taking an event down: no notice for members.
        if (!canUsePortalAdmin(user.role)) throw new ApiError(403, 'Only admins can delete events.');
        break;
      }

      case 'EVENT_UPDATED': {
        const { ref, data } = await loadEvent(db, n.event);
        assertOrganiser(user, data);
        const regs = await ref.collection('registrations').where('status', '==', 'CONFIRMED').get();
        const uids = Array.from(new Set(regs.docs.map((d) => String(d.get('userId') || '')).filter(Boolean)));
        await write(
          db,
          uids.map((uid) => ({
            userId: uid,
            title: 'Event changed',
            message: `${String(data.name || 'Your event')}: new time or venue.`,
            type: 'INFO' as const,
            linkUrl: eventLink(n.event),
          }))
        );
        await writeAudit({ actor: user, action: 'NOTICE_EVENT_UPDATED', target: String(data.name || ''), metadata: { recipients: uids.length } });
        break;
      }

      case 'RESULTS_PUBLISHED': {
        const { data } = await loadEvent(db, n.event);
        assertOrganiser(user, data);
        if (!data.winner) throw new ApiError(400, 'Add a winner before announcing results.');
        const name = String(data.name || 'An event');
        await write(db, [
          {
            id: `results_${n.event.eventId}`,
            userId: 'GLOBAL',
            title: 'Results are out',
            message: `${name}: see who won.`,
            type: 'SUCCESS',
            linkUrl: eventLink(n.event),
          },
        ]);
        await writeAudit({ actor: user, action: 'NOTICE_RESULTS_PUBLISHED', target: name });
        break;
      }

      case 'TEAM_INVITE_RESPONSE': {
        if (typeof n.invitationId !== 'string' || !SEGMENT.test(n.invitationId)) throw new ApiError(400, 'Invalid invitation.');
        const snap = await db.collection('teamInvitations').doc(n.invitationId).get();
        if (!snap.exists) throw new ApiError(404, 'That invitation no longer exists.');
        const inv = snap.data() as Record<string, string>;
        const isInvitee =
          inv.inviteeUserId === user.uid || (inv.inviteeEmail || '').toLowerCase() === user.email.toLowerCase();
        if (!isInvitee) throw new ApiError(403, 'Only the invitee can answer this invitation.');
        if (inv.status !== 'ACCEPTED' && inv.status !== 'REJECTED') throw new ApiError(400, 'The invitation has not been answered.');
        const who = user.name || inv.inviteeEmail;
        await write(db, [
          {
            id: `invite_${n.invitationId}_${inv.status}`,
            userId: inv.inviterUserId,
            ...(inv.status === 'ACCEPTED'
              ? { title: 'Invite accepted', message: `${who} joined your team for ${inv.eventName}.`, type: 'SUCCESS' as const }
              : { title: 'Invite declined', message: `${who} won't join your team for ${inv.eventName}.`, type: 'WARNING' as const }),
            linkUrl: `/dashboard/events/${inv.mainEventId}/subevents/${inv.eventId}`,
          },
        ]);
        break;
      }

      case 'TEAM_WITHDRAWN': {
        const ref = eventRef(db, n.event);
        if (typeof n.registrationId !== 'string' || !SEGMENT.test(n.registrationId)) throw new ApiError(400, 'Invalid registration.');
        const regSnap = await ref.collection('registrations').doc(n.registrationId).get();
        if (!regSnap.exists) throw new ApiError(404, 'That registration no longer exists.');
        const reg = regSnap.data() as Record<string, string>;
        if (reg.userId !== user.uid) throw new ApiError(403, 'That is not your registration.');
        if (reg.status !== 'CANCELLED' || !reg.teamId) break;

        const event = (await ref.get()).data() || {};
        const eventName = String(event.name || reg.eventTitle || 'your event');
        const team = await ref.collection('registrations').where('teamId', '==', reg.teamId).get();
        const active = team.docs.filter((d) => d.id !== regSnap.id && d.get('status') === 'CONFIRMED');
        const link = eventLink(n.event);

        const notices: (NoticeDoc & { id: string })[] =
          reg.teamRole === 'INITIATOR'
            ? active.map((d) => ({
                id: `teamcancel_${regSnap.id}_${d.get('userId')}`,
                userId: String(d.get('userId')),
                title: 'Team cancelled',
                message: `Your team for ${eventName} was cancelled.`,
                type: 'WARNING' as const,
                linkUrl: link,
              }))
            : active
                .filter((d) => d.get('teamRole') === 'INITIATOR')
                .map((d) => ({
                  id: `teamcancel_${regSnap.id}_${d.get('userId')}`,
                  userId: String(d.get('userId')),
                  title: 'Teammate left',
                  message: `${reg.nameSnapshot || user.name || 'A teammate'} left your team for ${eventName}.`,
                  type: 'WARNING' as const,
                  linkUrl: link,
                }));
        await write(db, notices);
        break;
      }

      case 'TEAM_READY': {
        const ref = eventRef(db, n.event);
        if (typeof n.teamId !== 'string' || !SEGMENT.test(n.teamId)) throw new ApiError(400, 'Invalid team.');
        const team = await ref.collection('registrations').where('teamId', '==', n.teamId).get();
        if (!team.docs.some((d) => d.get('userId') === user.uid)) throw new ApiError(403, 'You are not on this team.');
        const confirmed = team.docs.filter((d) => d.get('status') === 'CONFIRMED');
        const leader = confirmed.find((d) => d.get('teamRole') === 'INITIATOR');
        const event = (await ref.get()).data() || {};
        const needed = Number(event.minimumTeamSize) || 2;
        if (!leader || confirmed.length < needed) break;
        await write(db, [
          {
            id: `teamready_${n.teamId}`,
            userId: String(leader.get('userId')),
            title: 'Team complete',
            message: `${String(leader.get('teamName') || 'Your team')} is ready for ${String(event.name || 'the event')}.`,
            type: 'SUCCESS',
            linkUrl: eventLink(n.event),
          },
        ]);
        break;
      }

      case 'DEADLINES': {
        // Any member's visit may ask, but the house checks at most every 30
        // minutes: one scan serves everyone, instead of one per visit.
        const meta = db.collection('meta').doc('notices');
        const due = await db.runTransaction(async (tx) => {
          const last = (await tx.get(meta)).get('lastScan') as string | undefined;
          if (last && Date.now() - new Date(last).getTime() < 30 * 60 * 1000) return false;
          tx.set(meta, { lastScan: new Date().toISOString() }, { merge: true });
          return true;
        });
        if (!due) break;

        const now = Date.now();
        const day = 24 * 3600 * 1000;
        const published = await db.collectionGroup('events').where('status', '==', 'PUBLISHED').get();
        const inNextDay = (iso: unknown) => {
          const t = new Date(String(iso || '')).getTime();
          return Number.isFinite(t) && t > now && t - now <= day;
        };
        const hoursUntil = (iso: unknown) => Math.max(1, Math.round((new Date(String(iso)).getTime() - now) / 3600000));
        const out: (NoticeDoc & { id: string })[] = [];

        for (const d of published.docs) {
          const name = String(d.get('name') || 'An event');
          const link = `/dashboard/events/${String(d.get('mainEventId') || '')}/subevents/${d.id}`;

          // Registration closing: everyone.
          if (inNextDay(d.get('registrationDeadline'))) {
            out.push({
              id: `deadline_${d.id}`,
              userId: 'GLOBAL',
              title: 'Closing soon',
              message: `${name} closes in ${hoursUntil(d.get('registrationDeadline'))}h.`,
              type: 'EVENT',
              linkUrl: link,
            });
          }

          // Starting soon: the people registered for it.
          if (inNextDay(d.get('startDateTime'))) {
            const regs = await d.ref.collection('registrations').where('status', '==', 'CONFIRMED').get();
            const hours = hoursUntil(d.get('startDateTime'));
            for (const uid of new Set(regs.docs.map((r) => String(r.get('userId') || '')).filter(Boolean))) {
              out.push({
                id: `starts_${d.id}_${uid}`,
                userId: uid,
                title: 'Starting soon',
                message: `${name} starts in ${hours}h.`,
                type: 'EVENT',
                linkUrl: link,
              });
            }
          }
        }
        await write(db, out);
        break;
      }

      default:
        throw new ApiError(400, 'Unknown notice.');
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof ApiError) return e.response;
    console.error('[notices]', e);
    return NextResponse.json({ error: 'Could not send the notice.' }, { status: 500 });
  }
}
