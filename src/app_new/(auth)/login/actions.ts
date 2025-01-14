"use server";

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getSupabaseServer } from '@/lib/supabase/server';

export async function signInWithEmail(formData: FormData) {
  const supabase = getSupabaseServer();
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    if (error.message === 'Email not confirmed') {
      // Send another confirmation email
      await supabase.auth.resend({
        type: 'signup',
        email,
      });
      return { error: error.message };
    }
    return { error: error.message };
  }

  redirect('/chat');
}

export async function signInWithOAuth(provider: 'github' | 'google') {
  const supabase = getSupabaseServer();
  const origin = (await cookies()).get('origin')?.value || process.env.NEXT_PUBLIC_APP_URL;

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