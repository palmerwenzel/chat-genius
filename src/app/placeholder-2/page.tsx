import { getSupabaseServer } from '@/lib/supabase/supabase-server'
import { login, signup } from '@/app/placeholder/actions'

export default async function PlaceholderPage() {
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  
  return (
    <>
      <pre>{JSON.stringify(user, null, 2)}</pre>
      <form>
        <label htmlFor="email">Email:</label>
        <input id="email" name="email" type="email" required />
        <label htmlFor="password">Password:</label>
        <input id="password" name="password" type="password" required />
        <button formAction={login}>Log in</button>
        <button formAction={signup}>Sign up</button>
      </form>
    </>
  )
}