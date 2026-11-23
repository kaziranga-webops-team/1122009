import { NextRequest, NextResponse } from 'next/server';
import { AdminFieldValue, adminAuth, adminDb } from '@/lib/portal/firebase/admin';
import { isIITMEmail } from '@/lib/portal/utils/emailValidation';

const getProjectId = () => process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'kazi-event-portal';

const getFirestoreRestUrl = () => {
  const projectId = getProjectId();
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  const baseUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/accessRequests`;
  return apiKey ? `${baseUrl}?key=${apiKey}` : baseUrl;
};

const stringValue = (value: unknown) => ({ stringValue: String(value || '') });

const booleanValue = (value: boolean) => ({ booleanValue: value });

const isCredentialError = (err: any) => {
  const message = String(err?.message || err || '');
  return message.includes('Could not load the default credentials') || 
         message.includes('default credentials') ||
         message.includes('Missing or insufficient permissions');
};

const createAccessRequestWithFirestoreRest = async (email: string, note: string, token?: string) => {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(getFirestoreRestUrl(), {
    method: 'POST',
    headers,
    body: JSON.stringify({
      fields: {
        email: stringValue(email),
        note: stringValue(note),
        status: stringValue('PENDING'),
        read: booleanValue(false),
        createdAt: stringValue(new Date().toISOString()),
      },
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(error?.error?.message || 'Access request could not be saved');
  }
};

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization') || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice('Bearer '.length) : undefined;

    // A request is filed in someone's name, so it must come from that person.
    if (!token) {
      return NextResponse.json({ success: false, error: 'Sign in with your IITM account first.' }, { status: 401 });
    }

    // `auto` is the request filed for someone the moment they are turned away
    // at sign-in; without it, they asked from the access-denied page.
    const { email, note, auto } = await req.json();

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ success: false, error: 'Email address is required' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanNote = typeof note === 'string' ? note.trim().slice(0, 500) : '';

    // Anyone turned away at sign-in is recorded, so the super admin hears of
    // every attempt; only study accounts can ask in their own words.
    const studyEmail = isIITMEmail(cleanEmail);
    if (!studyEmail && !auto) {
      return NextResponse.json(
        { success: false, error: 'Access requests are restricted to official IITM study email accounts (@study.iitm.ac.in).' },
        { status: 403 }
      );
    }

    // With the Admin SDK the token is checked here; without it, the REST
    // fallback below forwards the token and the Firestore rules check it.
    if (adminAuth) {
      let authenticatedEmail = '';
      try {
        const decodedToken = await adminAuth.verifyIdToken(token);
        authenticatedEmail = (decodedToken.email || '').trim().toLowerCase();
      } catch {
        return NextResponse.json({ success: false, error: 'Your session has expired. Sign in again.' }, { status: 401 });
      }
      if (authenticatedEmail !== cleanEmail) {
        return NextResponse.json(
          { success: false, error: 'Submitted email address does not match your authenticated identity.' },
          { status: 403 }
        );
      }
    }

    try {
      if (!adminDb) {
        await createAccessRequestWithFirestoreRest(cleanEmail, cleanNote, token);
      } else {
        // 1. One access request per person (the single source of truth for the
        //    super admin's notifications). Another attempt brings it back to
        //    the top as unread instead of piling up duplicates.
        const accessReqRef = adminDb.collection('accessRequests').doc(cleanEmail.replace(/[^a-z0-9]/g, '_'));
        // A request the super admin turned down stays turned down: trying
        // again shows the person that answer instead of asking afresh.
        const before = await accessReqRef.get();
        if (before.exists && before.get('status') === 'REJECTED') {
          await accessReqRef.set({ attempts: AdminFieldValue!.increment(1), lastAttemptAt: new Date().toISOString() }, { merge: true });
          return NextResponse.json({ success: true, email: cleanEmail, status: 'REJECTED' });
        }
        await accessReqRef.set(
          {
            email: cleanEmail,
            ...(cleanNote ? { note: cleanNote } : {}),
            status: 'PENDING',
            read: false,
            studyEmail,
            createdAt: new Date().toISOString(),
            lastAttemptAt: new Date().toISOString(),
            attempts: AdminFieldValue!.increment(1),
          },
          { merge: true }
        );

        // 2. Audit log, for requests the person made themselves.
        if (auto) {
          return NextResponse.json({ success: true, email: cleanEmail, status: 'PENDING' });
        }
        const auditRef = adminDb.collection('auditLogs').doc();
        await auditRef.set({
          actorUserId: 'UNAUTHORIZED_USER',
          actorEmail: cleanEmail,
          action: 'ACCESS_REQUESTED',
          target: `Kaziranga Allowed-Users Registry (${cleanEmail})`,
          timestamp: new Date().toISOString(),
          metadata: { note: cleanNote },
        });
      }
    } catch (err) {
      if (!isCredentialError(err)) {
        throw err;
      }

      await createAccessRequestWithFirestoreRest(cleanEmail, cleanNote, token);
    }

    return NextResponse.json({
      success: true,
      message: 'Access request successfully sent to Super Admin notifications.',
      email: cleanEmail,
    });
  } catch (err: any) {
    console.error('Error submitting access request:', err);
    return NextResponse.json({ success: false, error: err.message || 'Internal server error' }, { status: 500 });
  }
}

/**
 * Where the signed-in person's request stands: PENDING, REJECTED, APPROVED,
 * or null when there is none. Read in their own name only.
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization') || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice('Bearer '.length) : '';
  if (!token || !adminAuth || !adminDb) return NextResponse.json({ status: null });
  try {
    const decoded = await adminAuth.verifyIdToken(token);
    const email = (decoded.email || '').trim().toLowerCase();
    if (!email) return NextResponse.json({ status: null });
    const snap = await adminDb.collection('accessRequests').doc(email.replace(/[^a-z0-9]/g, '_')).get();
    return NextResponse.json({ status: snap.exists ? String(snap.get('status') || 'PENDING') : null });
  } catch {
    return NextResponse.json({ status: null }, { status: 401 });
  }
}
