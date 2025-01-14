import { getSupabaseServer } from "@/lib/supabase/supabase-server";
import { redirect } from "next/navigation";

export default async function ChatPage() {
  const supabase = await getSupabaseServer();
  const { data: { user }, error } = await supabase.auth.getUser();

  // If there's no user, redirect to /login
  if (!user || error) {
    redirect("/login");
  }

  // Check if the user has any groups
  const { data: groups } = await supabase
    .from("groups")
    .select("id, name, description, group_members!inner(role)")
    .eq("group_members.user_id", user.id)
    .order("name")
    .limit(1);

  if (groups && groups.length > 0) {
    redirect(`/chat/${groups[0].name}`);
  }

  // Otherwise, let them know they aren't in any groups
  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-8">
      <h1 className="text-2xl font-bold mb-4">Welcome to Chat</h1>
      <p className="text-gray-500 mb-8 max-w-lg">
        You are not a member of any groups yet. Ask for an invitation or create
        your own group to get started.
      </p>
    </div>
  );
}