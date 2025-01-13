import { createServerSupabase } from "@/lib/server-supabase";
import { notFound } from "next/navigation";
import { redirectToChannel } from "@/lib/navigation";

type Props = {
  params: {
    groupId: string;
  };
};

export default async function GroupPage({ params }: Props) {
  const supabase = await createServerSupabase();
  // Middleware ensures session exists
  const { data: { session } } = await supabase.auth.getSession();

  // Get group info and verify membership
  const [{ data: memberGroup }, { data: publicGroup }] = await Promise.all([
    // Check if user is a member
    supabase
      .from('groups')
      .select(`
        id,
        name,
        description,
        visibility,
        group_members!inner (
          role,
          user_id
        )
      `)
      .eq('name', params.groupId)
      .eq('group_members.user_id', session!.user.id)
      .single(),
    
    // Check if it's a public group
    supabase
      .from('groups')
      .select(`
        id,
        name,
        description,
        visibility
      `)
      .eq('name', params.groupId)
      .eq('visibility', 'public')
      .single()
  ]);

  const group = memberGroup || publicGroup;

  if (!group) {
    console.error('Error fetching group: Group not found');
    return notFound();
  }

  // Get first available channel
  const { data: channels } = await supabase
    .from('channels')
    .select(`
      id,
      name,
      channel_members!left (
        role,
        user_id
      )
    `)
    .eq('group_id', group.id)
    .order('name')
    .limit(1);

  // If there's a channel available and user is a member, redirect to it
  if (channels && channels.length > 0 && channels[0].channel_members?.some(m => m.user_id === session!.user.id)) {
    redirectToChannel(params.groupId, channels[0].name);
  }

  // Otherwise show the "no channels" view
  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-8">
      <h1 className="text-2xl font-bold mb-4">{group.name}</h1>
      {group.description && (
        <p className="text-muted-foreground mb-8 max-w-lg">{group.description}</p>
      )}
      <div className="text-muted-foreground">
        {channels && channels.length > 0 
          ? "You don't have access to any channels in this group yet"
          : "This group has no channels yet"}
      </div>
    </div>
  );
} 