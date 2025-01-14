import { getSupabaseServer } from '@/lib/supabase/supabase-server';
import { redirect } from 'next/navigation';

export default async function ProfilePage() {
  const supabase = await getSupabaseServer();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (!user || error) {
    return redirect('/login');
  }

  return (
    <main>
      <h1>Profile</h1>
      <p>User ID: {user.id}</p>
      <p>Email: {user.email}</p>
      {/* If you want an update form, you'd add a server action and form here */}
    </main>
  );
}