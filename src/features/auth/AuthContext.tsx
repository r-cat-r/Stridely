/**
 * Auth context and provider
 *
 * Provides userId, profile, and auth actions to the entire app.
 * refreshProfile does a SILENT background refresh (no loading spinner)
 * to avoid cascading re-renders across all screens.
 *
 * Now includes `needsOnboarding` state for post-signup sport selection.
 */

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
  type ReactNode,
} from 'react';
import { subscribeToAuthState, signOut as authSignOut } from '@/services/authService';
import { getUserProfile, createUserProfile, updateLastActive, updateUserProfile } from '@/services/userService';
import type { UserProfile } from '@/types';

interface AuthState {
  userId: string | null;
  profile: UserProfile | null;
  loading: boolean;
  error: Error | null;
  /** True when user is authenticated but hasn't completed sport onboarding */
  needsOnboarding: boolean;
}

interface AuthContextValue extends AuthState {
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  completeOnboarding: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }): React.JSX.Element {
  const [state, setState] = useState<AuthState>({
    userId: null,
    profile: null,
    loading: true,
    error: null,
    needsOnboarding: false,
  });

  // Ref to avoid stale closure in refreshProfile
  const userIdRef = useRef<string | null>(null);
  userIdRef.current = state.userId;

  const loadProfile = useCallback(async (uid: string): Promise<UserProfile | null> => {
    let profile = await getUserProfile(uid);
    if (!profile) {
      const { auth } = await import('@/services/authService');
      const authUser = auth().currentUser;
      if (authUser) {
        await createUserProfile(uid, {
          email: authUser.email ?? '',
          displayName: authUser.displayName ?? authUser.email ?? authUser.phoneNumber ?? '',
          photoURL: authUser.photoURL ?? null,
        });
        profile = await getUserProfile(uid);
      }
    }
    return profile ?? null;
  }, []);

  /**
   * Check if user needs sport selection onboarding
   */
  const checkOnboarding = useCallback((profile: UserProfile | null): boolean => {
    if (!profile) return false;
    // User needs onboarding if they have no sports profiles AND haven't explicitly skipped
    return profile.sportsProfiles.length === 0 && !profile.onboardingComplete;
  }, []);

  /**
   * Silent refresh — does NOT set loading: true.
   * This prevents the entire app from unmounting/remounting screens
   * just because the profile is being re-fetched.
   */
  const refreshProfile = useCallback(async (): Promise<void> => {
    const uid = userIdRef.current;
    if (!uid) return;
    try {
      const profile = await loadProfile(uid);
      setState((s) => ({
        ...s,
        profile,
        error: null,
        needsOnboarding: checkOnboarding(profile),
      }));
    } catch (err) {
      console.error('[AUTH] Profile refresh error:', err);
      setState((s) => ({
        ...s,
        error: err instanceof Error ? err : new Error(String(err)),
      }));
    }
  }, [loadProfile, checkOnboarding]);

  /**
   * Mark onboarding as complete
   */
  const completeOnboarding = useCallback(async (): Promise<void> => {
    const uid = userIdRef.current;
    if (!uid) return;
    try {
      await updateUserProfile(uid, { onboardingComplete: true } as any);
      setState((s) => ({ ...s, needsOnboarding: false }));
    } catch (err) {
      console.error('[AUTH] Error completing onboarding:', err);
    }
  }, []);

  const signOut = useCallback(async (): Promise<void> => {
    await authSignOut();
    setState({ userId: null, profile: null, loading: false, error: null, needsOnboarding: false });
  }, []);

  useEffect(() => {
    const unsub = subscribeToAuthState(async (user) => {
      if (!user) {
        setState({ userId: null, profile: null, loading: false, error: null, needsOnboarding: false });
        return;
      }
      setState((s) => ({ ...s, userId: user.uid, loading: true, error: null }));
      try {
        const profile = await loadProfile(user.uid);
        setState({
          userId: user.uid,
          profile,
          loading: false,
          error: null,
          needsOnboarding: checkOnboarding(profile),
        });
      } catch (err) {
        console.error('[AUTH] Error loading profile:', err);
        setState({
          userId: user.uid,
          profile: null,
          loading: false,
          error: err instanceof Error ? err : new Error(String(err)),
          needsOnboarding: false,
        });
      }
    });
    return unsub;
  }, [loadProfile, checkOnboarding]);

  // Track lastActive every 5 minutes
  useEffect(() => {
    if (!state.userId) return;
    const uid = state.userId;
    updateLastActive(uid).catch(() => {});
    const interval = setInterval(() => {
      updateLastActive(uid).catch(() => {});
    }, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [state.userId]);

  const value: AuthContextValue = {
    ...state,
    signOut,
    refreshProfile,
    completeOnboarding,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
