// ─────────────────────────────────────────────────────────────────────────────
// Server-side identity for the admin API.
//
// The browser sends a Firebase ID token; this verifies it and reads the role
// off the user's own Firestore document. The role never comes from the request
// — a client could claim any role it liked — so the token proves who you are
// and Firestore says what you may do.
// ─────────────────────────────────────────────────────────────────────────────
import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/portal/firebase/admin';
import { effectiveScope, VIEW_AS_COMMUNITY_HEADER, VIEW_AS_HEADER } from '@/lib/portal/roles';
import type { UserRole } from '@/types/portal';

export interface AuthedUser {
  uid: string;
  email: string;
  name: string;
  /**
   * The role this request acts with. Normally the user's own; lower when they
   * are viewing the portal as another role. Permission checks use this.
   */
  role: UserRole;
  /** The role on the user's profile, regardless of any "view as". */
  realRole: UserRole;
  /** Communities this request may run, when acting as a community head. */
  communitySlugs: string[];
  /** The council_members row this user may edit, when they are an RC. */
  councilMemberId: string | null;
}

export class ApiError extends Error {
  constructor(readonly status: number, message: string, readonly detail?: unknown) {
    super(message);
  }
  get response() {
    return NextResponse.json(
      { error: this.message, ...(this.detail ? { detail: this.detail } : {}) },
      { status: this.status }
    );
  }
}

/**
 * Resolves the caller, or throws an ApiError the route can turn into a response.
 * Throws 503 when the Admin SDK has no credentials — that is a deployment
 * problem, not an authorisation one, and saying so saves a lot of guessing.
 */
export async function requireUser(req: Request): Promise<AuthedUser> {
  if (!adminAuth || !adminDb) {
    throw new ApiError(
      503,
      'Server is not configured for admin actions. Set FIREBASE_SERVICE_ACCOUNT_KEY.'
    );
  }

  const header = req.headers.get('Authorization') || '';
  if (!header.startsWith('Bearer ')) {
    throw new ApiError(401, 'Missing bearer token.');
  }

  let uid: string;
  let email: string;
  try {
    const decoded = await adminAuth.verifyIdToken(header.slice(7));
    uid = decoded.uid;
    email = decoded.email || '';
  } catch {
    throw new ApiError(401, 'Your session has expired. Sign in again.');
  }

  const snap = await adminDb.collection('users').doc(uid).get();
  if (!snap.exists) throw new ApiError(403, 'No profile found for this account.');

  const data = snap.data() as Record<string, unknown>;
  if (data.isAccessRevoked === true) throw new ApiError(403, 'Your access has been revoked.');

  const realRole = (data.role as UserRole) || 'USER';
  const realCommunities = Array.isArray(data.communitySlugs) ? (data.communitySlugs as string[]) : [];

  // "View as" can only lower what this request may do: effectiveScope ignores
  // any role the real one is not allowed to switch into.
  const scope = effectiveScope(
    { role: realRole, communitySlugs: realCommunities },
    req.headers.get(VIEW_AS_HEADER),
    req.headers.get(VIEW_AS_COMMUNITY_HEADER)
  );

  return {
    uid,
    email: email || String(data.email || ''),
    name: String(data.name || ''),
    role: scope.role,
    realRole,
    communitySlugs: scope.communitySlugs,
    councilMemberId: scope.role === realRole ? ((data.councilMemberId as string | null) ?? null) : null,
  };
}

/**
 * Appends to the portal's existing append-only audit trail, so content edits
 * and role changes are read from one place rather than two.
 */
export async function writeAudit(entry: {
  actor: AuthedUser;
  action: string;
  target: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  if (!adminDb) return;
  try {
    const ref = adminDb.collection('auditLogs').doc();
    await ref.set({
      id: ref.id,
      actorUserId: entry.actor.uid,
      actorEmail: entry.actor.email,
      action: entry.action,
      target: entry.target,
      timestamp: new Date().toISOString(),
      metadata: {
        ...(entry.metadata ?? {}),
        // Actions taken while viewing as another role say so in the record.
        ...(entry.actor.role !== entry.actor.realRole
          ? { actingAs: entry.actor.role, realRole: entry.actor.realRole }
          : {}),
      },
    });
  } catch (e) {
    // An audit write must never fail the action the user asked for.
    console.error('[audit] failed to record', entry.action, e);
  }
}
