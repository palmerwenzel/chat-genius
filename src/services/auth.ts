import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { AuthError, User } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

export type AuthResponse = {
  user: User | null;
  error: AuthError | null;
};

const supabase = createClientComponentClient<Database>();

export const auth = {
  // Get current session
  getSession: async () => {
    const { data: { session }, error } = await supabase.auth.getSession();
    return { user: session?.user ?? null, error };
  },

  // Sign in with email and password
  signIn: async (email: string, password: string): Promise<AuthResponse> => {
    const { data: { user }, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { user, error };
  },

  // Sign up with email and password
  signUp: async (email: string, password: string, options?: { name?: string }): Promise<AuthResponse> => {
    const searchParams = new URLSearchParams(window.location.search);
    const next = searchParams.get('redirect') || '/chat';

    const { data: { user }, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${next}`,
        data: options?.name ? { name: options.name } : undefined,
      },
    });
    return { user, error };
  },

  // Sign out
  signOut: async () => {
    const { error } = await supabase.auth.signOut({
      scope: 'local' // This ensures we only sign out on this device
    });
    return { error };
  },

  // Update user profile
  updateProfile: async (profile: {
    name?: string;
    avatar_url?: string;
  }): Promise<AuthResponse> => {
    const { data: { user }, error } = await supabase.auth.updateUser({
      data: profile,
    });
    return { user, error };
  },

  // OAuth sign in
  signInWithProvider: async (provider: 'github' | 'google') => {
    const searchParams = new URLSearchParams(window.location.search);
    const next = searchParams.get('redirect') || '/chat';

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${next}`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });
    return { data, error };
  },

  // Subscribe to auth state changes
  onAuthStateChange: (callback: (user: User | null) => void) => {
    return supabase.auth.onAuthStateChange((event, session) => {
      callback(session?.user ?? null);
    });
  },
}; 