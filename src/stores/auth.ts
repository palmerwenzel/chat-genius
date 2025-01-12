import { create } from 'zustand';
import { User } from '@supabase/supabase-js';
import { auth } from '@/services/auth';
import { presenceService } from '@/services/presence';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  initialized: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, options?: { name?: string }) => Promise<void>;
  signOut: () => Promise<void>;
  signInWithProvider: (provider: 'github' | 'google') => Promise<void>;
  updateProfile: (profile: { name?: string; avatar_url?: string }) => Promise<void>;
}

export const useAuth = create<AuthState>(() => ({
  user: null,
  isLoading: true,
  initialized: false,
  signIn: async (email: string, password: string) => {
    const { user, error } = await auth.signIn(email, password);
    if (error) throw error;
    useAuth.setState({ user });
  },
  signUp: async (email: string, password: string, options?: { name?: string }) => {
    const { user, error } = await auth.signUp(email, password, options);
    if (error) throw error;
    useAuth.setState({ user });
  },
  signOut: async () => {
    const { error } = await auth.signOut();
    if (error) throw error;
    useAuth.setState({ user: null });
  },
  signInWithProvider: async (provider: 'github' | 'google') => {
    const { error } = await auth.signInWithProvider(provider);
    if (error) throw error;
  },
  updateProfile: async (profile: { name?: string; avatar_url?: string }) => {
    const { user, error } = await auth.updateProfile(profile);
    if (error) throw error;
    useAuth.setState({ user });
  },
}));

// Initialize auth state
auth.getSession().then(({ user }) => {
  useAuth.setState({ user, isLoading: false, initialized: true });
  if (user) {
    presenceService.initialize(user.id);
  }
});

// Subscribe to auth changes
auth.onAuthStateChange(async (user) => {
  useAuth.setState({ user, isLoading: false, initialized: true });

  if (user) {
    // Initialize presence tracking
    await presenceService.initialize(user.id);
  } else {
    // Clean up presence tracking
    await presenceService.cleanup();
  }
}); 