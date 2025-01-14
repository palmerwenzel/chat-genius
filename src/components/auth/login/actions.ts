'use server';

import { cookies } from 'next/headers';
import { getSupabaseServer } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
import type { AuthResult, EmailSignInData, EmailSignUpData, OAuthProvider } from '../types';

export async function signInWithEmail(data: EmailSignInData): Promise<AuthResult> {
  try {
    const supabase = getSupabaseServer();
    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });

    if (error) {
      logger.error('auth.signIn', error, { email: data.email });
      
      if (error.message === 'Email not confirmed') {
        // Send another confirmation email
        await supabase.auth.resend({
          type: 'signup',
          email: data.email,
        });
        return { data: null, error: 'Email not confirmed. A new confirmation email has been sent.' };
      }
      
      return { data: null, error: error.message };
    }

    return { data: null, error: null };
  } catch (error) {
    logger.error('auth.signIn.unexpected', error);
    return { data: null, error: 'An unexpected error occurred' };
  }
}

export async function signUpWithEmail(data: EmailSignUpData): Promise<AuthResult> {
  try {
    const supabase = getSupabaseServer();
    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
        data: data.name ? { name: data.name } : undefined,
      },
    });

    if (error) {
      logger.error('auth.signUp', error, { email: data.email });
      return { data: null, error: error.message };
    }

    return { 
      data: null, 
      error: null 
    };
  } catch (error) {
    logger.error('auth.signUp.unexpected', error);
    return { data: null, error: 'An unexpected error occurred' };
  }
}

export async function signInWithOAuth(provider: OAuthProvider): Promise<AuthResult<string>> {
  try {
    const supabase = getSupabaseServer();
    const cookieStore = cookies();
    const origin = cookieStore.get('origin')?.value || process.env.NEXT_PUBLIC_APP_URL;

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${origin}/auth/callback`,
      },
    });

    if (error) {
      logger.error('auth.oauth', error, { provider });
      return { data: null, error: error.message };
    }

    return { 
      data: data.url, 
      error: null 
    };
  } catch (error) {
    logger.error('auth.oauth.unexpected', error);
    return { data: null, error: 'An unexpected error occurred' };
  }
}

export async function signOut(): Promise<AuthResult> {
  try {
    const supabase = getSupabaseServer();
    const { error } = await supabase.auth.signOut();

    if (error) {
      logger.error('auth.signOut', error);
      return { data: null, error: error.message };
    }

    return { data: null, error: null };
  } catch (error) {
    logger.error('auth.signOut.unexpected', error);
    return { data: null, error: 'An unexpected error occurred' };
  }
} 