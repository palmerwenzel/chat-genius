import { create } from 'zustand';
import type { User } from '@supabase/supabase-js';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/types/supabase';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
  setUser: (user: User | null) => void;
  signOut: () => Promise<void>;
  initialize: () => Promise<void>;
}

export const useAuth = create<AuthState>((set) => {
  const supabase = createClientComponentClient<Database>();

  return {
    user: null,
    isLoading: true,
    error: null,
    setUser: (user) => set({ user }),

    signOut: async () => {
      try {
        await supabase.auth.signOut();
        set({ user: null });
      } catch (error) {
        set({ error: error as Error });
      }
    },

    initialize: async () => {
      try {
        // Get initial session
        const { data: { user } } = await supabase.auth.getUser();
        set({ user, isLoading: false });

        // Listen for auth changes
        supabase.auth.onAuthStateChange(async (event, session) => {
          set({ user: session?.user ?? null });
        });
      } catch (error) {
        set({ error: error as Error, isLoading: false });
      }
    },
  };
}); 