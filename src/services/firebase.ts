/**
 * Firebase initialization and configuration
 * Note: Firebase Storage is not used; profile images are stored as base64 in Firestore.
 */

import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import Constants from 'expo-constants';

const firebaseConfig = Constants.expoConfig?.extra?.firebase as
  | {
      apiKey: string;
      authDomain: string;
      projectId: string;
      storageBucket: string;
      messagingSenderId: string;
      appId: string;
    }
  | undefined;

let app: FirebaseApp | null = null;

export function getFirebaseApp(): FirebaseApp {
  if (!app) {
    if (!firebaseConfig?.apiKey) {
      throw new Error(
        'Firebase config missing. Set FIREBASE_* variables in .env'
      );
    }
    app = initializeApp(firebaseConfig);
  }
  return app;
}

export const auth = () => getAuth(getFirebaseApp());
export const firestore = () => getFirestore(getFirebaseApp());

export function connectEmulators(
  authHost: string,
  firestoreHost: string
): void {
  connectAuthEmulator(auth(), `http://${authHost}`);
  connectFirestoreEmulator(firestore(), firestoreHost.split('://')[1], 8080);
}
