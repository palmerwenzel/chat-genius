import { createServerSupabase } from "@/lib/server-supabase";
import { redirect } from "next/navigation";

export default async function ChatPage() {
  const supabase = await createServerSupabase();

  // Verify auth status
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) {
    redirect('/login');
  }

  // Get user's groups
  const { data: groups } = await supabase
    .from('groups')
    .select(`
      id,
      name,
      description,
      group_members!inner (
        role
      )
    `)
    .eq('group_members.user_id', session.user.id)
    .order('name')
    .limit(1);

  // If user has any groups, redirect to the first one
  if (groups && groups.length > 0) {
    redirect(`/chat/${groups[0].name}`);
  }

  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-8">
      <h1 className="text-2xl font-bold mb-4">Welcome to Chat</h1>
      <p className="text-muted-foreground mb-8 max-w-lg">
        You are not a member of any groups yet. Ask for an invitation or create your own group to get started.
      </p>
    </div>
  );
} 