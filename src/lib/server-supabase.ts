import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import type { Database } from '@/types/supabase';

export const createServerSupabase = async () => {
  return createServerComponentClient<Database>({ 
    cookies: () => cookies()
  });
} 