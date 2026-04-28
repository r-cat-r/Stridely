/**
 * Auth context and provider
 */

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
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

  const loadProfile = useCallback(async (uid: string): Promise<UserProfile | null> => {
    if (__DEV__) console.log('[AUTH] Loading profile for:', uid);
    let profile = await getUserProfile(uid);
    if (!profile) {
      if (__DEV__) console.log('[AUTH] No profile found, creating new user profile');
      const { auth } = await import('@/services/authService');
      const authUser = auth().currentUser;
      if (authUser) {
        await createUserProfile(uid, {
          email: authUser.email ?? '',
          displayName: authUser.displayName ?? authUser.email ?? '',
          photoURL: authUser.photoURL ?? null,
        });
        profile = await getUserProfile(uid);
        if (__DEV__) console.log('[AUTH] Profile created:', profile?.id);
      }
    }
    return profile ?? null;
  }, []);

  const refreshProfile = useCallback(async (): Promise<void> => {
    if (!state.userId) {
      if (__DEV__) console.log('[AUTH] refreshProfile: no userId');
      return;
    }
    if (__DEV__) console.log('[AUTH] Refreshing profile for:', state.userId);
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const profile = await loadProfile(state.userId);
      setState((s) => ({ ...s, profile, loading: false, error: null }));
      if (__DEV__) console.log('[AUTH] Profile refreshed');
    } catch (err) {
      if (__DEV__) console.error('[AUTH] Profile refresh error:', err);
      setState((s) => ({
        ...s,
        loading: false,
        error: err instanceof Error ? err : new Error(String(err)),
      }));
    }
  }, [state.userId, loadProfile]);

  const signOut = useCallback(async (): Promise<void> => {
    await authSignOut();
    setState({ userId: null, profile: null, loading: false, error: null });
  }, []);

  useEffect(() => {
    if (__DEV__) console.log('[AUTH] Setting up auth state listener');
    const unsub = subscribeToAuthState(async (user) => {
      if (__DEV__) console.log('[AUTH] Auth state changed:', user ? `uid=${user.uid}` : 'logged out');
      if (!user) {
        setState({ userId: null, profile: null, loading: false, error: null });
        return;
      }
      setState((s) => ({ ...s, userId: user.uid, loading: true, error: null }));
      try {
        const profile = await loadProfile(user.uid);
        setState({ userId: user.uid, profile, loading: false, error: null });
      } catch (err) {
        if (__DEV__) console.error('[AUTH] Error loading profile:', err);
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
