import { initializeApp, getApps } from 'firebase/app';
import { getDatabase } from 'firebase/database';

const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
const databaseURL = import.meta.env.VITE_FIREBASE_DATABASE_URL;
const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;

export const isFirebaseConfigured = !!(apiKey && databaseURL);

let _db = null;

if (isFirebaseConfigured) {
  try {
    const app = getApps().length === 0
      ? initializeApp({ apiKey, authDomain: `${projectId}.firebaseapp.com`, databaseURL, projectId })
      : getApps()[0];
    // Pass databaseURL explicitly for non-US regions (Europe, etc.)
    _db = getDatabase(app, databaseURL);
  } catch (err) {
    console.error('[Firebase] Initialisation échouée :', err);
  }
}

export const db = _db;
