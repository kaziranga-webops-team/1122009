import { NextRequest, NextResponse } from 'next/server';
import type { UserRole } from '@/types/portal';
import { adminAuth, adminDb } from '@/lib/portal/firebase/admin';
import { ALL_ROLES } from '@/lib/portal/roles';
import { COMMUNITIES } from '@/lib/communities';
import { REGIONS } from '@/lib/portal/regions';

export const runtime = 'nodejs';

const VALID_ROLES: UserRole[] = ALL_ROLES;
const COMMUNITY_SLUGS = new Set(COMMUNITIES.map((c) => c.slug));

/** Known community slugs only, each once; a community head must lead at least one. */
function cleanCommunitySlugs(role: UserRole, raw: unknown): string[] | null {
  if (role !== 'COMMUNITY_HEAD') return [];
  const list = Array.isArray(raw) ? raw.filter((s): s is string => typeof s === 'string' && COMMUNITY_SLUGS.has(s)) : [];
  const unique = Array.from(new Set(list));
  return unique.length ? unique : null;
}

const sameSet = (a: string[], b: string[]) => a.length === b.length && a.every((x) => b.includes(x));

const arrayOfStrings = (values: string[]) => ({ arrayValue: { values: values.map((v) => ({ stringValue: v })) } });

const readFirestoreStrings = (doc: any, field: string): string[] =>
  (doc?.fields?.[field]?.arrayValue?.values || []).map((v: any) => v?.stringValue).filter(Boolean);

const getProjectId = () => process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'kazi-event-portal';

const firestoreDocumentUrl = (projectId: string, path: string) =>
  `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${path}`;

const firestoreCommitUrl = (projectId: string) =>
  `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents:commit`;

const stringValue = (value: unknown) => ({ stringValue: String(value || '') });

const booleanValue = (value: boolean) => ({ booleanValue: value });

const mapValue = (value: Record<string, unknown>) => ({
  mapValue: {
    fields: Object.fromEntries(Object.entries(value).map(([key, item]) => [key, stringValue(item)])),
  },
});

const readFirestoreString = (doc: any, field: string) => doc?.fields?.[field]?.stringValue || '';

const parseErrorStatus = (err: any) => {
  const message = String(err?.message || err || '');
  if (message.includes('Could not load the default credentials') || message.includes('Firebase Admin SDK is not configured')) {
    return 'credentials';
  }
  return 'unknown';
};

import { formatRoleName } from '@/lib/portal/utils/roleFormatter';

const updateRoleWithFirestoreRest = async (
  token: string,
  targetUserId: string,
  newRole: UserRole,
  communitySlugs: string[],
  actorInfo?: { actorUserId?: string; actorEmail?: string }
) => {
  const projectId = getProjectId();
  const targetResponse = await fetch(firestoreDocumentUrl(projectId, `users/${encodeURIComponent(targetUserId)}`), {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (targetResponse.status === 404) {
    return NextResponse.json({ success: false, error: 'Target user was not found' }, { status: 404 });
  }

  if (!targetResponse.ok) {
    const error = await targetResponse.json().catch(() => null);
    return NextResponse.json(
      { success: false, error: error?.error?.message || 'Could not read target user profile' },
      { status: targetResponse.status }
    );
  }

  const targetDoc = await targetResponse.json();
  const oldRole = readFirestoreString(targetDoc, 'role') as UserRole;

  if (oldRole === newRole && sameSet(communitySlugs, readFirestoreStrings(targetDoc, 'communitySlugs'))) {
    return NextResponse.json({
      success: true,
      oldRole,
      newRole,
      changed: false,
      targetName: readFirestoreString(targetDoc, 'name') || 'Unknown user',
      targetEmail: readFirestoreString(targetDoc, 'email') || targetUserId,
    });
  }

  const timestamp = new Date().toISOString();
  const targetName = readFirestoreString(targetDoc, 'name') || 'Unknown user';
  const targetEmail = readFirestoreString(targetDoc, 'email') || targetUserId;
  const auditId = `log_${Date.now()}`;
  const notificationId = `notif_${Date.now()}`;
  const oldRoleDisplayName = formatRoleName(oldRole);
  const newRoleDisplayName = formatRoleName(newRole);
  const actorUserId = actorInfo?.actorUserId || 'SUPER_ADMIN';
  const actorEmail = actorInfo?.actorEmail || 'Super Admin';

  const commitResponse = await fetch(firestoreCommitUrl(projectId), {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      writes: [
        {
          update: {
            name: `projects/${projectId}/databases/(default)/documents/users/${targetUserId}`,
            fields: {
              role: stringValue(newRole),
              communitySlugs: arrayOfStrings(communitySlugs),
              updatedAt: stringValue(timestamp),
            },
          },
          updateMask: { fieldPaths: ['role', 'communitySlugs', 'updatedAt'] },
        },
        {
          update: {
            name: `projects/${projectId}/databases/(default)/documents/auditLogs/${auditId}`,
            fields: {
              id: stringValue(auditId),
              actorUserId: stringValue(actorUserId),
              actorEmail: stringValue(actorEmail),
              action: stringValue('USER_ROLE_CHANGED'),
              target: stringValue(`${targetName} (${targetEmail})`),
              timestamp: stringValue(timestamp),
              metadata: mapValue({ oldRole, newRole, communitySlugs: communitySlugs.join(', ') }),
            },
          },
          currentDocument: { exists: false },
        },
        {
          update: {
            name: `projects/${projectId}/databases/(default)/documents/notifications/${notificationId}`,
            fields: {
              id: stringValue(notificationId),
              userId: stringValue(targetUserId),
              title: stringValue('Role Updated'),
              message: stringValue(`Your account access role has been updated from ${oldRoleDisplayName} to ${newRoleDisplayName}.`),
              type: stringValue('ROLE_CHANGE'),
              read: booleanValue(false),
              createdAt: stringValue(timestamp),
            },
          },
          currentDocument: { exists: false },
        },
      ],
    }),
  });

  if (!commitResponse.ok) {
    const error = await commitResponse.json().catch(() => null);
    return NextResponse.json(
      { success: false, error: error?.error?.message || 'Only Super Admins can change user roles' },
      { status: commitResponse.status === 403 ? 403 : commitResponse.status }
    );
  }

  return NextResponse.json({
    success: true,
    oldRole,
    newRole,
    changed: true,
    targetName,
    targetEmail,
  });
};

export async function POST(req: NextRequest) {
  let token = '';
  let payload: { targetUserId?: string; newRole?: UserRole; communitySlugs?: unknown; rcRegion?: unknown; actorUserId?: string; actorEmail?: string } = {};
  let communitySlugs: string[] = [];

  try {
    const authHeader = req.headers.get('authorization') || '';
    token = authHeader.startsWith('Bearer ') ? authHeader.slice('Bearer '.length) : '';
    if (!token) {
      return NextResponse.json({ success: false, error: 'Authentication token is required' }, { status: 401 });
    }

    payload = await req.json();
    const { targetUserId, newRole, actorUserId, actorEmail } = payload;

    if (!targetUserId || typeof targetUserId !== 'string') {
      return NextResponse.json({ success: false, error: 'Target user id is required' }, { status: 400 });
    }

    if (!VALID_ROLES.includes(newRole as UserRole)) {
      return NextResponse.json({ success: false, error: 'Invalid role selected' }, { status: 400 });
    }

    const validatedRole = newRole as UserRole;

    const cleaned = cleanCommunitySlugs(validatedRole, payload.communitySlugs);
    if (!cleaned) {
      return NextResponse.json({ success: false, error: 'Choose at least one community for a Community Head' }, { status: 400 });
    }
    communitySlugs = cleaned;

    // A regional coordinator coordinates one region, chosen with the role.
    const rcRegion = validatedRole === 'RC' ? String(payload.rcRegion || '') : '';
    if (validatedRole === 'RC' && (!REGIONS.includes(rcRegion as (typeof REGIONS)[number]) || rcRegion === 'Other')) {
      return NextResponse.json({ success: false, error: 'Choose the region this RC coordinates' }, { status: 400 });
    }

    if (!adminDb || !adminAuth) {
      return updateRoleWithFirestoreRest(token, targetUserId, validatedRole, communitySlugs, { actorUserId, actorEmail });
    }

    const decodedToken = await adminAuth.verifyIdToken(token);

    if (!targetUserId || typeof targetUserId !== 'string') {
      return NextResponse.json({ success: false, error: 'Target user id is required' }, { status: 400 });
    }

    if (!VALID_ROLES.includes(validatedRole)) {
      return NextResponse.json({ success: false, error: 'Invalid role selected' }, { status: 400 });
    }

    const actorRef = adminDb.collection('users').doc(decodedToken.uid);
    const targetRef = adminDb.collection('users').doc(targetUserId);
    const auditRef = adminDb.collection('auditLogs').doc();
    const notificationRef = adminDb.collection('notifications').doc();

    const result = await adminDb.runTransaction(async (transaction: any) => {
      const [actorSnap, targetSnap] = await Promise.all([transaction.get(actorRef), transaction.get(targetRef)]);

      if (!actorSnap.exists) {
        throw new Error('Signed-in user profile was not found');
      }

      const actor = actorSnap.data();
      if (actor?.role !== 'SUPER_ADMIN') {
        const error = new Error('Only Super Admins can change user roles');
        error.name = 'Forbidden';
        throw error;
      }

      if (!targetSnap.exists) {
        const error = new Error('Target user was not found');
        error.name = 'NotFound';
        throw error;
      }

      const target = targetSnap.data();
      const oldRole = target?.role as UserRole | undefined;

      if (
        oldRole === validatedRole &&
        sameSet(communitySlugs, (target?.communitySlugs as string[]) ?? []) &&
        String(target?.rcRegion || '') === rcRegion
      ) {
        return {
          oldRole,
          newRole: validatedRole,
          changed: false,
          targetName: target?.name || 'Unknown user',
          targetEmail: target?.email || targetUserId,
        };
      }

      const timestamp = new Date().toISOString();
      const targetName = target?.name || 'Unknown user';
      const targetEmail = target?.email || targetUserId;

      transaction.update(targetRef, {
        role: validatedRole,
        communitySlugs,
        rcRegion: rcRegion || null,
        updatedAt: timestamp,
      });

      transaction.set(auditRef, {
        id: auditRef.id,
        actorUserId: decodedToken.uid,
        actorEmail: actor?.email || decodedToken.email || '',
        action: 'ROLE_CHANGED',
        target: `${targetName} (${targetEmail})`,
        timestamp,
        metadata: { oldRole, newRole: validatedRole, communitySlugs },
      });

      transaction.set(notificationRef, {
        id: notificationRef.id,
        userId: targetUserId,
        title: 'Role Updated',
        message: `Your account access role has been updated from ${formatRoleName(oldRole)} to ${formatRoleName(validatedRole)}.`,
        type: 'ROLE_CHANGE',
        read: false,
        createdAt: timestamp,
      });

      return {
        oldRole,
        newRole: validatedRole,
        changed: true,
        targetName,
        targetEmail,
      };
    });

    return NextResponse.json({ success: true, ...result });
  } catch (err: any) {
    console.error('Role update error:', err);

    if (parseErrorStatus(err) === 'credentials' && payload.targetUserId && payload.newRole) {
      return updateRoleWithFirestoreRest(token, payload.targetUserId, payload.newRole, communitySlugs, {
        actorUserId: payload.actorUserId,
        actorEmail: payload.actorEmail,
      });
    }

    if (err?.name === 'Forbidden') {
      return NextResponse.json({ success: false, error: err.message }, { status: 403 });
    }

    if (err?.name === 'NotFound') {
      return NextResponse.json({ success: false, error: err.message }, { status: 404 });
    }

    return NextResponse.json({ success: false, error: err.message || 'Internal server error' }, { status: 500 });
  }
}
