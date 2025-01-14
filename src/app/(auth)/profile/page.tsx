import { redirect } from "next/navigation";
import { getSupabaseServer } from "@/lib/supabase/server";

export default async function ProfilePage() {
  const supabase = getSupabaseServer();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (!user || error) {
    return redirect("/login");
  }

  return (
    <main className="p-4">
      <h1 className="text-xl font-bold mb-4">Profile</h1>
      <p>User ID: {user.id}</p>
      <p>Email: {user.email}</p>
    </main>
  );
}