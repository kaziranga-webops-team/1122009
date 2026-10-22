"use client";

import { initializeApp } from "firebase/app";
import { getDatabase, ref, runTransaction, get, query, orderByChild, limitToLast } from "firebase/database";
import { getAuth, signInWithEmailAndPassword, signOut as firebaseSignOut, onAuthStateChanged, type User } from "firebase/auth";

// ─────────────────────────────────────────────────────────────────────────────
// 🔥 FIREBASE CONFIGURATION INSTRUCTIONS
// ─────────────────────────────────────────────────────────────────────────────
// Since you don't have a Firebase project yet, follow these steps to set one up
// and get your config keys. It's 100% free and takes 5 minutes.
//
// 1. Go to https://console.firebase.google.com/
// 2. Click "Add Project" -> Name it "Kaziranga Now" -> Disable Google Analytics (optional) -> Create.
// 3. Once created, click the Web icon (</>) on the project overview page to add a web app.
// 4. Register the app (name it "kaziranga-web").
// 5. You will see a `firebaseConfig` object. Copy those values and paste them below.
// 6. Go to "Realtime Database" in the left sidebar under Build.
// 7. Click "Create Database" -> Start in "Test Mode" (so anyone can read/write for now).
//    (Later you can restrict rules to only allow incrementing likes).
// ─────────────────────────────────────────────────────────────────────────────

// Values come from NEXT_PUBLIC_FIREBASE_* env vars when set, else fall back to
// the project defaults below. (Firebase web config is not secret, but env vars
// keep it configurable per environment.)
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyBknQE-t_HokpziJW-4aqL-7mAUHvozZjM",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "kaziranga-now.firebaseapp.com",
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL || "https://kaziranga-now-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "kaziranga-now",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "kaziranga-now.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "27284521482",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:27284521482:web:f48e16d333dddb347c55f3",
};

// Only initialize if we have a real config, otherwise we'll run in "fallback" mode
const isFirebaseConfigured = firebaseConfig.apiKey !== "YOUR_API_KEY" && firebaseConfig.apiKey !== "[GCP_API_KEY]";

export const app = isFirebaseConfigured ? initializeApp(firebaseConfig) : undefined;
export const database = isFirebaseConfigured ? getDatabase(app!) : null;
export const auth = isFirebaseConfigured ? getAuth(app!) : null;
export { signInWithEmailAndPassword, firebaseSignOut, onAuthStateChanged, type User };

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
