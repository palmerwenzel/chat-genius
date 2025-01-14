import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';

export type OAuthProvider = 'github' | 'google';

export interface OAuthOptions {
  redirectTo?: string;
  scopes?: string;
}

export class AuthService {
  constructor(private supabase: SupabaseClient<Database>) {}

  /**
   * Sign in with email and password
   * @param email User's email
   * @param password User's password
   * @returns The session data if successful
   */
  async signInWithEmail(email: string, password: string) {
    const { error } = await this.supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
  }

  /**
   * Sign in with OAuth provider
   * @param provider The OAuth provider to use
   * @param options Additional OAuth options
   */
  async signInWithProvider(provider: OAuthProvider, options?: OAuthOptions) {
    const { error } = await this.supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: options?.redirectTo,
        scopes: options?.scopes,
      },
    });

    if (error) throw error;
  }

  /**
   * Sign up with email and password
   * @param email User's email
   * @param password User's password
   * @returns The session data if successful
   */
  async signUpWithEmail(email: string, password: string) {
    const { error } = await this.supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin + '/auth/callback',
      },
    });

    if (error) throw error;
  }

  /**
   * Sign out the current user
   */
  async signOut() {
    const { error } = await this.supabase.auth.signOut();
    if (error) throw error;
  }

  /**
   * Get the current session
   * @returns The current session if it exists
   */
  async getSession() {
    const { data: { session }, error } = await this.supabase.auth.getSession();
    if (error) throw error;
    return session;
  }
} 