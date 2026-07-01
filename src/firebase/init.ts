'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

/**
 * Initializes Firebase if it hasn't been initialized yet.
 * Returns the core service instances.
 */
export function initializeFirebase() {
  let app: FirebaseApp;
  
  // In Next.js, ensure we don't initialize multiple apps during HMR
  if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApp();
  }

  return getSdks(app);
}

/**
 * Returns the initialized Firebase SDKs for the given app.
 */
export function getSdks(firebaseApp: FirebaseApp) {
  return {
    firebaseApp,
    auth: getAuth(firebaseApp),
    firestore: getFirestore(firebaseApp)
  };
}
