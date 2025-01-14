'use client';

import { create } from 'zustand';
import type { User } from '@supabase/supabase-js';
import { AuthService, OAuthProvider } from '@/services/auth';
import { createBrowserSupabaseClient } from '@/utils/supabase/client';
import { handleSupabaseError } from '@/utils/supabase/helpers';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
  initialized: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  signInWithProvider: (provider: OAuthProvider) => Promise<void>;
}

/**
 * Global auth store using Zustand
 * Manages authentication state and provides auth methods
 */
export const useAuth = create<AuthState>((set) => {
  const supabase = createBrowserSupabaseClient();
  const authService = new AuthService(supabase);

  return {
    user: null,
    isLoading: true,
    error: null,
    initialized: false,

    signIn: async (email: string, password: string) => {
      set({ isLoading: true, error: null });
      try {
        await authService.signInWithEmail(email, password);
        const session = await authService.getSession();
        set({ user: session?.user ?? null, isLoading: false });
      } catch (error) {
        console.error('Sign in error:', handleSupabaseError(error));
        set({ error: error as Error, isLoading: false });
        throw error;
      }
    },

    signUp: async (email: string, password: string) => {
      set({ isLoading: true, error: null });
      try {
        await authService.signUpWithEmail(email, password);
        // Note: User needs to verify email before session is created
        set({ isLoading: false });
      } catch (error) {
        console.error('Sign up error:', handleSupabaseError(error));
        set({ error: error as Error, isLoading: false });
        throw error;
      }
    },

    signOut: async () => {
      set({ isLoading: true, error: null });
      try {
        await authService.signOut();
        set({ user: null, isLoading: false });
      } catch (error) {
        console.error('Sign out error:', handleSupabaseError(error));
        set({ error: error as Error, isLoading: false });
        throw error;
      }
    },

    signInWithProvider: async (provider: OAuthProvider) => {
      set({ isLoading: true, error: null });
      try {
        await authService.signInWithProvider(provider, {
          redirectTo: window.location.origin + '/auth/callback'
        });
        // Note: Auth state change will handle setting the user
        set({ isLoading: false });
      } catch (error) {
        console.error('OAuth error:', handleSupabaseError(error));
        set({ error: error as Error, isLoading: false });
        throw error;
      }
    },
  };
});

// Initialize auth state
const supabase = createBrowserSupabaseClient();
const authService = new AuthService(supabase);

// Get initial session
authService.getSession().then((session) => {
  useAuth.setState({ user: session?.user ?? null, isLoading: false, initialized: true });
});

// Subscribe to auth changes
supabase.auth.onAuthStateChange((_event, session) => {
  useAuth.setState({ user: session?.user ?? null, isLoading: false });
}); 