"use server";

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getSupabaseServer } from '@/lib/supabase/supabase-server';
import { logger } from '@/lib/logger';

interface AuthResult<T = null> {
  data: T | null;
  error: string | null;
}

export async function signInWithEmail(formData: FormData): Promise<AuthResult> {
  try {
    const supabase = await getSupabaseServer();
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      logger.error('auth.signIn', error, { email });
      
      if (error.message === 'Email not confirmed') {
        // Send another confirmation email
        await supabase.auth.resend({
          type: 'signup',
          email,
        });
        return { data: null, error: 'Email not confirmed. A new confirmation email has been sent.' };
      }
      
      return { data: null, error: error.message };
    }

    redirect('/chat');
  } catch (error) {
    logger.error('auth.signIn.unexpected', error);
    return { data: null, error: 'An unexpected error occurred' };
  }
}

export async function signInWithOAuth(provider: 'github' | 'google'): Promise<AuthResult<string>> {
  try {
    const supabase = await getSupabaseServer();
    const cookieStore = await cookies();
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

    return { data: data.url, error: null };
  } catch (error) {
    logger.error('auth.oauth.unexpected', error);
    return { data: null, error: 'An unexpected error occurred' };
  }
}

export async function signOut(): Promise<AuthResult> {
  try {
    const supabase = await getSupabaseServer();
    const { error } = await supabase.auth.signOut();

    if (error) {
      logger.error('auth.signOut', error);
      return { data: null, error: error.message };
    }

    redirect('/login');
  } catch (error) {
    logger.error('auth.signOut.unexpected', error);
    return { data: null, error: 'An unexpected error occurred' };
  }
}