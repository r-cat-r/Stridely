/**
 * Auth context and provider
 *
 * Provides userId, profile, and auth actions to the entire app.
 * refreshProfile does a SILENT background refresh (no loading spinner)
 * to avoid cascading re-renders across all screens.
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
import { getUserProfile, createUserProfile } from '@/services/userService';
import type { UserProfile } from '@/types';

interface AuthState {
  userId: string | null;
  profile: UserProfile | null;
  loading: boolean;
  error: Error | null;
}

interface AuthContextValue extends AuthState {
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }): React.JSX.Element {
  const [state, setState] = useState<AuthState>({
    userId: null,
    profile: null,
    loading: true,
    error: null,
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
          displayName: authUser.displayName ?? authUser.email ?? '',
          photoURL: authUser.photoURL ?? null,
        });
        profile = await getUserProfile(uid);
      }
    }
    return profile ?? null;
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
      setState((s) => ({ ...s, profile, error: null }));
    } catch (err) {
      console.error('[AUTH] Profile refresh error:', err);
      setState((s) => ({
        ...s,
        error: err instanceof Error ? err : new Error(String(err)),
      }));
    }
  }, [loadProfile]);

  const signOut = useCallback(async (): Promise<void> => {
    await authSignOut();
    setState({ userId: null, profile: null, loading: false, error: null });
  }, []);

  useEffect(() => {
    const unsub = subscribeToAuthState(async (user) => {
      if (!user) {
        setState({ userId: null, profile: null, loading: false, error: null });
        return;
      }
      setState((s) => ({ ...s, userId: user.uid, loading: true, error: null }));
      try {
        const profile = await loadProfile(user.uid);
        setState({ userId: user.uid, profile, loading: false, error: null });
      } catch (err) {
        console.error('[AUTH] Error loading profile:', err);
        setState({
          userId: user.uid,
          profile: null,
          loading: false,
          error: err instanceof Error ? err : new Error(String(err)),
        });
      }
    });
    return unsub;
  }, [loadProfile]);

  const value: AuthContextValue = {
    ...state,
    signOut,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
