import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSupabaseServer } from "./supabase-server";

export async function updateSession(request: NextRequest) {
  // Create the NextResponse to chain
  const supabaseResponse = NextResponse.next({ request });

  const supabase = await getSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  if (
    !user &&
    !request.nextUrl.pathname.startsWith("/login") &&
    !request.nextUrl.pathname.startsWith("/auth")
  ) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}