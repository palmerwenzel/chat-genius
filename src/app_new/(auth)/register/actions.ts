'use server';

import { cookies } from 'next/headers';
import { getSupabaseServer } from '@/lib/supabase/server';

export async function signUpWithEmail(formData: FormData) {
  const supabase = getSupabaseServer();
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const confirmPassword = formData.get('confirmPassword') as string;

  // Validate passwords match
  if (password !== confirmPassword) {
    return { error: 'Passwords do not match' };
  }

  // Validate password strength
  if (password.length < 8) {
    return { error: 'Password must be at least 8 characters long' };
  }

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
    },
  });

  if (error) {
    return { error: error.message };
  }

  // Return success, the client will show email confirmation message
  return { success: true };
}

export async function signUpWithOAuth(provider: 'github' | 'google') {
  const supabase = getSupabaseServer();
  const origin = cookies().get('origin')?.value || process.env.NEXT_PUBLIC_APP_URL;

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${origin}/auth/callback`,
    },
  });

  if (error) {
    return { error: error.message };
  }

  return { url: data.url };
} 