import { getApps, initializeApp, cert, applicationDefault, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getAuth, Auth } from 'firebase-admin/auth';

const getServiceAccountCredential = () => {
  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

  if (serviceAccountKey) {
    try {
      const json = serviceAccountKey.trim().startsWith('{')
        ? serviceAccountKey
        : Buffer.from(serviceAccountKey, 'base64').toString('utf8');
      const serviceAccount = JSON.parse(json);

      return cert({
        projectId: serviceAccount.project_id,
        clientEmail: serviceAccount.client_email,
        privateKey: serviceAccount.private_key?.replace(/\\n/g, '\n'),
      });
    } catch (e) {
      console.warn('Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY:', e);
    }
  }

  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (projectId && clientEmail && privateKey) {
    return cert({
      projectId,
      clientEmail,
      privateKey,
    });
  }

  // applicationDefault() happily returns a credential object even when there
  // are no ambient credentials to find — it only fails later, deep inside
  // verifyIdToken, where it surfaces as "your session expired" to a user whose
  // session is perfectly fine. Only reach for it when Google's own variable
  // says there is something to pick up.
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    try {
      return applicationDefault();
    } catch {
      return undefined;
    }
  }

  return undefined;
};

let app: App | null = null;
const existingApps = getApps();

if (existingApps.length > 0) {
  app = existingApps[0];
} else {
  try {
    const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'kazi-event-portal';
    const credential = getServiceAccountCredential();

    if (credential) {
      app = initializeApp({
        projectId,
        credential,
      });
    }
  } catch (error) {
    console.warn('Firebase Admin SDK initialization note:', error);
  }
}

export const adminDb: Firestore | null = app ? getFirestore(app) : null;
export const adminAuth: Auth | null = app ? getAuth(app) : null;
