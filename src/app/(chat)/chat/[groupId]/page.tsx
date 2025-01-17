import { createServerSupabase } from "@/lib/server-supabase";
import { notFound } from "next/navigation";
import { redirectToChannel } from "@/lib/navigation";

interface Props {
  params: {
    groupId: string;
  };
}

export default async function GroupPage({ params }: Props) {
  // Await the params at the start
  const groupId = await params.groupId;
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
      .eq('name', groupId)
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
      .eq('name', groupId)
      .eq('visibility', 'public')
      .single()
  ]);

  const group = memberGroup || publicGroup;
  if (!group) {
    console.error('Error fetching group: Group not found or no access');
    return notFound();
  }

  // Get the first available channel for this user
  const [{ data: memberChannels }, { data: publicChannels }] = await Promise.all([
    // Get channels where user is a member
    supabase
      .from('channels')
      .select('name')
      .eq('group_id', group.id)
      .eq('channel_members.user_id', user.id)
      .order('name')
      .limit(1),
    
    // Get public channels
    supabase
      .from('channels')
      .select('name')
      .eq('group_id', group.id)
      .eq('visibility', 'public')
      .order('name')
      .limit(1)
  ]);

  // Use the first available channel (member channel takes precedence)
  const firstChannel = memberChannels?.[0] || publicChannels?.[0];
  
  if (firstChannel) {
    // Redirect to the first channel
    redirectToChannel(group.name, firstChannel.name);
  }

  // If no channels are available, show the group page
  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-8">
      <h1 className="text-2xl font-bold mb-4">{group.display_name}</h1>
      {group.description && (
        <p className="text-muted-foreground mb-8 max-w-lg">{group.description}</p>
      )}
      <div className="text-muted-foreground">
        No channels available. Create a new channel to get started.
      </div>
    </div>
  );
} 