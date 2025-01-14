import { getSupabaseServer } from '@/lib/supabase/supabase-server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next') || '/chat';

  if (code) {
    const supabase = await getSupabaseServer();
    await supabase.auth.exchangeCodeForSession(code);
  }

  // Make sure to redirect them to /chat now that they are presumably authed.
  return NextResponse.redirect(new URL(next, requestUrl.origin));
} 