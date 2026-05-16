/**
 * Firebase Authentication service
 *
 * Supports:
 * - Email/password sign-up and sign-in
 * - Phone OTP authentication via RecaptchaVerifier (web)
 * - Persistent sessions via AsyncStorage
 */

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  signInWithPhoneNumber,
  RecaptchaVerifier,
  type User,
  type UserCredential,
  type ConfirmationResult,
} from 'firebase/auth';
import { auth } from './firebase';
import { Platform } from 'react-native';

export { auth };
export type { ConfirmationResult };

// ─── Email/Password ───────────────────────────────────────

export function signUp(
  email: string,
  password: string
): Promise<UserCredential> {
  return createUserWithEmailAndPassword(auth(), email, password);
}

export function signIn(
  email: string,
  password: string
): Promise<UserCredential> {
  return signInWithEmailAndPassword(auth(), email, password);
}

export function signOut(): Promise<void> {
  return firebaseSignOut(auth());
}

export function subscribeToAuthState(
  callback: (user: User | null) => void
): () => void {
  return onAuthStateChanged(auth(), callback);
}

// ─── Phone OTP ────────────────────────────────────────────

let recaptchaVerifier: RecaptchaVerifier | null = null;

/**
 * Initialize invisible reCAPTCHA verifier (web only).
 * Must be called before sendPhoneOTP.
 * The containerId should reference a DOM element in the page.
 */
export function initRecaptcha(containerId: string = 'recaptcha-container'): RecaptchaVerifier {
  if (Platform.OS !== 'web') {
    throw new Error(
      'Phone OTP via RecaptchaVerifier is only supported on web. ' +
      'For native builds, use @react-native-firebase/auth instead.'
    );
  }

  if (recaptchaVerifier) {
    return recaptchaVerifier;
  }

  recaptchaVerifier = new RecaptchaVerifier(auth(), containerId, {
    size: 'invisible',
    callback: () => {
      // reCAPTCHA solved — will proceed with phone sign-in
    },
  });

  return recaptchaVerifier;
}

/**
 * Send OTP to a phone number.
 * Returns a ConfirmationResult to verify the code.
 *
 * @param phoneNumber - Full international format e.g. "+919876543210"
 */
export async function sendPhoneOTP(phoneNumber: string): Promise<ConfirmationResult> {
  const verifier = initRecaptcha();
  const confirmation = await signInWithPhoneNumber(auth(), phoneNumber, verifier);
  return confirmation;
}

/**
 * Verify the OTP code against the confirmation result.
 *
 * @param confirmationResult - From sendPhoneOTP
 * @param otp - The 6-digit code
 */
export async function verifyPhoneOTP(
  confirmationResult: ConfirmationResult,
  otp: string
): Promise<UserCredential> {
  return confirmationResult.confirm(otp);
}

/**
 * Reset the reCAPTCHA verifier (e.g., on unmount or error).
 */
export function resetRecaptcha(): void {
  if (recaptchaVerifier) {
    recaptchaVerifier.clear();
    recaptchaVerifier = null;
  }
}
