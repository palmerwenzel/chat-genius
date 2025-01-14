'use server';

import { getSupabaseServer } from '@/lib/supabase/supabase-server';

export interface UserProfile {
  id: string;
  email: string | null;
  name: string | null;
  avatarUrl: string | null;
}

export async function getUserProfile(): Promise<UserProfile | null> {
  const supabase = await getSupabaseServer();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session?.user) {
    return null;
  }

  return {
    id: session.user.id,
    email: session.user.email || null,
    name: session.user.user_metadata.name || null,
    avatarUrl: session.user.user_metadata.avatar_url || null,
  };
} 