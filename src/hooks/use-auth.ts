'use client';

import { useEffect, useState, useCallback } from 'react';
import { User } from '@supabase/supabase-js';
import { createBrowserSupabaseClient } from '@/utils/supabase/client';
import { AuthService } from '@/services/auth';
import { handleSupabaseError } from '@/utils/supabase/helpers';

interface UseAuthResult {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
  signOut: () => Promise<void>;
}

/**
 * Hook for managing authentication state
 * Provides the current user, loading state, and sign-out functionality
 */
export function useAuth(): UseAuthResult {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const supabase = createBrowserSupabaseClient();
  const authService = new AuthService(supabase);

  // Fetch initial session
  useEffect(() => {
    async function fetchSession() {
      try {
        const session = await authService.getSession();
        setUser(session?.user ?? null);
      } catch (error) {
        console.error('Error fetching session:', handleSupabaseError(error));
        setError(error instanceof Error ? error : new Error('Failed to fetch session'));
      } finally {
        setIsLoading(false);
      }
    }

    fetchSession();
  }, []);

  // Subscribe to auth state changes
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setIsLoading(false);
      setError(null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase.auth]);

  // Sign out handler
  const signOut = useCallback(async () => {
    try {
      setIsLoading(true);
      await authService.signOut();
      setUser(null);
    } catch (error) {
      console.error('Error signing out:', handleSupabaseError(error));
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [authService]);

  return {
    user,
    isLoading,
    error,
    signOut,
  };
} 