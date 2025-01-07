import { create } from 'zustand';
import type { User } from '@supabase/supabase-js';
import { auth } from '@/services/auth';
import type { StateCreator } from 'zustand';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
  initialized: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, options?: { name?: string }) => Promise<void>;
  signOut: () => Promise<void>;
  signInWithProvider: (provider: 'github' | 'google') => Promise<void>;
  updateProfile: (profile: { name?: string; avatar_url?: string }) => Promise<void>;
}

type AuthStore = StateCreator<AuthState>;

export const useAuth = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  error: null,
  initialized: false,

  signIn: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const { user, error } = await auth.signIn(email, password);
      if (error) throw error;
      set({ user, isLoading: false });
    } catch (error) {
      set({ error: error as Error, isLoading: false });
      throw error;
    }
  },

  signUp: async (email: string, password: string, options?: { name?: string }) => {
    set({ isLoading: true, error: null });
    try {
      const { user, error } = await auth.signUp(email, password, options);
      if (error) throw error;
      set({ user, isLoading: false });
    } catch (error) {
      set({ error: error as Error, isLoading: false });
      throw error;
    }
  },

  signOut: async () => {
    set({ isLoading: true, error: null });
    try {
      const { error } = await auth.signOut();
      if (error) throw error;
      set({ user: null, isLoading: false });
    } catch (error) {
      set({ error: error as Error, isLoading: false });
      throw error;
    }
  },

  signInWithProvider: async (provider: 'github' | 'google') => {
    set({ isLoading: true, error: null });
    try {
      const { error } = await auth.signInWithProvider(provider);
      if (error) throw error;
      // Note: Auth state change will handle setting the user
      set({ isLoading: false });
    } catch (error) {
      set({ error: error as Error, isLoading: false });
      throw error;
    }
  },

  updateProfile: async (profile: { name?: string; avatar_url?: string }) => {
    set({ isLoading: true, error: null });
    try {
      const { user, error } = await auth.updateProfile(profile);
      if (error) throw error;
      set({ user, isLoading: false });
    } catch (error) {
      set({ error: error as Error, isLoading: false });
      throw error;
    }
  },
}));

// Initialize auth state
auth.getSession().then(({ user }) => {
  useAuth.setState({ user, isLoading: false, initialized: true });
});

// Subscribe to auth changes
auth.onAuthStateChange((user) => {
  useAuth.setState({ user, isLoading: false });
}); 