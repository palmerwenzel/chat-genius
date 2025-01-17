import { createServerSupabase } from "@/lib/server-supabase";
import { notFound } from "next/navigation";

type Props = {
  params: {
    groupId: string;
  };
};

export default async function GroupPage({ params }: Props) {
  const supabase = await createServerSupabase();

  const {
    data: { user },
    error
  } = await supabase.auth.getUser();

  // If there's no user, you can redirect or show a 404 for safety
  if (error || !user) {
    return notFound();
  }

  // Check if the user is a member of this group, or if it is public
  const [{ data: memberGroup }, { data: publicGroup }] = await Promise.all([
    supabase
      .from('groups')
      .select(`
        id,
        name,
        display_name,
        description,
        visibility,
        group_members!inner (
          role,
          user_id
        )
      `)
      .eq('name', params.groupId)
      .eq('group_members.user_id', user.id)
      .single(),
    supabase
      .from('groups')
      .select(`
        id,
        name,
        display_name,
        description,
        visibility
      `)
      .eq('name', params.groupId)
      .eq('visibility', 'public')
      .single()
  ]);

  const group = memberGroup || publicGroup;
  if (!group) {
    console.error('Error fetching group: Group not found or no access');
    return notFound();
  }

  // You could redirect to the first channel or handle it here
  // In your original code, you do a separate fetch for channels.
  // If ultimately you want the user redirected from /chat/[groupId]
  // to /chat/[groupId]/[channelId], you can do that fetch here.
  // For now, we show a group page as an example:

  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-8">
      <h1 className="text-2xl font-bold mb-4">{group.display_name}</h1>
      {group.description && (
        <p className="text-muted-foreground mb-8 max-w-lg">{group.description}</p>
      )}
      <div className="text-muted-foreground">
        {/* etc. */}
      </div>
    </div>
  );
} 