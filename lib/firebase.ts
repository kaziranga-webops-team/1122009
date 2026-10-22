"use client";

import { initializeApp, getApp, getApps, type FirebaseApp } from "firebase/app";
import { getDatabase, ref, get } from "firebase/database";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getAuth, signInWithEmailAndPassword, signOut as firebaseSignOut, onAuthStateChanged, GoogleAuthProvider, type User } from "firebase/auth";

// ─────────────────────────────────────────────────────────────────────────────
// 🔥 FIREBASE CONFIGURATION
//
// Two Firebase projects are in play:
//
//  1. PRIMARY  — the event portal project (Auth + Cloud Firestore). Configured
//     entirely from NEXT_PUBLIC_FIREBASE_* in .env.local. There are deliberately
//     no hardcoded fallbacks: if the env is missing the app drops into mock mode
//     rather than silently talking to the wrong project.
//
//  2. LEGACY RTDB — the original kaziranga-now project, which still holds the
//     gallery "likes" Realtime Database. Overridable via NEXT_PUBLIC_LEGACY_RTDB_*.
//     If NEXT_PUBLIC_FIREBASE_DATABASE_URL is set on the primary project, the
//     primary app is used for RTDB instead and the legacy app is never created.
// ─────────────────────────────────────────────────────────────────────────────
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// The project that owns the gallery likes Realtime Database.
const legacyRtdbConfig = {
  apiKey: process.env.NEXT_PUBLIC_LEGACY_RTDB_API_KEY || "AIzaSyBknQE-t_HokpziJW-4aqL-7mAUHvozZjM",
  authDomain: process.env.NEXT_PUBLIC_LEGACY_RTDB_AUTH_DOMAIN || "kaziranga-now.firebaseapp.com",
  databaseURL:
    process.env.NEXT_PUBLIC_LEGACY_RTDB_DATABASE_URL ||
    "https://kaziranga-now-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: process.env.NEXT_PUBLIC_LEGACY_RTDB_PROJECT_ID || "kaziranga-now",
  storageBucket: process.env.NEXT_PUBLIC_LEGACY_RTDB_STORAGE_BUCKET || "kaziranga-now.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_LEGACY_RTDB_MESSAGING_SENDER_ID || "27284521482",
  appId: process.env.NEXT_PUBLIC_LEGACY_RTDB_APP_ID || "1:27284521482:web:f48e16d333dddb347c55f3",
};

const PLACEHOLDER_KEYS = ["YOUR_API_KEY", "[GCP_API_KEY]", "demo-api-key", "your_firebase_api_key"];

// Only initialize if we have a real config, otherwise we'll run in "fallback/mock" mode
const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.projectId &&
  firebaseConfig.appId &&
  !PLACEHOLDER_KEYS.includes(firebaseConfig.apiKey)
);

export const isMockMode =
  process.env.NEXT_PUBLIC_USE_MOCK_FIREBASE === "true" || !isFirebaseConfigured;

const LEGACY_RTDB_APP_NAME = "kaziranga-legacy-rtdb";

function getOrInitApp(name: string, config: Record<string, unknown>): FirebaseApp {
  const existing = getApps().find((a) => a.name === name);
  if (existing) return existing;
  return name === "[DEFAULT]" ? initializeApp(config) : initializeApp(config, name);
}

export const app = isFirebaseConfigured ? getOrInitApp("[DEFAULT]", firebaseConfig) : undefined;

export const auth = app ? getAuth(app) : (null as unknown as ReturnType<typeof getAuth>);
export const db = app ? getFirestore(app) : (null as unknown as Firestore);
export const googleProvider = new GoogleAuthProvider();

// Gallery likes RTDB. Prefer the primary project when it declares a databaseURL,
// otherwise fall back to the legacy kaziranga-now project that holds the data.
export const database = (() => {
  try {
    if (app && firebaseConfig.databaseURL) return getDatabase(app);
    if (!legacyRtdbConfig.databaseURL) return null;
    return getDatabase(getOrInitApp(LEGACY_RTDB_APP_NAME, legacyRtdbConfig));
  } catch (error) {
    console.error("Failed to initialize Realtime Database:", error);
    return null;
  }
})();

export { signInWithEmailAndPassword, firebaseSignOut, onAuthStateChanged, GoogleAuthProvider, type User };

// ─── Shared Database Helpers ─────────────────────────────────────────────────

export interface LikeData {
  count: number;
  month: string; // YYYY-MM
}

/**
 * Deterministically generates a safe Firebase key from an image row
 */
export function generateImageId(student: string, timestamp: string): string {
  // Remove invalid firebase key characters: . # $ [ ] / as well as colons and commas
  const raw = `${student}_${timestamp}`;
  return raw.replace(/[.#$\[\]\/\\:,]/g, "_").replace(/\s+/g, "_");
}

/**
 * Returns the current month string for monthly top picks tracking
 */
export function getCurrentMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

/**
 * Fetch the top X most liked images for the current month.
 */
export async function getTopPicksForMonth(month: string, limit = 15): Promise<{ id: string; count: number }[]> {
  if (!database) return [];

  try {
    // Note: To make orderByChild('count') highly performant, you should add
    // an index in Firebase Realtime Database rules:
    // "likes": { ".indexOn": "count" }
    
    // However, Firebase doesn't support complex composite queries easily 
    // (like "where month == X AND order by count"). 
    // Since this is a small scale app, we'll fetch all likes, filter in memory, 
    // and sort. For thousands of photos, a different schema would be needed.

    const likesRef = ref(database, 'likes');
    const snapshot = await get(likesRef);
    
    if (!snapshot.exists()) return [];

    const allLikes: { id: string; count: number; month: string }[] = [];
    snapshot.forEach((child) => {
      const data = child.val();
      allLikes.push({
        id: child.key as string,
        count: data.count || 0,
        month: data.month || "",
      });
    });

    // Filter by current month, sort descending by count, take top 'limit'
    return allLikes
      .filter(l => l.month === month)
      .sort((a, b) => b.count - a.count)
      .slice(0, limit)
      .map(l => ({ id: l.id, count: l.count }));

  } catch (error) {
    console.error("Error fetching top picks:", error);
    return [];
  }
}
