import { initializeApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { env } from "~/env";

// Server-side Firebase configuration - these env vars should NOT have NEXT_PUBLIC prefix
const firebaseConfig = {
  apiKey: env.FIREBASE_API_KEY,
  authDomain: env.FIREBASE_AUTH_DOMAIN,
  projectId: env.FIREBASE_PROJECT_ID,
  storageBucket: env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.FIREBASE_MESSAGING_SENDER_ID,
  appId: env.FIREBASE_APP_ID,
};

// Initialize Firebase only if it hasn't been initialized already
const app =
  getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]!;
const db = getFirestore(app);

export { db };
