import { redirect } from 'next/navigation'
import { getSupabaseServer } from '@/lib/supabase/supabase-server'

export default async function RootPage() {
  const supabase = await getSupabaseServer()
  
  // Check authentication status server-side
  const { data: { user } } = await supabase.auth.getUser()

  // If user is authenticated, redirect to chat
  if (user) {
    redirect('/chat')
  }

  // If not authenticated, redirect to login
  redirect('/login')
}
