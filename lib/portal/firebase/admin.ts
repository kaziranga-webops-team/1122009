// ─────────────────────────────────────────────────────────────────────────────
// The Firebase Admin SDK, for server routes.
//
// The SDK is loaded inside a try block rather than with top-level imports: if
// it cannot load on the server (a missing file in the deployment, the wrong
// Node version), the routes still run and say why, instead of the whole
// function crashing with an empty 500 and nothing in the response to go on.
// ─────────────────────────────────────────────────────────────────────────────
import type { App, Credential } from 'firebase-admin/app';
import type { Firestore, FieldValue as FieldValueType } from 'firebase-admin/firestore';
import type { Auth } from 'firebase-admin/auth';

type AppModule = typeof import('firebase-admin/app');

/** Why the Admin SDK is unavailable, when it is; shown in the 503 the routes return. */
export let adminLoadError: string | null = null;

const getServiceAccountCredential = (sdk: AppModule): Credential | undefined => {
  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

  if (serviceAccountKey) {
    try {
      const json = serviceAccountKey.trim().startsWith('{')
        ? serviceAccountKey
        : Buffer.from(serviceAccountKey, 'base64').toString('utf8');
      const serviceAccount = JSON.parse(json);

      return sdk.cert({
        projectId: serviceAccount.project_id,
        clientEmail: serviceAccount.client_email,
        privateKey: serviceAccount.private_key?.replace(/\\n/g, '\n'),
      });
    } catch (e) {
      console.warn('Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY:', e);
      adminLoadError = `FIREBASE_SERVICE_ACCOUNT_KEY could not be read: ${(e as Error).message}`;
    }
  }

  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (projectId && clientEmail && privateKey) {
    return sdk.cert({ projectId, clientEmail, privateKey });
  }

  // applicationDefault() happily returns a credential object even when there
  // are no ambient credentials to find — it only fails later, deep inside
  // verifyIdToken, where it surfaces as "your session expired" to a user whose
  // session is perfectly fine. Only reach for it when Google's own variable
  // says there is something to pick up.
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    try {
      return sdk.applicationDefault();
    } catch {
      return undefined;
    }
  }

  return undefined;
};

let db: Firestore | null = null;
let auth: Auth | null = null;
let fieldValue: typeof FieldValueType | null = null;

try {
  /* eslint-disable @typescript-eslint/no-require-imports */
  const sdk = require('firebase-admin/app') as AppModule;
  const firestore = require('firebase-admin/firestore') as typeof import('firebase-admin/firestore');
  const authSdk = require('firebase-admin/auth') as typeof import('firebase-admin/auth');
  /* eslint-enable @typescript-eslint/no-require-imports */

  let app: App | null = sdk.getApps()[0] ?? null;
  if (!app) {
    const credential = getServiceAccountCredential(sdk);
    if (credential) {
      const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'kazi-event-portal';
      app = sdk.initializeApp({ projectId, credential });
    } else if (!adminLoadError) {
      adminLoadError = 'No Firebase admin credentials. Set FIREBASE_SERVICE_ACCOUNT_KEY.';
    }
  }

  if (app) {
    db = firestore.getFirestore(app);
    auth = authSdk.getAuth(app);
    adminLoadError = null;
  }
  fieldValue = firestore.FieldValue;
} catch (error) {
  console.error('[firebase-admin] could not load:', error);
  adminLoadError = `Firebase admin could not load on the server: ${(error as Error)?.message || String(error)}`;
}

export const adminDb: Firestore | null = db;
export const adminAuth: Auth | null = auth;
/** Firestore's FieldValue (increment, arrayUnion…), or null when the SDK is unavailable. */
export const AdminFieldValue: typeof FieldValueType | null = fieldValue;
