/**
 * Firebase initialization and configuration
 * Note: Firebase Storage is not used; profile images are stored as base64 in Firestore.
 */

import { initializeApp, type FirebaseApp } from 'firebase/app';
import { initializeAuth, getAuth, connectAuthEmulator } from 'firebase/auth';
// @ts-ignore - getReactNativePersistence exists at runtime in firebase/auth
import { getReactNativePersistence } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: "AIzaSyDNWrbe6ctqzKmiOXfVb4F0zUpQy0jsDTY",
  authDomain: "stridely-cb694.firebaseapp.com",
  projectId: "stridely-cb694",
  storageBucket: "stridely-cb694.firebasestorage.app",
  messagingSenderId: "976780905950",
  appId: "1:976780905950:web:f16670adbf87b0518be14f"
};

let app: FirebaseApp | null = null;

// @ts-ignore - __DEV__ is injected by Metro
const isDev = __DEV__;

export function getFirebaseApp(): FirebaseApp {
  if (!app) {
    if (!firebaseConfig?.apiKey) {
      throw new Error('Firebase config missing. Set EXPO_PUBLIC_FIREBASE_* variables in .env');
    }
    app = initializeApp(firebaseConfig);
    // Initialize auth with AsyncStorage persistence so sessions persist
    initializeAuth(app, {
      persistence: getReactNativePersistence(ReactNativeAsyncStorage),
    });
  }
  return app;
}

export const auth = () => getAuth(getFirebaseApp());
export const firestore = () => getFirestore(getFirebaseApp());

export function connectEmulators(
  authHost: string,
  firestoreHost: string
): void {
  if (isDev) console.log('[FIREBASE] Connecting to emulators:', { authHost, firestoreHost });
  connectAuthEmulator(auth(), `http://${authHost}`);
  connectFirestoreEmulator(firestore(), firestoreHost.split('://')[1], 8080);
}
