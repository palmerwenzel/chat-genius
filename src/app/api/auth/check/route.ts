import { getSupabaseServer } from '@/lib/supabase/supabase-server';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = await getSupabaseServer();
    const {
      data: { user },
      error
    } = await supabase.auth.getUser();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      authenticated: !!user,
      user: user
        ? {
            id: user.id,
            email: user.email,
            lastSignInAt: user.last_sign_in_at
          }
        : null
    });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 