import { beforeAll } from 'vitest';
import { loadEnv } from 'vite';
import { createClient } from '@supabase/supabase-js';

beforeAll(async () => {
  // Load environment variables from .env.test
  const env = loadEnv('test', process.cwd(), '');
  
  // Make sure required environment variables are available
  const requiredEnvVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY'
  ];

  for (const envVar of requiredEnvVars) {
    if (!env[envVar]) {
      throw new Error(`Required environment variable ${envVar} is not set. Check .env.test file.`);
    }
  }

  // Clean up database before tests
  const supabase = createClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY
  );

  // Delete test data from previous runs
  await supabase.from('reactions').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('messages').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('channel_members').delete().neq('channel_id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('channels').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('users').delete().neq('id', '00000000-0000-0000-0000-000000000000');

  // Delete test auth users
  const { data: users } = await supabase.auth.admin.listUsers();
  const testUsers = users?.users.filter(u => u.email?.includes('@example.com')) || [];
  for (const user of testUsers) {
    await supabase.auth.admin.deleteUser(user.id);
  }
}); 