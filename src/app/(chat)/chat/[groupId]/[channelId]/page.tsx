import { Suspense } from "react";
import { ChatInterface } from "@/components/chat/ChatInterface";
import { MessageList } from "@/components/messages/MessageList";
import { MessagesContainer } from "@/components/messages/MessagesContainer";
import { ChannelSidebar } from "@/components/chat/ChannelSidebar";
import { createServerSupabase } from "@/lib/server-supabase";
import { notFound, redirect } from "next/navigation";
import { ChatProvider } from "@/contexts/chat";

export interface PageProps {
  params: {
    groupId: string;
    channelId: string;
  };
  searchParams?: {
    message?: string;
  };
}

export default async function ChannelPage({ params, searchParams = {} }: PageProps) {
  const supabase = await createServerSupabase();

  // Verify auth status
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) {
    redirect('/login');
  }

  // Verify user exists in database
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('id')
    .eq('id', session.user.id)
    .single();

  if (userError || !user) {
    // Clear auth cookies and redirect
    await supabase.auth.signOut();
    redirect('/login');
  }

  // Get group info and verify access
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
      .eq('group_members.user_id', session.user.id)
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

  // Get channel info and verify it belongs to the group
  const [{ data: memberChannel }, { data: publicChannel }] = await Promise.all([
    // Check if user is a member of the channel
    supabase
      .from('channels')
      .select(`
        id,
        name,
        description,
        visibility,
        group_id,
        channel_members!inner (
          role,
          user_id
        )
      `)
      .eq('name', params.channelId)
      .eq('group_id', group.id)
      .eq('channel_members.user_id', session.user.id)
      .single(),
    
    // Check if it's a public channel in this group
    supabase
      .from('channels')
      .select(`
        id,
        name,
        description,
        visibility,
        group_id
      `)
      .eq('name', params.channelId)
      .eq('group_id', group.id)
      .eq('visibility', 'public')
      .single()
  ]);

  const channel = memberChannel || publicChannel;

  if (!channel) {
    console.error('Error fetching channel: Channel not found');
    return notFound();
  }

  // Verify channel belongs to group
  if (channel.group_id !== group.id) {
    console.error('Channel does not belong to group');
    return notFound();
  }

  return (
    <div className="flex h-full min-h-0">
      <div className="flex-1 min-w-0">
        <ChatProvider>
          <ChatInterface
            channelId={channel.id}
            groupId={group.id}
            title={`${group.name} / #${channel.name}`}
            subtitle={channel.description}
          >
            <MessageList channelId={channel.id}>
              <Suspense>
                <MessagesContainer 
                  channelId={channel.id} 
                  highlightMessageId={searchParams.message}
                />
              </Suspense>
            </MessageList>
          </ChatInterface>
        </ChatProvider>
      </div>
      <ChannelSidebar 
        groupId={group.id}
        channelId={channel.id} 
      />
    </div>
  );
} 