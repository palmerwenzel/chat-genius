'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getSupabaseServer } from '@/lib/supabase/supabase-server';

export async function login(formData: FormData) {
  const supabase = await getSupabaseServer();
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    return redirect('/error');
  }

  revalidatePath('/');
  return redirect('/chat'); // or wherever you'd like
}

export async function signup(formData: FormData) {
  const supabase = await getSupabaseServer();
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  const { error } = await supabase.auth.signUp({ email, password });
  if (error) {
    return redirect('/error');
  }

  revalidatePath('/');
  return redirect('/chat'); // or wherever you'd like
}