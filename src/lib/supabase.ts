import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';

// Check for required environment variables
const requiredEnvVars = {
  url: process.env.NEXT_PUBLIC_SUPABASE_URL,
  anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  localUrl: process.env.NEXT_PUBLIC_SUPABASE_LOCAL_URL,
  localAnonKey: process.env.NEXT_PUBLIC_SUPABASE_LOCAL_ANON_KEY,
};

// Validate environment variables
Object.entries(requiredEnvVars).forEach(([key, value]) => {
  if (!value) {
    console.warn(`Missing environment variable: ${key}`);
  }
});

// Use local supabase if running in development and LOCAL_SUPABASE is true
const useLocal = process.env.NEXT_PUBLIC_USE_LOCAL_SUPABASE === 'true' && process.env.NODE_ENV === 'development';

const finalUrl = useLocal ? (requiredEnvVars.localUrl || 'http://127.0.0.1:54321') : requiredEnvVars.url;
const finalKey = useLocal ? (requiredEnvVars.localAnonKey || '') : requiredEnvVars.anonKey;

if (!finalUrl || !finalKey) {
  throw new Error('Missing required Supabase configuration. Check your environment variables.');
}

export const supabase = createClient<Database>(finalUrl, finalKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
}); 