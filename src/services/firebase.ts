/**
 * Firebase initialization and configuration
 * Note: Firebase Storage is not used; profile images are stored as base64 in Firestore.
 */

import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import Constants from 'expo-constants';

/*const firebaseConfig = Constants.expoConfig?.extra ? {
  apiKey: Constants.expoConfig.extra.FIREBASE_API_KEY as string,
  authDomain: Constants.expoConfig.extra.FIREBASE_AUTH_DOMAIN as string,
  projectId: Constants.expoConfig.extra.FIREBASE_PROJECT_ID as string,
  storageBucket: Constants.expoConfig.extra.FIREBASE_STORAGE_BUCKET as string,
  messagingSenderId: Constants.expoConfig.extra.FIREBASE_MESSAGING_SENDER_ID as string,
  appId: Constants.expoConfig.extra.FIREBASE_APP_ID as string,
} : undefined; 

const firebaseConfig = {
  apiKey:"AIzaSyDNWrbe6ctqzKmiOXfVb4F0zUpQy0jsDTY",
  authDomain:"stridely.firebaseapp.com",
  projectId:"stridely",
  storageBucket: "stridely.appspot.com",
  messagingSenderId:"976780905950",
  appId:"1:976780905950:web:f16670adbf87b0518be14f"
}; */
const firebaseConfig = {
  apiKey: "AIzaSyDNWrbe6ctqzKmiOXfVb4F0zUpQy0jsDTY",
  authDomain: "stridely-cb694.firebaseapp.com",
  projectId: "stridely-cb694",
  storageBucket: "stridely-cb694.firebasestorage.app",
  messagingSenderId: "976780905950",
  appId: "1:976780905950:web:f16670adbf87b0518be14f"
};
let app: FirebaseApp | null = null;
console.log('[FIREBASE DEBUG] expoConfig.extra:', Constants.expoConfig?.extra);

if (Constants.expoConfig?.extra) {
  console.log('[FIREBASE DEBUG] FIREBASE_API_KEY', Constants.expoConfig.extra.FIREBASE_API_KEY);
  console.log('[FIREBASE DEBUG] FIREBASE_PROJECT_ID', Constants.expoConfig.extra.FIREBASE_PROJECT_ID);
}
// @ts-ignore - __DEV__ is injected by Metro
const isDev = __DEV__;

// DEBUG: Log config injection
if (isDev) {
  console.log('[FIREBASE] Config check:', {
    configExists: !!firebaseConfig,
    apiKey: firebaseConfig?.apiKey ? '✓ Present' : '✗ Missing',
    projectId: firebaseConfig?.projectId ?? 'undefined',
    expoConfigExtra: Constants.expoConfig?.extra ? 'exists' : 'missing',
    extraKeys: Constants.expoConfig?.extra ? Object.keys(Constants.expoConfig.extra) : 'none',
  });
}

export function getFirebaseApp(): FirebaseApp {
  if (!app) {
    if (!firebaseConfig?.apiKey) {
      const errorMsg = `[FIREBASE ERROR] Config missing. Steps:
1. Create .env file at project root with EXPO_PUBLIC_* variables
2. Variables: EXPO_PUBLIC_FIREBASE_API_KEY, EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN, etc.

3. Restart Expo: npx expo start --clear
Current config: ${JSON.stringify(Constants.expoConfig?.extra, null, 2)}`;
      console.error(errorMsg);
      throw new Error('Firebase config missing. Set EXPO_PUBLIC_FIREBASE_* variables in .env');
    }
    if (isDev) console.log('[FIREBASE] Initializing with projectId:', firebaseConfig.projectId);
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
  if (isDev) console.log('[FIREBASE] Connecting to emulators:', { authHost, firestoreHost });
  connectAuthEmulator(auth(), `http://${authHost}`);
  connectFirestoreEmulator(firestore(), firestoreHost.split('://')[1], 8080);
}
