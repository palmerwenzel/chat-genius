import { getSupabaseServer } from "@/lib/supabase/supabase-server";
import { redirect } from "next/navigation";

export default async function ChatPage() {
  const supabase = await getSupabaseServer();

  // Retrieve fresh user data here (revalidates token at the server).
  const {
    data: { user },
    error
  } = await supabase.auth.getUser();

  // If there's no user (edge case), re-redirect to /login
  if (error || !user) {
    redirect("/login");
  }

  // Check if user is in any group. If so, redirect to the first group.
  const { data: groups, error: groupsError } = await supabase
    .from("groups")
    .select(`
      id,
      name,
      description,
      group_members!inner (
        role
      )
    `)
    .eq("group_members.user_id", user.id)
    .order("name")
    .limit(1);

  if (!groupsError && groups && groups.length > 0) {
    redirect(`/chat/${groups[0].name}`);
  }

  // Otherwise, show a prompt that the user is not a member of any group.
  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-8">
      <h1 className="text-2xl font-bold mb-4">Welcome to Chat</h1>
      <p className="text-muted-foreground mb-8 max-w-lg">
        You are not a member of any groups yet. Ask for an invitation or create your own group to get started.
      </p>
    </div>
  );
}